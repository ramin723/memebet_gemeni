import { defineEventHandler, createError } from 'h3'

export default defineEventHandler(async (event) => {
  if (process.env.NODE_ENV !== 'development') {
    throw createError({ statusCode: 403, message: 'This endpoint is only available in development mode.' });
  }

  try {
    console.log('🔍 Checking database status...');
    
    // بررسی وجود sequelize در context
    console.log('🔧 Sequelize in context:', !!event.context.sequelize);
    console.log('🔧 Context keys:', Object.keys(event.context));
    
    if (!event.context.sequelize) {
      throw createError({
        statusCode: 500,
        message: 'Sequelize not found in context'
      });
    }
    
    // بررسی وجود جدول outcomes
    const [outcomesTableExists] = await event.context.sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'outcomes')"
    );
    
    console.log('📊 Outcomes table exists:', outcomesTableExists[0].exists);
    
    if (outcomesTableExists[0].exists) {
      // بررسی ستون‌های جدول outcomes
      const [outcomesColumns] = await event.context.sequelize.query(
        "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'outcomes' ORDER BY ordinal_position"
      );
      
      console.log('📋 Outcomes table columns:', outcomesColumns);
      
      // بررسی ENUM types
      const [enumTypes] = await event.context.sequelize.query(
        "SELECT t.typname, e.enumlabel FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname LIKE '%outcome%' OR t.typname LIKE '%status%'"
      );
      
      console.log('🔤 ENUM types related to outcomes:', enumTypes);
    }
    
    return {
      success: true,
      outcomesTableExists: outcomesTableExists[0].exists,
      outcomesColumns: outcomesTableExists[0].exists ? outcomesColumns : null,
      enumTypes
    };
    
  } catch (error: any) {
    console.error('❌ Database check failed:', error);
    throw createError({
      statusCode: 500,
      message: 'Database check failed',
      data: { details: error.message }
    });
  }
});
