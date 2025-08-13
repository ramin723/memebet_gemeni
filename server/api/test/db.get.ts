import { defineEventHandler } from 'h3'
import { sequelize } from '~/server/plugins/sequelize'

export default defineEventHandler(async () => {
  await sequelize.authenticate()
  const [result] = await sequelize.query('SELECT 1 AS ok')
  return { ok: true, db: result }
})
