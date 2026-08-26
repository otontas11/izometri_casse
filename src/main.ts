import { createApp } from 'vue'

import App from './App.vue'
import { auth0Plugin } from './features/auth/auth.plugin'
import { i18n } from './locales'
import applicationRouter from './router'
import { pinia } from './stores'
import './styles/main.css'

const vueApplication = createApp(App)

vueApplication.use(pinia)
vueApplication.use(i18n)
vueApplication.use(applicationRouter)

if (auth0Plugin) {
  vueApplication.use(auth0Plugin)
}

vueApplication.mount('#app')
