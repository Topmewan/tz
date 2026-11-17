export default defineNuxtConfig({
  modules: ['@pinia/nuxt', '@nuxt/eslint'],
  ssr: false,
  devtools: {
    enabled: false,
  },
  css: ['~/assets/scss/main.scss'],
  typescript: {
    strict: true,
  },
  eslint: {
    config: {
      stylistic: true,
      formatters: {
        css: true,
      },
    },
  },
})
