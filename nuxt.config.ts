import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-15',
  devtools: { enabled: true },
  modules: ['@nuxt/fonts', 'shadcn-nuxt', '@nuxtjs/color-mode'],
  colorMode: {
    classSuffix: '',
    preference: 'dark',
    fallback: 'dark',
  },
  css: ['~/assets/css/main.css'],
  fonts: {
    defaults: {
      weights: [400, 500, 600, 700],
    },
    families: [
      {
        name: 'Geist',
        provider: 'google',
        global: true,
      },
      {
        name: 'Space Grotesk',
        provider: 'google',
        global: true,
      },
      {
        name: 'JetBrains Mono',
        provider: 'google',
        global: true,
      },
    ],
  },
  vite: {
    plugins: [tailwindcss()],
  },
  shadcn: {
    prefix: '',
    componentDir: '@/components/ui',
  },
  app: {
    head: {
      title: 'Vault',
      htmlAttrs: { class: 'font-sans antialiased' },
    },
  },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL ?? '',
  },
})
