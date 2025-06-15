import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'

// Import custom CSS theme
import './assets/css/theme.css'
import '@mdi/font/css/materialdesignicons.css' // <- 이 라인이 있어야 함

// Dark theme variables
const darkNavy = {
  dark: true,
  colors: {
    primary: '#1E3A8A', // Navy blue
    secondary: '#3B82F6', // Bright blue
    accent: '#10B981', // Emerald
    error: '#EF4444', // Red
    info: '#3B82F6', // Blue
    success: '#10B981', // Green
    warning: '#F59E0B', // Amber
    active: '#10B981', // Green for active status
    inactive: '#EF4444', // Red for inactive status
    repair: '#F59E0B', // Amber for repair status
    background: '#0F172A', // Dark blue background
    surface: '#1E293B', // Slightly lighter surface color
    'surface-variant': '#1E293B', // Ensures surface components use navy color
    'on-surface-variant': '#94A3B8', // Text on surface variant
    'on-surface': '#E2E8F0', // Text on surface
    'on-background': '#F1F5F9', // Text on background
  },
  variables: {
    // Increase contrast of dark theme
    'border-color': '#334155',
    'theme-kbd-background-color': '#334155',
    'theme-code-background-color': '#1E293B',
    'theme-selection-background-color': '#3B82F6',
    'theme-app-bar-background-color': '#0F172A',
    'high-emphasis-opacity': 0.95,
    'medium-emphasis-opacity': 0.85,
  },
}

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'darkNavy',
    themes: {
      darkNavy,
    },
    variations: {
      colors: ['primary', 'secondary', 'accent', 'error', 'info', 'success', 'warning'],
      lighten: 4,
      darken: 4,
    },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  display: {
    thresholds: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
})

// Create the Vue app with the updated configuration
const app = createApp(App)

app.use(router)
app.use(vuetify)

app.mount('#app')
