import { defineEventHandler, createError, readBody } from '#imports';
import { Op } from 'sequelize';
import { Event } from '../../../../models/Event';
import { Bet } from '../../../../models/Bet';
import { User } from '../../../../models/User';
import { WalletHistory } from '../../../../models/WalletHistory';
import { PendingCommission } from '../../../../models/PendingCommission';

interface ResolveEventBody {
  winningOutcomeId: string;
}

export default defineEventHandler(async (event) => {
  console.log('🎯 [/api/admin/events/resolve] Processing event resolution...');

  const eventId = event.context.params?.id as string;
  const { winningOutcomeId } = await readBody<ResolveEventBody>(event);

  if (!eventId || !winningOutcomeId) {
    throw createError({ statusCode: 400, message: 'شناسه رویداد و نتیجه برنده الزامی است' });
  }

  const transaction = await event.context.sequelize.transaction();

  try {
    const eventInstance = await Event.findByPk(eventId, { transaction, lock: transaction.LOCK.UPDATE });

    if (!eventInstance) throw createError({ statusCode: 404, message: 'رویداد یافت نشد' });
    if (eventInstance.get('status') !== 'ACTIVE') throw createError({ statusCode: 400, message: 'فقط رویدادهای فعال قابل تسویه هستند' });

    const plainEvent = eventInstance.get({ plain: true });

    const allBetsInstances = await Bet.findAll({ where: { eventId, status: 'PENDING' }, transaction, lock: transaction.LOCK.UPDATE });
    const allBets = allBetsInstances.map(b => b.get({ plain: true }));

    // --- START VALIDATION GUARD ---
    const uniqueOutcomeIds = [...new Set(allBets.map(bet => bet.outcomeId))];
    if (allBets.length < 2 || uniqueOutcomeIds.length < 2) {
      // منطق لغو رویداد و بازگشت وجه
      for (const bet of allBets) {
        await User.increment('balance', { by: Number(bet.amount), where: { id: bet.userId }, transaction });
        const user = await User.findByPk(bet.userId, { transaction });
        if (user) {
          const oldBalance = BigInt(user.get('balance') as string) - BigInt(bet.amount!);
          await WalletHistory.create({ userId: bet.userId, amount: bet.amount, type: 'REFUND', balanceBefore: oldBalance.toString(), balanceAfter: user.get('balance') as string, description: `بازگشت وجه: ${plainEvent.title}`, referenceId: bet.id }, { transaction });
        }
      }
      await Bet.update({ status: 'CANCELLED' }, { where: { eventId }, transaction });
      eventInstance.set('status', 'CANCELLED');
      await eventInstance.save({ transaction });
      await transaction.commit();
      return { success: true, message: 'رویداد به دلیل شرط‌بندی ناکافی لغو شد.' };
    }
    // --- END VALIDATION GUARD ---

    const pendingCommissionsInstances = await PendingCommission.findAll({ where: { eventId }, transaction, lock: transaction.LOCK.UPDATE });
    const pendingCommissions = pendingCommissionsInstances.map(pc => pc.get({ plain: true }));

    const totalPool = allBets.reduce((sum, bet) => sum + BigInt(bet.amount!), BigInt(0));
    const winningBets = allBets.filter(bet => bet.outcomeId === winningOutcomeId);
    const totalWinningAmount = winningBets.reduce((sum, bet) => sum + BigInt(bet.amount!), BigInt(0));
    const totalCommission = pendingCommissions.reduce((sum, pc) => sum + BigInt(pc.amount!), BigInt(0));
    const prizePool = totalPool - totalCommission;

    if (prizePool < 0) throw new Error('مجموع کمیسیون‌ها از کل استخر بیشتر است.');

    // پرداخت جوایز
    if (totalWinningAmount > BigInt(0)) {
        for (const bet of winningBets) {
            const prizeAmount = (BigInt(bet.amount!) * prizePool) / totalWinningAmount;
            await User.increment('balance', { by: Number(prizeAmount.toString()), where: { id: bet.userId }, transaction });
            const user = await User.findByPk(bet.userId, { transaction });
            if (user) {
                const oldBalance = BigInt(user.get('balance') as string) - prizeAmount;
                await WalletHistory.create({ userId: bet.userId, amount: prizeAmount.toString(), type: 'WIN', balanceBefore: oldBalance.toString(), balanceAfter: user.get('balance') as string, description: `جایزه برد در رویداد: ${plainEvent.title}`, referenceId: bet.id }, { transaction });
            }
        }
    }

    // پرداخت کمیسیون‌ها
    for (const commission of pendingCommissions) {
        await User.increment('balance', { by: Number(commission.amount), where: { id: commission.userId }, transaction });
        const user = await User.findByPk(commission.userId, { transaction });
        if (user) {
            const oldBalance = BigInt(user.get('balance') as string) - BigInt(commission.amount!);
            await WalletHistory.create({ userId: commission.userId, amount: commission.amount, type: 'COMMISSION', balanceBefore: oldBalance.toString(), balanceAfter: user.get('balance') as string, description: `کمیسیون از رویداد: ${plainEvent.title}`, referenceId: commission.id }, { transaction });
        }
    }
    await PendingCommission.update({ status: 'PAID' }, { where: { eventId }, transaction });

    // به‌روزرسانی وضعیت شرط‌ها
    const winningBetIds = winningBets.map(b => b.id as string);
    await Bet.update({ status: 'WON' }, { where: { id: winningBetIds }, transaction });
    await Bet.update({ status: 'LOST' }, { where: { eventId, id: { [Op.notIn]: winningBetIds } }, transaction });

    // به‌روزرسانی وضعیت رویداد
    eventInstance.set('status', 'RESOLVED');
    eventInstance.set('winningOutcomeId', winningOutcomeId);
    await eventInstance.save({ transaction });

    await transaction.commit();

    return { success: true, message: 'رویداد با موفقیت تسویه شد' };

  } catch (error: any) {
    await transaction.rollback();
    console.error('🔴 Error resolving event:', error);
    throw createError({ statusCode: 500, message: error.message || 'خطا در تسویه رویداد' });
  }
});