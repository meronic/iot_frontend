<template>
  <div class="status-cards-container">
    <!-- Total Devices Card -->
    <div class="status-card-col">
      <v-card class="status-card total-devices-card">
        <div class="card-header">
          <v-card-title class="card-title">
            <v-avatar color="primary" class="status-icon-avatar">
              <v-icon>mdi-devices</v-icon>
            </v-avatar>
            <span class="title-text">전체 단말기</span>
          </v-card-title>
        </div>

        <v-card-text class="card-content">
          <div class="metric-container">
            <div class="metric-value total-value">{{ totalDevices }}</div>
            <div class="metric-subtitle">{{ deviceBreakdown }}</div>
          </div>

          <div class="status-bar-container">
            <div class="status-bar">
              <div
                v-for="(item, index) in statusItems"
                :key="index"
                class="status-segment"
                :style="{ width: `${item.percentage}%`, backgroundColor: item.color }"
              ></div>
            </div>

            <div class="legend-container">
              <div v-for="(item, index) in statusItems" :key="index" class="legend-item">
                <span class="legend-dot" :style="{ backgroundColor: item.color }"></span>
                <span class="legend-label">{{ item.label }}</span>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Active Devices Card -->
    <div class="status-card-col">
      <v-card class="status-card active-devices-card" @click="navigateToDevices('active')">
        <div class="card-header">
          <v-card-title class="card-title">
            <v-avatar color="success" class="status-icon-avatar">
              <v-icon>mdi-check-circle</v-icon>
            </v-avatar>
            <span class="title-text">정상 단말기</span>
          </v-card-title>
        </div>

        <v-card-text class="card-content">
          <div class="metric-container">
            <div class="metric-value active-value">{{ totalStatus.active }}</div>
            <div class="metric-subtitle">
              {{ calculatePercentage(totalStatus.active, totalDevices) }}% of total
            </div>
          </div>

          <div class="progress-container">
            <v-progress-linear
              color="success"
              :model-value="calculatePercentage(totalStatus.active, totalDevices)"
              height="10"
              rounded
            ></v-progress-linear>

            <div class="progress-info">
              <div class="d-flex align-center">
                <span class="status-dot status-active"></span>
                <span class="status-label">Active</span>
              </div>
              <span class="status-count"
                >{{ totalStatus.active }} ({{
                  calculatePercentage(totalStatus.active, totalDevices)
                }}%)</span
              >
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Inactive Devices Card -->
    <div class="status-card-col">
      <v-card class="status-card inactive-devices-card" @click="navigateToDevices('inactive')">
        <div class="card-header">
          <v-card-title class="card-title">
            <v-avatar color="error" class="status-icon-avatar">
              <v-icon>mdi-alert-circle</v-icon>
            </v-avatar>
            <span class="title-text">비정상 단말기</span>
          </v-card-title>
        </div>

        <v-card-text class="card-content">
          <div class="metric-container">
            <div class="metric-value inactive-value">{{ totalStatus.inactive }}</div>
            <div class="metric-subtitle">
              {{ calculatePercentage(totalStatus.inactive, totalDevices) }}% of total
            </div>
          </div>

          <div class="progress-container">
            <v-progress-linear
              color="error"
              :model-value="calculatePercentage(totalStatus.inactive, totalDevices)"
              height="10"
              rounded
            ></v-progress-linear>

            <div class="progress-info">
              <div class="d-flex align-center">
                <span class="status-dot status-inactive"></span>
                <span class="status-label">Inactive</span>
              </div>
              <span class="status-count"
                >{{ totalStatus.inactive }} ({{
                  calculatePercentage(totalStatus.inactive, totalDevices)
                }}%)</span
              >
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Under Repair Devices Card -->
    <div class="status-card-col">
      <v-card class="status-card repair-devices-card" @click="navigateToDevices('under_repair')">
        <div class="card-header">
          <v-card-title class="card-title">
            <v-avatar color="warning" class="status-icon-avatar">
              <v-icon>mdi-wrench</v-icon>
            </v-avatar>
            <span class="title-text">수리중인 단말기</span>
          </v-card-title>
        </div>

        <v-card-text class="card-content">
          <div class="metric-container">
            <div class="metric-value repair-value">{{ totalStatus.under_repair }}</div>
            <div class="metric-subtitle">
              {{ calculatePercentage(totalStatus.under_repair, totalDevices) }}% of total
            </div>
          </div>

          <div class="progress-container">
            <v-progress-linear
              color="warning"
              :model-value="calculatePercentage(totalStatus.under_repair, totalDevices)"
              height="10"
              rounded
            ></v-progress-linear>

            <div class="progress-info">
              <div class="d-flex align-center">
                <span class="status-dot status-repair"></span>
                <span class="status-label">Under Repair</span>
              </div>
              <span class="status-count"
                >{{ totalStatus.under_repair }} ({{
                  calculatePercentage(totalStatus.under_repair, totalDevices)
                }}%)</span
              >
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'StatusSummaryCards',

  props: {
    summary: {
      type: Object,
      required: true,
    },
  },

  emits: ['navigate-to-devices'],

  setup(props, { emit }) {
    const calculatePercentage = (value, total) => {
      if (!total || total === 0) return 0
      return Math.round((value / total) * 100)
    }

    const totalStatus = computed(() => {
      const ip = props.summary.status?.ip || {}
      const lora = props.summary.status?.lora || {}
      return {
        active: (ip.active || 0) + (lora.active || 0),
        inactive: (ip.inactive || 0) + (lora.inactive || 0),
        under_repair: (ip.under_repair || 0) + (lora.under_repair || 0),
      }
    })

    const totalDevices = computed(() => props.summary.total_devices || 1)

    const deviceBreakdown = computed(() => {
      const ip = props.summary.device_types?.ip || 0
      const lora = props.summary.device_types?.lora || 0
      return `${ip} IP + ${lora} LoRa`
    })

    const statusItems = computed(() => {
      const total = totalStatus.value
      const sum = total.active + total.inactive + total.under_repair
      return [
        {
          label: 'Active',
          value: total.active,
          percentage: calculatePercentage(total.active, sum),
          color: '#10B981',
        },
        {
          label: 'Inactive',
          value: total.inactive,
          percentage: calculatePercentage(total.inactive, sum),
          color: '#EF4444',
        },
        {
          label: 'Under Repair',
          value: total.under_repair,
          percentage: calculatePercentage(total.under_repair, sum),
          color: '#F59E0B',
        },
      ]
    })

    const statusChartData = computed(() => {
      const s = totalStatus.value
      return {
        labels: ['Active', 'Inactive', 'Under Repair'],
        datasets: [
          {
            data: [s.active, s.inactive, s.under_repair],
            backgroundColor: ['#10B981', '#EF4444', '#F59E0B'],
            hoverBackgroundColor: ['#059669', '#DC2626', '#D97706'],
            borderWidth: 0,
          },
        ],
      }
    })

    const navigateToDevices = (status) => {
      emit('navigate-to-devices', status)
    }

    return {
      calculatePercentage,
      totalStatus,
      totalDevices,
      deviceBreakdown,
      statusItems,
      statusChartData,
      navigateToDevices,
    }
  },
}
</script>

<style scoped>
/* Status cards container layout */
.status-cards-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: stretch;
  width: 100%;
  margin: 0 -8px;
  padding: 0;
}

/* Card columns with equal width and proper spacing */
.status-card-col {
  flex: 1 1 0;
  min-width: calc(25% - 16px);
  max-width: calc(25% - 16px);
  display: flex;
  margin: 0 8px 16px 8px;
  box-sizing: border-box;
}

/* Common card styles to ensure consistent height and appearance */
.status-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
  background: linear-gradient(145deg, rgba(21, 32, 50, 0.98), rgba(10, 17, 30, 0.95));
  border: 1px solid rgba(45, 55, 72, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

/* Card border colors */
.total-devices-card {
  border-top: 3px solid #3b82f6;
}

.active-devices-card {
  border-top: 3px solid #10b981;
  cursor: pointer;
}

.inactive-devices-card {
  border-top: 3px solid #ef4444;
  cursor: pointer;
}

.repair-devices-card {
  border-top: 3px solid #f59e0b;
  cursor: pointer;
}

/* 카드 헤더 최적화 */
.card-header {
  padding: 0;
}

.card-title {
  display: flex !important;
  align-items: center !important;
  padding: 10px 16px !important;
  font-size: 1rem !important; /* 글자 크기 증가 */
  font-weight: 500 !important;
  line-height: 1.2 !important;
  min-height: unset !important;
  height: auto !important;
}

.title-text {
  margin-left: 8px;
  white-space: nowrap;
}

/* 카드 콘텐츠 개선 - 수직 간격 최적화 */
.card-content {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0 16px 16px !important;
  gap: 12px; /* 간격 약간 증가 */
}

/* 메트릭 영역 - 여백 조정 */
.metric-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 4px 0; /* 상하 패딩 축소 */
}

/* 차트 바 직접 구현 */
.status-bar-container {
  width: 100%;
  margin-top: 2px;
}

.status-bar {
  width: 100%;
  height: 10px; /* 높이 약간 증가 */
  border-radius: 5px;
  overflow: hidden;
  display: flex;
  background-color: rgba(15, 23, 42, 0.3);
}

.status-segment {
  height: 100%;
}

.status-segment:first-child {
  border-radius: 5px 0 0 5px;
}

.status-segment:last-child {
  border-radius: 0 5px 5px 0;
}

/* 레전드 컨테이너 */
.legend-container {
  display: flex;
  flex-wrap: wrap;
  gap: 12px; /* 간격 증가 */
  margin-top: 10px;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.legend-dot {
  width: 8px; /* 크기 증가 */
  height: 8px; /* 크기 증가 */
  border-radius: 50%;
}

.legend-label {
  font-size: 0.85rem; /* 글자 크기 증가 */
  color: rgba(255, 255, 255, 0.85); /* 색상 약간 밝게 */
}

/* 프로그레스 바 컨테이너 */
.progress-container {
  width: 100%;
  margin-top: 4px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 0.85rem; /* 글자 크기 증가 */
  color: rgba(255, 255, 255, 0.85); /* 색상 약간 밝게 */
}

/* Status icon avatar - 크기 약간 증가 */
.status-icon-avatar {
  width: 32px !important; /* 크기 증가 */
  height: 32px !important; /* 크기 증가 */
  flex-shrink: 0;
}

/* v-icon 크기 최적화 */
.status-icon-avatar .v-icon {
  font-size: 18px !important; /* 크기 증가 */
}

/* Metric values styling - 글자 크기 증가 */
.metric-value {
  font-size: 2.2rem; /* 글자 크기 증가 */
  font-weight: 700;
  margin-bottom: 4px; /* 여백 증가 */
  background: linear-gradient(90deg, #f1f5f9, #e2e8f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  line-height: 1.1; /* 행간 약간 증가 */
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

.metric-subtitle {
  font-size: 0.85rem; /* 글자 크기 증가 */
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.2;
}

/* 상태 도트 */
.status-dot {
  width: 8px; /* 크기 증가 */
  height: 8px; /* 크기 증가 */
  border-radius: 50%;
  display: inline-block;
  margin-right: 5px;
}

.status-label,
.status-count {
  font-size: 0.85rem; /* 글자 크기 증가 */
}

.status-active {
  background-color: #10b981;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.5); /* 그림자 증가 */
}

.status-inactive {
  background-color: #ef4444;
  box-shadow: 0 0 6px rgba(239, 68, 68, 0.5); /* 그림자 증가 */
}

.status-repair {
  background-color: #f59e0b;
  box-shadow: 0 0 6px rgba(245, 158, 11, 0.5); /* 그림자 증가 */
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .status-card-col {
    min-width: calc(50% - 16px);
    max-width: calc(50% - 16px);
  }

  .metric-value {
    font-size: 2rem; /* 화면 크기에 따라 약간 축소 */
  }

  .legend-label,
  .status-label,
  .status-count,
  .metric-subtitle {
    font-size: 0.8rem; /* 화면 크기에 따라 약간 축소 */
  }
}

@media (max-width: 768px) {
  .metric-value {
    font-size: 1.8rem; /* 화면 크기에 따라 약간 축소 */
  }

  .status-icon-avatar {
    width: 28px !important;
    height: 28px !important;
  }

  .status-icon-avatar .v-icon {
    font-size: 16px !important;
  }
}

@media (max-width: 600px) {
  .status-card-col {
    min-width: calc(100% - 16px);
    max-width: calc(100% - 16px);
  }

  .metric-value {
    font-size: 1.7rem; /* 화면 크기에 따라 약간 축소 */
  }

  .legend-label,
  .status-label,
  .status-count,
  .metric-subtitle {
    font-size: 0.75rem; /* 화면 크기에 따라 약간 축소 */
  }
}
</style>
