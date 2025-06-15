<template>
  <v-card class="dashboard-card system-overview-card h-100">
    <div class="card-header">
      <v-card-title>
        <v-avatar color="info" class="status-icon-avatar mr-2">
          <v-icon>mdi-view-dashboard</v-icon>
        </v-avatar>
        전체 IoT 시스템 현황
      </v-card-title>
    </div>
    <v-card-text class="pa-0">
      <div class="system-table-container">
        <table class="system-status-table">
          <thead>
            <tr>
              <th>시스템</th>
              <th>현황</th>
              <th>정상</th>
              <th>비정상</th>
              <th>수리중</th>
              <th>대수</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="system in systemStatus"
              :key="system.id"
              @click="navigateToDevicesBySystem(system.id)"
            >
              <td>
                <div class="fw-bold">{{ system.name }}</div>
                <div class="text-caption text-grey-lighten-1">{{ system.description }}</div>
              </td>
              <td>
                <div class="health-bar">
                  <v-progress-linear
                    :color="getHealthColor(calculateSystemHealth(system))"
                    :model-value="calculateSystemHealth(system)"
                    height="6"
                    rounded
                  ></v-progress-linear>
                </div>
                <div class="status-chip" :class="getHealthColor(calculateSystemHealth(system))">
                  {{ calculateSystemHealth(system) }}%
                </div>
              </td>
              <td>
                <span class="fw-bold">{{ system.active }}</span>
                <span class="text-caption d-block">
                  ({{ calculatePercentage(system.active, system.total) }}%)
                </span>
              </td>
              <td>
                <span class="fw-bold">{{ system.inactive }}</span>
                <span class="text-caption d-block">
                  ({{ calculatePercentage(system.inactive, system.total) }}%)
                </span>
              </td>
              <td>
                <span class="fw-bold">{{ system.under_repair }}</span>
                <span class="text-caption d-block">
                  ({{ calculatePercentage(system.under_repair, system.total) }}%)
                </span>
              </td>
              <td>
                <span class="fw-bold">{{ system.total }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'SystemStatusOverview',

  props: {
    systemStatus: {
      type: Array,
      required: true,
    },
  },

  emits: ['navigate-to-devices-by-system'],

  setup(props, { emit }) {
    // Calculate percentages helper
    const calculatePercentage = (value, total) => {
      if (!total || total === 0) return 0
      return Math.round((value / total) * 100)
    }

    // System health calculation
    const calculateSystemHealth = (system) => {
      if (!system || system.total === 0) return 0
      return Math.round((system.active / system.total) * 100)
    }

    // Get color based on health percentage
    const getHealthColor = (health) => {
      if (health >= 90) return 'success'
      if (health >= 75) return 'info'
      if (health >= 50) return 'warning'
      return 'error'
    }

    // Navigation helper function
    const navigateToDevicesBySystem = (systemId) => {
      emit('navigate-to-devices-by-system', systemId)
    }

    return {
      calculatePercentage,
      calculateSystemHealth,
      getHealthColor,
      navigateToDevicesBySystem,
    }
  },
}
</script>

<style scoped>
.dashboard-card {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  overflow: hidden;
  background: linear-gradient(145deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.85));
  border: 1px solid rgba(71, 85, 105, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.system-overview-card {
  border-top: 4px solid #0ea5e9;
}

/* Enforce consistent card header sizing */
.card-header {
  height: 72px;
  display: flex;
  align-items: center;
}

/* Status icon avatar */
.status-icon-avatar {
  width: 42px !important;
  height: 42px !important;
  flex-shrink: 0;
}

/* System Overview Table styling */
.system-table-container {
  overflow-x: auto;
  max-height: 400px;
  overscroll-behavior: contain;
}

.system-status-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.system-status-table th {
  position: sticky;
  top: 0;
  background-color: rgba(15, 23, 42, 0.9);
  z-index: 1;
  padding: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.5px;
}

.system-status-table tr {
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.system-status-table tr:hover {
  background-color: rgba(51, 65, 85, 0.5);
}

.system-status-table td {
  padding: 16px;
  border-bottom: 1px solid rgba(71, 85, 105, 0.2);
}

/* Status chips */
.status-chip {
  display: inline-block;
  width: 36px;
  height: 20px;
  text-align: center;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 2px 0;
  line-height: 1;
}

.status-chip.success {
  background-color: rgba(16, 185, 129, 0.2);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.5);
}

.status-chip.error {
  background-color: rgba(239, 68, 68, 0.2);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.5);
}

.status-chip.warning {
  background-color: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.5);
}

.status-chip.info {
  background-color: rgba(14, 165, 233, 0.2);
  color: #38bdf8;
  border: 1px solid rgba(14, 165, 233, 0.5);
}

/* System health bar */
.health-bar {
  margin-bottom: 4px;
}
</style>
