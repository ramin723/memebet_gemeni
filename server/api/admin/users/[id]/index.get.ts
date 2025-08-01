import { defineEventHandler, createError, getRouterParam } from 'h3';
import { User } from '../../../../models/User';
import { Bet } from '../../../../models/Bet';
import { Event } from '../../../../models/Event';
import { WalletHistory } from '../../../../models/WalletHistory';
import adminMiddleware from '../../../../middleware/02.admin';
import sequelize from '../../../../plugins/sequelize'; // Import sequelize instance
import { fn, col, literal } from 'sequelize'; // Import necessary functions

export default defineEventHandler(async (event) => {
  await adminMiddleware(event);

  try {
    const userId = getRouterParam(event, 'id');
    if (!userId) {
      throw createError({ statusCode: 400, statusMessage: 'شناسه کاربر الزامی است' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw createError({ statusCode: 404, statusMessage: 'کاربر یافت نشد' });
    }

    // 1. Fetch Bets Stats
    const betsStats = await Bet.findOne({
      where: { userId },
      attributes: [
        [fn('COUNT', col('id')), 'totalBets'],
        [fn('SUM', col('amount')), 'totalBetAmount'],
        [fn('COUNT', literal("CASE WHEN status = 'WON' THEN 1 END")), 'wonBets'],
        [fn('COUNT', literal("CASE WHEN status = 'LOST' THEN 1 END")), 'lostBets'],
      ],
      raw: true,
    });

    // 2. Fetch Wallet History Stats
    const walletStats = await WalletHistory.findOne({
        where: { userId },
        attributes: [
            [fn('SUM', literal("CASE WHEN type = 'DEPOSIT' THEN amount ELSE 0 END")), 'totalDepositAmount'],
            [fn('SUM', literal("CASE WHEN type = 'WIN' THEN amount ELSE 0 END")), 'totalWinAmount'],
            [fn('SUM', literal("CASE WHEN type = 'WITHDRAWAL' THEN amount ELSE 0 END")), 'totalWithdrawalAmount'],
        ],
        raw: true,
    });

    // 3. Fetch recent activities
    const recentBets = await Bet.findAll({
      where: { userId },
      include: [{ model: Event, as: 'event', attributes: ['id', 'title'] }],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    const plainUser = user.get({ plain: true });

    return {
      success: true,
      data: {
        user: plainUser,
        statistics: {
          betting: {
            totalBets: Number((betsStats as any)?.totalBets || 0),
            totalBetAmount: ((betsStats as any)?.totalBetAmount || '0').toString(),
            wonBets: Number((betsStats as any)?.wonBets || 0),
            lostBets: Number((betsStats as any)?.lostBets || 0),
          },
          financial: {
            totalDeposits: ((walletStats as any)?.totalDepositAmount || '0').toString(),
            totalWins: ((walletStats as any)?.totalWinAmount || '0').toString(),
            totalWithdrawals: ((walletStats as any)?.totalWithdrawalAmount || '0').toString(),
          }
        },
        recentActivity: {
          bets: recentBets.map(b => b.get({ plain: true })),
        }
      }
    };

  } catch (error: any) {
    console.error('Error fetching user details:', error);
    throw createError({ statusCode: 500, statusMessage: 'خطا در دریافت اطلاعات کاربر' });
  }
});