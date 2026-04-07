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
    jwtSecret: process.env.JWT_SECRET ?? '',
    resendApiKey: process.env.RESEND_API_KEY ?? '',
    appUrl: process.env.APP_URL ?? 'http://localhost:3000',
    resendFromEmail:
      process.env.RESEND_FROM_EMAIL ?? 'Vault <onboarding@resend.dev>',
  },
})
