import { defineEventHandler, createError, readBody } from 'h3';
import { Event } from '../../models/Event';
import { User } from '../../models/User';
import { Outcome } from '../../models/Outcome';
import { EventTemplate } from '../../models/EventTemplate';
import type { TemplateStructure } from '../../types/EventTemplateInterface';

interface CreateEventBody {
  templateId?: string;
  templateInputs?: Record<string, string>;
  title?: string;
  description?: string;
  bettingDeadline: Date;
  outcomes?: Array<{ title: string }>;
}

// Helper function to build title from template
const buildTitleFromTemplate = (structure: TemplateStructure, inputs: Record<string, string>): string => {
  let title = structure.titleStructure;
  for (const input of structure.inputs) {
    if (inputs[input.name]) {
      title = title.replace(`[${input.name}]`, inputs[input.name]);
    }
  }
  return title;
};

export default defineEventHandler(async (event) => {
  if (!event.context.user) {
    throw createError({ statusCode: 401, message: 'احراز هویت مورد نیاز است' });
  }

  const body = await readBody<CreateEventBody>(event);
  const transaction = await event.context.sequelize.transaction();

  try {
    let eventData: {
      title: string;
      description: string;
      creatorId: string;
      bettingDeadline: Date;
      status: 'PENDING_APPROVAL';
    };
    let eventOutcomes: Array<{ title: string }>;

    if (body.templateId) {
      // --- Logic for creating from a template ---
      const template = await EventTemplate.findByPk(body.templateId, { transaction });
      if (!template || !template.get('isActive')) {
        throw createError({ statusCode: 404, message: 'قالب مورد نظر یافت نشد یا غیرفعال است' });
      }

      const plainTemplate = template.get({ plain: true });
      const structure = plainTemplate.structure as TemplateStructure;

      eventData = {
        title: buildTitleFromTemplate(structure, body.templateInputs || {}),
        description: plainTemplate.description || 'ایجاد شده از قالب',
        creatorId: event.context.user.id,
        bettingDeadline: new Date(body.bettingDeadline),
        status: 'PENDING_APPROVAL',
      };

      eventOutcomes = structure.templateType === 'COMPETITIVE' 
        ? body.outcomes || [] 
        : structure.outcomes || [{ title: 'بله' }, { title: 'خیر' }];

      if (eventOutcomes.length < 2) {
         throw createError({ statusCode: 400, message: 'برای رویدادهای رقابتی باید حداقل دو گزینه مشخص شود.' });
      }

    } else {
      // --- Logic for creating directly ---
      if (!body.title || !body.description || !body.outcomes || body.outcomes.length < 2) {
        throw createError({ statusCode: 400, message: 'title, description و حداقل دو outcome الزامی است' });
      }
      eventData = {
        title: body.title,
        description: body.description,
        creatorId: event.context.user.id,
        bettingDeadline: new Date(body.bettingDeadline),
        status: 'PENDING_APPROVAL',
      };
      eventOutcomes = body.outcomes;
    }

    const newEventInstance = await Event.create(eventData, { transaction });
    const newEvent = newEventInstance.get({ plain: true });

    const outcomePromises = eventOutcomes.map(outcome => {
      return Outcome.create({
        eventId: newEvent.id,
        title: outcome.title,
      }, { transaction });
    });
    await Promise.all(outcomePromises);

    await transaction.commit();

    // Fetch the full event with outcomes to return
    const createdEvent = await Event.findByPk(newEvent.id, {
       include: [{ model: Outcome, as: 'outcomes' }]
    });

    return { success: true, message: 'رویداد با موفقیت ایجاد شد', data: createdEvent?.get({ plain: true }) };

  } catch (error: any) {
    await transaction.rollback();
    console.error('🔴 Error creating event:', error);
    if (error.statusCode) throw error;
    throw createError({ statusCode: 500, message: 'خطا در ایجاد رویداد.' });
  }
});