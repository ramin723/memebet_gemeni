// app.config.ts

export default defineAppConfig({
  ui: {
    // پیکربندی UI بدون commandPalette
    colors: {
      primary: 'green',
      secondary: 'blue',
      success: 'green',
      info: 'blue',
      warning: 'yellow',
      error: 'red',
      neutral: 'slate'
    },
    icons: {
      arrowLeft: "i-lucide-arrow-left",
      arrowRight: "i-lucide-arrow-right",
      check: "i-lucide-check",
      chevronDoubleLeft: "i-lucide-chevrons-left",
      chevronDoubleRight: "i-lucide-chevrons-right",
      chevronDown: "i-lucide-chevron-down",
      chevronLeft: "i-lucide-chevron-left",
      chevronRight: "i-lucide-chevron-right",
      chevronUp: "i-lucide-chevron-up",
      close: "i-lucide-x",
      ellipsis: "i-lucide-ellipsis",
      external: "i-lucide-arrow-up-right",
      file: "i-lucide-file",
      folder: "i-lucide-folder",
      folderOpen: "i-lucide-folder-open",
      minus: "i-lucide-minus",
      plus: "i-lucide-plus",
      search: "i-lucide-search",
      upload: "i-lucide-upload"
    }
  }
})