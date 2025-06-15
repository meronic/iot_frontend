<template>
  <div class="device-summary-container">
    <!-- IP Devices Card -->
    <div class="device-summary-col">
      <v-card
        class="dashboard-card ip-device-card h-100"
        @click="navigateToDevices('ip')"
        style="cursor: pointer"
      >
        <div class="card-header">
          <v-card-title>
            <v-avatar color="primary" class="status-icon-avatar mr-2">
              <v-icon>mdi-ip-network</v-icon>
            </v-avatar>
            IP Devices
          </v-card-title>
        </div>
        <v-card-text class="d-flex flex-column h-100">
          <div class="device-type-count mb-4">
            <div class="device-type-value">{{ summary.device_types.ip }}</div>
            <div class="device-type-percentage">
              {{ calculatePercentage(summary.device_types.ip, summary.total_devices) }}% of total
            </div>
          </div>

          <div class="device-type-stats">
            <div class="d-flex flex-column">
              <div
                class="status-item"
                v-for="status in ['active', 'inactive', 'under_repair']"
                :key="status"
              >
                <div class="d-flex justify-space-between align-center mb-1">
                  <div class="d-flex align-center">
                    <span :class="['status-dot', `status-${status}`]"></span>
                    <span class="text-body-2">{{ statusLabel[status] }}</span>
                  </div>
                  <div class="status-value-wrapper">
                    <span class="status-count">{{ ipDeviceStatusCounts[status] }}</span>
                    <span class="status-percentage"
                      >({{ ipDeviceStatusPercentages[status] }}%)</span
                    >
                  </div>
                </div>
                <v-progress-linear
                  :color="statusColor[status]"
                  :model-value="ipDeviceStatusPercentages[status]"
                  height="6"
                  rounded
                ></v-progress-linear>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- LoRa Devices Card -->
    <div class="device-summary-col">
      <v-card
        class="dashboard-card lora-device-card h-100"
        @click="navigateToDevices('lora')"
        style="cursor: pointer"
      >
        <div class="card-header">
          <v-card-title>
            <v-avatar color="purple" class="status-icon-avatar mr-2">
              <v-icon>mdi-access-point</v-icon>
            </v-avatar>
            LoRa Devices
          </v-card-title>
        </div>
        <v-card-text class="d-flex flex-column h-100">
          <div class="device-type-count mb-4">
            <div class="device-type-value">{{ summary.device_types.lora }}</div>
            <div class="device-type-percentage">
              {{ calculatePercentage(summary.device_types.lora, summary.total_devices) }}% of total
            </div>
          </div>

          <div class="device-type-stats">
            <div class="d-flex flex-column">
              <div
                class="status-item"
                v-for="status in ['active', 'inactive', 'under_repair']"
                :key="status"
              >
                <div class="d-flex justify-space-between align-center mb-1">
                  <div class="d-flex align-center">
                    <span :class="['status-dot', `status-${status}`]"></span>
                    <span class="text-body-2">{{ statusLabel[status] }}</span>
                  </div>
                  <div class="status-value-wrapper">
                    <span class="status-count">{{ loraDeviceStatusCounts[status] }}</span>
                    <span class="status-percentage"
                      >({{ loraDeviceStatusPercentages[status] }}%)</span
                    >
                  </div>
                </div>
                <v-progress-linear
                  :color="statusColor[status]"
                  :model-value="loraDeviceStatusPercentages[status]"
                  height="6"
                  rounded
                ></v-progress-linear>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'DeviceTypeSummary',

  props: {
    summary: {
      type: Object,
      required: true,
    },
  },

  setup(props) {
    const router = useRouter()

    const calculatePercentage = (value, total) => {
      if (!total || total === 0) return 0
      return Math.round((value / total) * 100)
    }

    const statusLabel = {
      active: '정상',
      inactive: '비정상',
      under_repair: '수리중',
    }

    const statusColor = {
      active: 'success',
      inactive: 'error',
      under_repair: 'warning',
    }

    const ipDeviceStatusCounts = computed(() => {
      return props.summary.status?.ip || { active: 0, inactive: 0, under_repair: 0 }
    })

    const ipDeviceStatusPercentages = computed(() => {
      const ipCount = props.summary.device_types?.ip || 0
      if (ipCount === 0) return { active: 0, inactive: 0, under_repair: 0 }
      return {
        active: calculatePercentage(ipDeviceStatusCounts.value.active, ipCount),
        inactive: calculatePercentage(ipDeviceStatusCounts.value.inactive, ipCount),
        under_repair: calculatePercentage(ipDeviceStatusCounts.value.under_repair, ipCount),
      }
    })

    const loraDeviceStatusCounts = computed(() => {
      return props.summary.status?.lora || { active: 0, inactive: 0, under_repair: 0 }
    })

    const loraDeviceStatusPercentages = computed(() => {
      const loraCount = props.summary.device_types?.lora || 0
      if (loraCount === 0) return { active: 0, inactive: 0, under_repair: 0 }
      return {
        active: calculatePercentage(loraDeviceStatusCounts.value.active, loraCount),
        inactive: calculatePercentage(loraDeviceStatusCounts.value.inactive, loraCount),
        under_repair: calculatePercentage(loraDeviceStatusCounts.value.under_repair, loraCount),
      }
    })

    // const navigateToType = (type) => {
    //   router.push({ path: '/devices', query: { type } });
    // };

    // 수정된 navigateToDevices 함수
    const navigateToDevices = (type) => {
      router.push({ path: '/devices', query: { type } })
    }

    return {
      calculatePercentage,
      ipDeviceStatusCounts,
      ipDeviceStatusPercentages,
      loraDeviceStatusCounts,
      loraDeviceStatusPercentages,
      statusLabel,
      statusColor,
      // navigateToType,
      navigateToDevices,
    }
  },
}
</script>

<style scoped>
/* Device summary container layout */
.device-summary-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: stretch;
  width: 100%;
  margin: 0 -8px;
  padding: 0;
}

.device-summary-col {
  flex: 1 1 calc(50% - 16px);
  min-width: calc(50% - 16px);
  max-width: calc(50% - 16px);
  display: flex;
  margin: 0 8px;
  box-sizing: border-box;
}

/* Common card styles to ensure consistent height and appearance */
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

.ip-device-card {
  border-top: 4px solid #3b82f6;
}

.lora-device-card {
  border-top: 4px solid #8b5cf6;
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

/* Device type metrics */
.device-type-count {
  text-align: center;
  width: 100%;
}

.device-type-value {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  background: linear-gradient(90deg, #3b82f6, #6366f1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
}

.device-type-percentage {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
}

/* Better alignment for device type stats */
.device-type-stats {
  padding: 8px;
  border-radius: 8px;
  background-color: rgba(15, 23, 42, 0.2);
  margin-top: 8px;
}

/* Status value wrapper to prevent text clipping */
.status-value-wrapper {
  white-space: nowrap;
  min-width: 100px;
}

/* Fix status bars to prevent overflow */
.status-item {
  overflow: hidden;
  margin-bottom: 12px;
  padding: 8px;
  border-radius: 6px;
  background-color: rgba(15, 23, 42, 0.15);
}

/* Status bar styling */
.status-bar {
  height: 8px;
  border-radius: 4px;
  margin-right: 0.5rem;
  min-width: 10px;
  max-width: 100px;
  transition: width 0.3s ease;
}

.status-count {
  font-size: 1rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 5px;
}

.status-percentage {
  font-size: 0.85rem;
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
  background-color: #10b981;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
}

.status-inactive {
  background-color: #ef4444;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
}

.status-repair {
  background-color: #f59e0b;
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
}

/* Responsive adjustments */
@media (max-width: 900px) {
  .device-summary-col {
    min-width: calc(100% - 16px);
    max-width: calc(100% - 16px);
    margin-bottom: 16px;
  }

  .status-value-wrapper {
    min-width: 80px;
  }

  .device-type-value {
    font-size: 1.75rem;
  }
}

@media (max-width: 600px) {
  .card-header {
    height: 64px;
  }

  .status-icon-avatar {
    width: 36px !important;
    height: 36px !important;
  }

  .device-type-value {
    font-size: 1.5rem;
  }
}
</style>
