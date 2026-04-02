import tailwindcss from "@tailwindcss/vite"

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-01-15",
  devtools: { enabled: true },
  modules: ["shadcn-nuxt"],
  css: ["~/assets/css/main.css"],
  vite: {
    plugins: [tailwindcss()],
  },
  shadcn: {
    prefix: "",
    componentDir: "@/components/ui",
  },
  app: {
    head: {
      htmlAttrs: { class: "dark" },
    },
  },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL ?? "",
  },
})
