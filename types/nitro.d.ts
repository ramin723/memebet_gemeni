import { Sequelize } from 'sequelize'

declare module 'nitropack' {
  interface NitroEventContext {
    sequelize: Sequelize
  }
} 