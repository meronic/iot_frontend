import { createRouter, createWebHistory } from 'vue-router'

import Dashboard from '../views/Dashboard.vue'
import Devices from '../views/Devices.vue'
import Systems from '../views/Systems.vue'
import RepairHistory from '../views/RepairHistory.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
  },
  {
    path: '/devices',
    name: 'Devices',
    component: Devices,
  },
  {
    path: '/systems',
    name: 'Systems',
    component: Systems,
  },
  {
    path: '/repair-history',
    name: 'RepairHistory',
    component: RepairHistory,
  },
  // Keep this route for backward compatibility
  {
    path: '/issues',
    redirect: '/repair-history',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
