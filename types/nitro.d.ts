import { Sequelize } from 'sequelize'

declare module 'nitropack' {
  interface NitroEventContext {
    sequelize: Sequelize
  }
}

// Development utilities types
declare module '#app' {
  interface NuxtApp {
    $devFetch: (url: string, options?: any) => Promise<any>
  }
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $devFetch: (url: string, options?: any) => Promise<any>
    $route: {
      path: string
      name?: string
      params: Record<string, string>
      query: Record<string, string>
    }
  }
} 