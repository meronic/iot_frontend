<template>
  <v-app theme="darkNavy" class="app-dark-theme">
    <!-- Navy-themed app bar with depth effect -->
    <v-app-bar 
      app
      color="background"
      class="app-bar-blur"
      flat
      :elevation="2"
    >
      <v-app-bar-nav-icon @click="drawer = !drawer" color="on-background"></v-app-bar-nav-icon>
      <v-app-bar-title class="font-weight-bold d-flex align-center">
        <v-icon color="primary" class="mr-2" icon="mdi-view-dashboard"></v-icon>
        <span class="text-h5 gradient-text">IoT Monitor</span>
        <span class="text-caption ml-2 text-blue-lighten-4">DASHBOARD</span>
      </v-app-bar-title>
      
      <!-- Navigation buttons - enhanced visibility -->
      <div class="navigation-buttons d-none d-md-flex">
        <v-btn
          v-for="(item, i) in menuItems"
          :key="i"
          :to="item.path"
          :variant="$route.path === item.path ? 'elevated' : 'tonal'"
          class="navigation-btn mx-1 px-4 py-2 font-weight-medium"
          :class="{ 'active-nav-btn': $route.path === item.path }"
          :color="$route.path === item.path ? 'primary' : 'primary'"
          rounded="lg"
        >
          <v-icon :icon="item.icon" class="mr-2" size="small"></v-icon>
          {{ item.title }}
        </v-btn>
      </div>
      
      <v-spacer></v-spacer>
      
      <!-- Refresh button with animation -->
      <v-btn 
        icon 
        class="mr-2" 
        @click="refreshData" 
        :loading="isRefreshing"
        :color="isRefreshing ? 'primary' : 'on-background'"
        variant="text"
      >
        <v-icon>mdi-refresh</v-icon>
        <template v-slot:loader>
          <span class="custom-loader">
            <v-icon>mdi-cached</v-icon>
          </span>
        </template>
      </v-btn>
      
      <!-- Notification handled at the bottom of the template -->
    </v-app-bar>

    <!-- Dark navy navigation drawer -->
    <v-navigation-drawer 
      v-model="drawer" 
      app 
      :elevation="4"
      color="surface"
      theme="darkNavy"
      class="navy-drawer"
    >
      <div class="pa-4">
        <div class="d-flex align-center mb-4">
          <v-icon 
            icon="mdi-server-network" 
            color="primary" 
            size="x-large" 
            class="mr-2"
          ></v-icon>
          <div>
            <div class="text-h6 font-weight-bold gradient-text">IoT Monitoring</div>
            <div class="text-caption text-blue-lighten-4">Device Management Platform</div>
          </div>
        </div>
        <v-divider class="mb-2 border-opacity-1"></v-divider>
      </div>

      <!-- Enhanced Navigation menu with better visibility and selected indicators -->
      <v-list nav class="px-2">
        <v-list-item
          v-for="(item, i) in menuItems"
          :key="i"
          :value="item"
          :to="item.path"
          rounded="lg"
          class="mb-3 nav-item py-2"
          :class="{ 'nav-item-active': $route.path === item.path }"
          :bg-color="$route.path === item.path ? 'primary' : 'transparent'"
          color="white"
          font-weight="medium"
        >
          <template v-slot:prepend>
            <v-icon :icon="item.icon" size="medium" class="mr-3"></v-icon>
          </template>
          <v-list-item-title class="text-body-1">{{ item.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
      
      <!-- Status summary at bottom of drawer -->
      <template v-slot:append>
        <div class="pa-3">
          <v-divider class="mb-3"></v-divider>
          <v-sheet rounded class="pa-3 mb-2 status-card" color="primary" :elevation="1">
            <div class="d-flex justify-space-between align-center">
              <div class="d-flex align-center">
                <div class="status-dot status-active mr-2"></div>
                <span class="text-caption">Active Devices</span>
              </div>
              <span class="font-weight-bold">{{ summary.status?.active || 0 }}</span>
            </div>
          </v-sheet>
          <v-sheet rounded class="pa-3 mb-2 status-card" color="error" :elevation="1" v-if="summary.status?.inactive">
            <div class="d-flex justify-space-between align-center">
              <div class="d-flex align-center">
                <div class="status-dot status-inactive mr-2"></div>
                <span class="text-caption">Inactive</span>
              </div>
              <span class="font-weight-bold">{{ summary.status.inactive }}</span>
            </div>
          </v-sheet>
          <v-sheet rounded class="pa-3 status-card" color="warning" :elevation="1" v-if="summary.status?.under_repair">
            <div class="d-flex justify-space-between align-center">
              <div class="d-flex align-center">
                <div class="status-dot status-repair mr-2"></div>
                <span class="text-caption">Under Repair</span>
              </div>
              <span class="font-weight-bold">{{ summary.status.under_repair }}</span>
            </div>
          </v-sheet>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Main content area with dark navy background -->
    <v-main class="main-content">
      <v-container fluid class="pa-6">
        <router-view></router-view>
      </v-container>
    </v-main>

    <!-- Dark navy footer -->
    <v-footer app color="background" class="text-caption px-6 footer-dark" :elevation="2">
      <div>&copy; {{ new Date().getFullYear() }} IoT Device Monitoring Dashboard</div>
      <v-spacer></v-spacer>
      <div class="d-flex align-center">
        <v-icon icon="mdi-circle" size="x-small" color="primary" class="mr-2"></v-icon>
        <span>v1.0.0</span>
      </div>
    </v-footer>

    <!-- Notification Snackbar -->
    <v-snackbar
      v-model="notification.show"
      :timeout="notification.timeout"
      :color="notification.color"
      :location="notification.location"
      variant="elevated"
      rounded="lg"
      class="notification-snackbar"
    >
      <div class="d-flex align-center">
        <v-icon 
          :icon="notificationIcon" 
          class="mr-3" 
          size="small"
        ></v-icon>
        <span>{{ notification.text }}</span>
      </div>
      <template v-slot:actions>
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="notification.show = false"
        ></v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import axios from 'axios';

export default {
  name: 'App',
  setup() {
    const drawer = ref(null);
    const summary = ref({
      status: {
        active: 0,
        inactive: 0,
        under_repair: 0
      }
    });
    const refreshInterval = ref(null);
    const isRefreshing = ref(false);
    const notification = ref({
      show: false,
      text: '',
      color: 'success',
      timeout: 3000,
      location: 'top'
    });

    const notificationIcon = computed(() => {
      switch(notification.value.color) {
        case 'success': return 'mdi-check-circle-outline';
        case 'error': return 'mdi-alert-circle-outline';
        case 'warning': return 'mdi-alert-outline';
        case 'info': return 'mdi-information-outline';
        default: return 'mdi-bell-outline';
      }
    });

    // Notification functions
    const showNotification = (text, color = 'success', timeout = 3000) => {
      notification.value = {
        show: true,
        text,
        color,
        timeout,
        location: 'top'
      };
    };

    const menuItems = [
      { title: 'Dashboard', icon: 'mdi-view-dashboard', path: '/' },
      { title: 'Devices', icon: 'mdi-devices', path: '/devices' },
      { title: 'Systems', icon: 'mdi-server-network', path: '/systems' },
      { title: 'Repair History', icon: 'mdi-wrench', path: '/repair-history' }
    ];

    const totalAlerts = computed(() => {
      const inactive = summary.value.status?.inactive || 0;
      const repair = summary.value.status?.under_repair || 0;
      return inactive + repair;
    });

    const fetchSummary = async () => {
      try {
        const response = await axios.get('/api/summary');
        summary.value = response.data;
      } catch (error) {
        console.error('Error fetching summary data:', error);
      }
    };

    // Refresh data function with loading indicator
    const refreshData = async () => {
      isRefreshing.value = true;
      try {
        await fetchSummary();
        showNotification('Dashboard data refreshed successfully', 'success', 2000);
      } catch (error) {
        console.error('Error refreshing data:', error);
        showNotification('Failed to refresh dashboard data', 'error', 4000);
      } finally {
        setTimeout(() => {
          isRefreshing.value = false;
        }, 500);
      }
    };

    // Set up auto-refresh
    onMounted(() => {
      fetchSummary();
      refreshInterval.value = setInterval(fetchSummary, 60000); // 60 seconds
    });

    onBeforeUnmount(() => {
      if (refreshInterval.value) {
        clearInterval(refreshInterval.value);
      }
    });

    return {
      drawer,
      menuItems,
      summary,
      totalAlerts,
      isRefreshing,
      refreshData,
      notification,
      notificationIcon,
      showNotification
    };
  }
};
</script>

<style>
/* Global styles for dark navy theme application */
:root {
  /* These variables should match those in theme.css */
  --app-background: var(--bg-primary, #0F172A);
  --surface-color: var(--bg-secondary, #1E293B);
  --primary-color: var(--primary-color, #3B82F6);
  --secondary-color: var(--secondary-color, #8B5CF6);
  --accent-color: var(--active-color, #10B981);
  --text-color: var(--text-primary, #F1F5F9);
  --text-muted: var(--text-muted, #94A3B8);
  --border-color: var(--border-color, rgba(148, 163, 184, 0.15));
  --active-color: var(--active-color, #10B981);
  --inactive-color: var(--inactive-color, #EF4444);
  --repair-color: var(--repair-color, #F59E0B);
}

/* Basic element styling */
html, body {
  background-color: var(--app-background);
  color: var(--text-color);
}

.v-application {
  font-family: 'Roboto', sans-serif;
  background-color: var(--app-background) !important;
}

/* Applied dark theme overrides */
.app-dark-theme {
  background-color: var(--app-background) !important;
  color: var(--text-color) !important;
}

/* App bar blur effect with glass morphism */
.app-bar-blur {
  backdrop-filter: blur(10px);
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.85)) !important;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

/* Main content styling with gradient background */
.main-content {
  background: radial-gradient(ellipse at top, #1e293b, #0f172a) !important;
  color: var(--text-color) !important;
  position: relative;
  overflow: hidden;
}

/* Add subtle pattern overlay to main content */
.main-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233b82f6' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  opacity: 0.3;
  z-index: 0;
  pointer-events: none;
}

/* Navigation drawer styling with glass effect */
.navy-drawer {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.9)) !important;
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(148, 163, 184, 0.2) !important;
  box-shadow: 5px 0 20px rgba(0, 0, 0, 0.3);
}

/* Footer styling with subtle gradient */
.footer-dark {
  border-top: 1px solid rgba(148, 163, 184, 0.2) !important;
  color: var(--text-muted) !important;
  background: linear-gradient(0deg, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.85)) !important;
  backdrop-filter: blur(8px);
}

/* Text styling */
.text-h5 {
  letter-spacing: 0.5px;
}

.text-caption {
  letter-spacing: 1.5px;
}

.gradient-text {
  background: linear-gradient(45deg, #3B82F6, #10B981);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
}

/* Card styling with glass morphism effect */
.v-card {
  background: linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.8)) !important;
  border: 1px solid rgba(148, 163, 184, 0.15) !important;
  backdrop-filter: blur(10px);
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out, border-color 0.2s ease-out;
  position: relative;
  z-index: 1;
}

.v-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3) !important;
  border: 1px solid rgba(59, 130, 246, 0.5) !important;
}

/* Add subtle glow to cards on hover */
.v-card:hover::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  border-radius: 3px 3px 0 0;
}

/* Status cards with enhanced glass effect */
.status-card {
  background: linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.5)) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(148, 163, 184, 0.15) !important;
  transition: all 0.2s ease-out;
  overflow: hidden;
  position: relative;
}

.status-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2) !important;
  border-color: rgba(59, 130, 246, 0.3) !important;
}

/* Add subtle glow effect to status cards */
.status-card::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.1), transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.status-card:hover::after {
  opacity: 1;
}

/* Button styling with glossy effect */
.v-btn {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.v-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Navigation buttons - enhanced for better visibility */
.navigation-buttons {
  margin-left: 32px;
  display: flex;
  gap: 12px;
}

.navigation-btn {
  position: relative;
  font-weight: 500 !important;
  letter-spacing: 0.5px;
  font-size: 1rem !important;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.navigation-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.active-nav-btn {
  font-weight: 700 !important;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

/* Responsive navigation adjustments */
@media (max-width: 960px) {
  .navigation-buttons {
    margin-left: 16px;
    gap: 8px;
  }
  
  .navigation-btn {
    padding: 6px 12px !important;
  }
}

/* Primary action buttons */
.v-btn.v-btn--variant-elevated {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark)) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
}

/* Add subtle shine animation to primary buttons */
.v-btn.v-btn--variant-elevated::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    to right,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  transform: rotate(30deg);
  transition: all 0.5s;
  opacity: 0;
}

.v-btn.v-btn--variant-elevated:hover::after {
  opacity: 1;
  left: 100%;
  transition: all 0.5s;
}

/* Custom animation for refresh button */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.custom-loader {
  animation: spin 1s linear infinite;
}

/* Status indicators as dots */
.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.status-active {
  background-color: var(--active-color);
  box-shadow: 0 0 6px 1px var(--active-color);
}

.status-inactive {
  background-color: var(--inactive-color);
  box-shadow: 0 0 6px 1px var(--inactive-color);
}

.status-repair {
  background-color: var(--repair-color);
  box-shadow: 0 0 6px 1px var(--repair-color);
}

/* Navigation item styling with modern glass effect */
.nav-item {
  opacity: 0.85;
  transition: all 0.3s ease;
  margin-bottom: 8px;
  border-radius: 8px !important;
  overflow: hidden;
  position: relative;
}

.nav-item:hover {
  opacity: 1;
  background-color: rgba(59, 130, 246, 0.1) !important;
  transform: translateX(4px);
}

.nav-item.v-list-item--active {
  opacity: 1;
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05)) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-left: 2px solid var(--primary-color);
}

/* Top navigation buttons styling */
.navigation-buttons {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  margin-left: 20px;
}

.navigation-btn {
  padding: 0 16px;
  height: 36px;
  border-radius: 18px;
  transition: all 0.3s ease;
  opacity: 0.8;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: none;
}

.navigation-btn:hover {
  opacity: 1;
  background-color: rgba(59, 130, 246, 0.1);
  transform: translateY(-2px);
}

.active-nav-btn {
  opacity: 1;
  font-weight: 700;
  background-color: rgba(59, 130, 246, 0.15) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  border-bottom: 2px solid var(--primary-color);
}

/* Navigation buttons mobile responsiveness */
@media (max-width: 960px) {
  .navigation-buttons {
    margin-left: 10px;
  }
  
  .navigation-btn {
    padding: 0 8px;
    margin: 0 2px !important;
    font-size: 0.85rem;
  }
}

/* Add glow effect to active nav items */
.nav-item.v-list-item--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 100%;
  background: radial-gradient(circle at left, rgba(59, 130, 246, 0.15), transparent 70%);
  opacity: 0.7;
  z-index: 0;
}

/* Add pulse animation to active nav icon */
@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}

.nav-item.v-list-item--active .v-icon {
  color: var(--primary-color) !important;
  animation: pulse 2s infinite ease-in-out;
}

/* Dark theme overrides for Vuetify components */
.v-sheet {
  background-color: var(--surface-color) !important;
}

.v-divider {
  border-color: var(--border-color) !important;
  opacity: 0.5;
}

.v-list {
  background-color: transparent !important;
}

.v-list-item__content {
  color: var(--text-color) !important;
}

.v-input {
  color: var(--text-color) !important;
}

.v-field__outline {
  color: var(--border-color) !important;
}

.v-toolbar {
  background-color: var(--app-background) !important;
}

/* Table styling with glass morphism for dark theme */
.v-data-table {
  background: linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.7)) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(148, 163, 184, 0.15) !important;
  border-radius: 8px !important;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2) !important;
}

.v-data-table-header {
  background: linear-gradient(90deg, rgba(30, 58, 138, 0.2), rgba(30, 58, 138, 0.1)) !important;
  backdrop-filter: blur(5px);
  border-bottom: 1px solid rgba(148, 163, 184, 0.2) !important;
}

.v-data-table > .v-data-table__wrapper > table > thead > tr > th {
  color: var(--text-color) !important;
  border-bottom: none !important;
  font-weight: 600 !important;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  font-size: 0.75rem;
  padding: 15px 20px !important;
}

/* Table row hover with subtle highlight */
.v-data-table > .v-data-table__wrapper > table > tbody > tr:hover {
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05)) !important;
  transform: scale(1.01);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 1;
  position: relative;
}

.v-data-table > .v-data-table__wrapper > table > tbody > tr > td {
  color: var(--text-color) !important;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1) !important;
  padding: 15px 20px !important;
  transition: all 0.2s ease;
}

/* Status column styling in tables */
.v-data-table td .v-chip.status-active {
  background-color: rgba(16, 185, 129, 0.2) !important;
  color: var(--active-color) !important;
  border: 1px solid rgba(16, 185, 129, 0.3) !important;
}

.v-data-table td .v-chip.status-inactive {
  background-color: rgba(239, 68, 68, 0.2) !important;
  color: var(--inactive-color) !important;
  border: 1px solid rgba(239, 68, 68, 0.3) !important;
}

.v-data-table td .v-chip.status-repair {
  background-color: rgba(245, 158, 11, 0.2) !important;
  color: var(--repair-color) !important;
  border: 1px solid rgba(245, 158, 11, 0.3) !important;
}

/* Table footer with pagination styling */
.v-data-table__footer {
  background-color: rgba(15, 23, 42, 0.6) !important;
  border-top: 1px solid rgba(148, 163, 184, 0.15) !important;
  padding: 8px 20px !important;
}

/* Notification styling */
.notification-snackbar {
  margin-top: 10px;
  border-radius: 8px !important;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25) !important;
  backdrop-filter: blur(10px);
  font-weight: 500;
}

.v-snackbar--variant-elevated.v-snackbar.v-snackbar--color-success {
  background: linear-gradient(145deg, rgba(16, 185, 129, 0.9), rgba(6, 95, 70, 0.8)) !important;
  border: 1px solid rgba(16, 185, 129, 0.4) !important;
}

.v-snackbar--variant-elevated.v-snackbar.v-snackbar--color-error {
  background: linear-gradient(145deg, rgba(239, 68, 68, 0.9), rgba(153, 27, 27, 0.8)) !important;
  border: 1px solid rgba(239, 68, 68, 0.4) !important;
}

.v-snackbar--variant-elevated.v-snackbar.v-snackbar--color-warning {
  background: linear-gradient(145deg, rgba(245, 158, 11, 0.9), rgba(146, 64, 14, 0.8)) !important;
  border: 1px solid rgba(245, 158, 11, 0.4) !important;
}

.v-snackbar--variant-elevated.v-snackbar.v-snackbar--color-info {
  background: linear-gradient(145deg, rgba(59, 130, 246, 0.9), rgba(30, 64, 175, 0.8)) !important;
  border: 1px solid rgba(59, 130, 246, 0.4) !important;
}

/* Snackbar entrance/exit animations */
@keyframes snackbar-slide-in {
  from { transform: translateY(-30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes snackbar-slide-out {
  from { transform: translateY(0); opacity: 1; }
  to { transform: translateY(-30px); opacity: 0; }
}

.v-snackbar-enter-active {
  animation: snackbar-slide-in 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
}

.v-snackbar-leave-active {
  animation: snackbar-slide-out 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
}
</style>
