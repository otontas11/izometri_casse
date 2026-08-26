import { createApp } from 'vue'

import App from './App.vue'
import { auth0Plugin } from './features/auth/auth.plugin'
import router from './router'
import { pinia } from './stores'
import './assets/styles/main.css'

const app = createApp(App)

app.use(pinia)
app.use(router)

if (auth0Plugin) {
  app.use(auth0Plugin)
}

app.mount('#app')
