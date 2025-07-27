export default defineEventHandler(async (event) => {
  try {
    // دسترسی به sequelize از context
    const sequelize = event.context.sequelize
    
    if (!sequelize) {
      throw new Error('Sequelize instance not found in context')
    }
    
    // تست اتصال
    await sequelize.authenticate()
    
    return {
      success: true,
      message: 'Database connection is working!',
      timestamp: new Date().toISOString()
    }
    
  } catch (error) {
    console.error('Database test failed:', error)
    
    return {
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
}) 