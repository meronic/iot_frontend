<template>
  <div class="status-cards-container">
    <!-- Total Devices Card -->
    <div class="status-card-col">
      <v-card class="status-card total-devices-card">
        <div class="card-header">
          <v-card-title>
            <v-avatar color="primary" class="status-icon-avatar mr-2">
              <v-icon>mdi-devices</v-icon>
            </v-avatar>
            Total Devices
          </v-card-title>
        </div>
        <v-card-text class="d-flex flex-column h-100">
          <div class="d-flex justify-center my-2">
            <div class="metric-value total-value">{{ summary.total_devices }}</div>
          </div>
          
          <div class="mt-2 mb-1">
            <div class="d-flex justify-space-between align-center mb-1">
              <div class="d-flex align-center">
                <span class="status-dot status-active"></span>
                <span class="text-body-2">Active</span>
              </div>
              <span class="text-body-2">{{ summary.status.active }} ({{ calculatePercentage(summary.status.active, summary.total_devices) }}%)</span>
            </div>
            <v-progress-linear
              color="success"
              :model-value="calculatePercentage(summary.status.active, summary.total_devices)"
              height="8"
              rounded
            ></v-progress-linear>
          </div>

          <div class="my-1">
            <div class="d-flex justify-space-between align-center mb-1">
              <div class="d-flex align-center">
                <span class="status-dot status-inactive"></span>
                <span class="text-body-2">Inactive</span>
              </div>
              <span class="text-body-2">{{ summary.status.inactive }} ({{ calculatePercentage(summary.status.inactive, summary.total_devices) }}%)</span>
            </div>
            <v-progress-linear
              color="error"
              :model-value="calculatePercentage(summary.status.inactive, summary.total_devices)"
              height="8"
              rounded
            ></v-progress-linear>
          </div>

          <div class="mt-1">
            <div class="d-flex justify-space-between align-center mb-1">
              <div class="d-flex align-center">
                <span class="status-dot status-repair"></span>
                <span class="text-body-2">Under Repair</span>
              </div>
              <span class="text-body-2">{{ summary.status.under_repair }} ({{ calculatePercentage(summary.status.under_repair, summary.total_devices) }}%)</span>
            </div>
            <v-progress-linear
              color="warning"
              :model-value="calculatePercentage(summary.status.under_repair, summary.total_devices)"
              height="8"
              rounded
            ></v-progress-linear>
          </div>

          <div class="d-flex justify-center align-center mt-3">
            <span class="text-caption text-grey-lighten-1">{{ deviceBreakdown }}</span>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Active Devices Card -->
    <div class="status-card-col">
      <v-card class="status-card active-devices-card" @click="navigateToDevices('active')">
        <div class="card-header">
          <v-card-title>
            <v-avatar color="success" class="status-icon-avatar mr-2">
              <v-icon>mdi-check-circle</v-icon>
            </v-avatar>
            Active Devices
          </v-card-title>
        </div>
        <v-card-text class="d-flex flex-column align-center justify-center h-100">
          <div class="metric-value active-value">{{ summary.status.active }}</div>
          <div class="metric-percentage">{{ calculatePercentage(summary.status.active, summary.total_devices) }}% of total</div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Inactive Devices Card -->
    <div class="status-card-col">
      <v-card class="status-card inactive-devices-card" @click="navigateToDevices('inactive')">
        <div class="card-header">
          <v-card-title>
            <v-avatar color="error" class="status-icon-avatar mr-2">
              <v-icon>mdi-alert-circle</v-icon>
            </v-avatar>
            Inactive Devices
          </v-card-title>
        </div>
        <v-card-text class="d-flex flex-column align-center justify-center h-100">
          <div class="metric-value inactive-value">{{ summary.status.inactive }}</div>
          <div class="metric-percentage">{{ calculatePercentage(summary.status.inactive, summary.total_devices) }}% of total</div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Under Repair Devices Card -->
    <div class="status-card-col">
      <v-card class="status-card repair-devices-card" @click="navigateToDevices('under_repair')">
        <div class="card-header">
          <v-card-title>
            <v-avatar color="warning" class="status-icon-avatar mr-2">
              <v-icon>mdi-wrench</v-icon>
            </v-avatar>
            Under Repair
          </v-card-title>
        </div>
        <v-card-text class="d-flex flex-column align-center justify-center h-100">
          <div class="metric-value repair-value">{{ summary.status.under_repair }}</div>
          <div class="metric-percentage">{{ calculatePercentage(summary.status.under_repair, summary.total_devices) }}% of total</div>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'StatusSummaryCards',
  
  props: {
    summary: {
      type: Object,
      required: true
    }
  },
  
  emits: ['navigate-to-devices'],
  
  setup(props, { emit }) {
    // Device breakdown text
    const deviceBreakdown = computed(() => {
      const ipCount = props.summary.device_types?.ip || 0;
      const loraCount = props.summary.device_types?.lora || 0;
      return `${ipCount} IP + ${loraCount} LoRa`;
    });
    
    // Calculate percentages helper
    const calculatePercentage = (value, total) => {
      if (!total || total === 0) return 0;
      return Math.round((value / total) * 100);
    };
    
    // Navigation helper function
    const navigateToDevices = (status) => {
      emit('navigate-to-devices', status);
    };
    
    return {
      deviceBreakdown,
      calculatePercentage,
      navigateToDevices
    };
  }
};
</script>

<style scoped>
/* Status cards container layout */
.status-cards-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: stretch;
  width: 100%;
  margin: 0 -12px;
  padding: 0;
}

/* Card columns with equal width and proper spacing */
.status-card-col {
  flex: 1 1 0;
  min-width: calc(25% - 24px);
  max-width: calc(25% - 24px);
  display: flex;
  margin: 0 12px 24px 12px;
  box-sizing: border-box;
}

/* Common card styles to ensure consistent height and appearance */
.status-card {
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

/* Card border colors */
.total-devices-card {
  border-top: 4px solid #3B82F6;
}

.active-devices-card {
  border-top: 4px solid #10B981;
  cursor: pointer;
}

.inactive-devices-card {
  border-top: 4px solid #EF4444;
  cursor: pointer;
}

.repair-devices-card {
  border-top: 4px solid #F59E0B;
  cursor: pointer;
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

/* Metric values styling */
.metric-value {
  font-size: 2.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: linear-gradient(90deg, #f1f5f9, #e2e8f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  line-height: 1.2;
}

.total-value {
  background: linear-gradient(90deg, #93c5fd, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
}

.active-value {
  background: linear-gradient(90deg, #34d399, #10b981);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
}

.inactive-value {
  background: linear-gradient(90deg, #f87171, #ef4444);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
}

.repair-value {
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
}

.metric-percentage {
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
}

/* Status dots for legends */
.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 6px;
}

.status-active {
  background-color: #10B981;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
}

.status-inactive {
  background-color: #EF4444;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
}

.status-repair {
  background-color: #F59E0B;
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .status-card-col {
    min-width: calc(50% - 24px);
    max-width: calc(50% - 24px);
  }
}

@media (max-width: 600px) {
  .status-card-col {
    min-width: calc(100% - 24px);
    max-width: calc(100% - 24px);
  }
}
</style>