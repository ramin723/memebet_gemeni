import { defineEventHandler, createError, readBody } from 'h3';
import { Event } from '../../models/Event';
import { User } from '../../models/User';
import { Outcome } from '../../models/Outcome';
import { EventTemplate } from '../../models/EventTemplate';
import type { TemplateStructure, OutcomesStructure } from '../../types/EventTemplateInterface';

interface CreateEventBody {
  templateId?: string;
  templateInputs?: Record<string, string>;
  title?: string;
  description?: string;
  bettingDeadline: Date;
  outcomes?: Array<{ title: string }> | string[];
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

// Helper function to normalize outcomes
const normalizeOutcomes = (outcomes: Array<{ title: string }> | string[]): Array<{ title: string }> => {
  if (Array.isArray(outcomes) && outcomes.length > 0 && typeof outcomes[0] === 'string') {
    return (outcomes as string[]).map(title => ({ title }));
  }
  return outcomes as Array<{ title: string }>;
};

// Helper function to validate dynamic outcomes
const validateDynamicOutcomes = (outcomes: Array<{ title: string }> | string[], outcomesStructure: OutcomesStructure): void => {
  // 1. Check if outcomes key exists
  if (!outcomes || !Array.isArray(outcomes)) {
    throw createError({ statusCode: 400, message: 'کلید outcomes باید یک آرایه باشد' });
  }

  // 2. Check array type
  if (!Array.isArray(outcomes)) {
    throw createError({ statusCode: 400, message: 'مقدار outcomes باید یک آرایه باشد' });
  }

  // 3. Check number of options
  if (outcomesStructure.min && outcomes.length < outcomesStructure.min) {
    throw createError({ 
      statusCode: 400, 
      message: `حداقل ${outcomesStructure.min} گزینه باید مشخص شود` 
    });
  }

  if (outcomesStructure.max && outcomes.length > outcomesStructure.max) {
    throw createError({ 
      statusCode: 400, 
      message: `حداکثر ${outcomesStructure.max} گزینه مجاز است` 
    });
  }

  // Normalize outcomes for validation
  const normalizedOutcomes = normalizeOutcomes(outcomes);

  // 4. Check content of options
  for (let i = 0; i < normalizedOutcomes.length; i++) {
    const outcome = normalizedOutcomes[i];
    if (!outcome.title || typeof outcome.title !== 'string' || outcome.title.trim() === '') {
      throw createError({ 
        statusCode: 400, 
        message: `گزینه ${i + 1} باید یک متن غیرخالی باشد` 
      });
    }

    // 5. Check length limit (100 characters)
    if (outcome.title.length > 100) {
      throw createError({ 
        statusCode: 400, 
        message: `طول گزینه ${i + 1} نباید از ۱۰۰ کاراکتر بیشتر باشد` 
      });
    }
  }

  // 6. Check for duplicates
  const titles = normalizedOutcomes.map(o => o.title.toLowerCase().trim());
  const uniqueTitles = new Set(titles);
  if (uniqueTitles.size !== titles.length) {
    throw createError({ 
      statusCode: 400, 
      message: 'گزینه‌ها نباید تکراری باشند' 
    });
  }
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
      isCustom?: boolean;
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
      const outcomesStructure = plainTemplate.outcomesStructure as OutcomesStructure;

      eventData = {
        title: buildTitleFromTemplate(structure, body.templateInputs || {}),
        description: plainTemplate.description || 'ایجاد شده از قالب',
        creatorId: event.context.user.id,
        bettingDeadline: new Date(body.bettingDeadline),
        status: 'PENDING_APPROVAL',
        isCustom: false, // Created from template
      };

      // Handle outcomes based on outcomesStructure
      if (outcomesStructure && outcomesStructure.type === 'DYNAMIC') {
        // Dynamic outcomes - user must provide them
        if (!body.outcomes) {
          throw createError({ 
            statusCode: 400, 
            message: 'برای این قالب باید گزینه‌ها را مشخص کنید' 
          });
        }
        
        // Validate dynamic outcomes
        validateDynamicOutcomes(body.outcomes, outcomesStructure);
        // Convert string array to object array if needed
        eventOutcomes = normalizeOutcomes(body.outcomes);
      } else {
        // Fixed outcomes - use template defaults or provided outcomes
        if (outcomesStructure && outcomesStructure.type === 'FIXED' && outcomesStructure.options) {
          eventOutcomes = outcomesStructure.options;
        } else {
          // Fallback to old logic
          if (structure.templateType === 'COMPETITIVE') {
            eventOutcomes = body.outcomes ? normalizeOutcomes(body.outcomes) : [];
          } else {
            eventOutcomes = structure.outcomes || [{ title: 'بله' }, { title: 'خیر' }];
          }
        }

        if (eventOutcomes.length < 2) {
          throw createError({ 
            statusCode: 400, 
            message: 'برای رویدادهای رقابتی باید حداقل دو گزینه مشخص شود.' 
          });
        }
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
        isCustom: true, // Created directly (custom)
      };
      eventOutcomes = normalizeOutcomes(body.outcomes);
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