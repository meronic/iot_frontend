<template>
  <v-card class="dashboard-card chart-card h-100">
    <div class="card-header">
      <v-card-title>
        <v-avatar color="purple" class="status-icon-avatar mr-2">
          <v-icon>mdi-chart-donut</v-icon>
        </v-avatar>
        단말기 상태 차트
      </v-card-title>
    </div>
    <v-card-text class="chart-card-content pa-0">
      <div class="chart-container-wrapper">
        <div class="donut-chart-wrapper">
          <StatusChart :chartData="statusChartData" />
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { computed } from 'vue'
import StatusChart from '@/components/StatusChart.vue'

export default {
  name: 'StatusDistributionChart',

  components: {
    StatusChart,
  },

  props: {
    summary: {
      type: Object,
      required: true,
    },
  },

  setup(props) {
    // Chart data for status distribution
    const statusChartData = computed(() => {
      const activeCount = props.summary.status?.active || 0
      const inactiveCount = props.summary.status?.inactive || 0
      const underRepairCount = props.summary.status?.under_repair || 0

      return {
        labels: ['Active', 'Inactive', 'Under Repair'],
        datasets: [
          {
            data: [activeCount, inactiveCount, underRepairCount],
            backgroundColor: ['#10B981', '#EF4444', '#F59E0B'],
            hoverBackgroundColor: ['#059669', '#DC2626', '#D97706'],
            borderWidth: 0,
          },
        ],
      }
    })

    return {
      statusChartData,
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

.chart-card {
  border-top: 4px solid #8b5cf6;
}

.chart-card-content {
  display: flex;
  flex-direction: column;
  height: calc(100% - 72px); /* Full height minus header */
  position: relative;
  overflow: hidden;
}

/* Enforce consistent card header sizing */
.card-header {
  height: 72px;
  display: flex;
  align-items: center;
  flex-shrink: 0; /* Prevent header from shrinking */
}

/* Status icon avatar */
.status-icon-avatar {
  width: 42px !important;
  height: 42px !important;
  flex-shrink: 0;
}

/* Fix chart container height and prevent layout shifts */
.chart-container-wrapper {
  display: flex;
  flex-direction: column;
  position: relative;
  height: 320px; /* Fixed height prevents layout shifts */
  width: 100%;
  flex-grow: 1;
}

.donut-chart-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 260px; /* Fixed height for chart */
  width: 260px; /* Fixed width for chart - keeping it square */
  position: relative;
  margin: 0 auto;
  flex-shrink: 0; /* Prevent shrinking */
}

/* Static legend styling */
.static-legend {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60px; /* Fixed height for legend */
  margin-top: 8px;
  padding: 0 16px 8px;
  flex-shrink: 0;
}

.legend-item {
  display: flex;
  align-items: center;
  margin: 4px 0;
  padding: 2px 8px;
  background-color: rgba(15, 23, 42, 0.2);
  border-radius: 4px;
  width: 100%;
  justify-content: center;
}

/* Status dots for legends */
.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 6px;
  flex-shrink: 0; /* Prevent shrinking */
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

/* Ensure responsive sizing without shifts */
@media (max-width: 960px) {
  .donut-chart-wrapper {
    height: 240px;
    width: 240px;
  }
}

@media (max-width: 768px) {
  .donut-chart-wrapper {
    height: 220px;
    width: 220px;
  }
}

@media (max-width: 600px) {
  .donut-chart-wrapper {
    height: 200px;
    width: 200px;
  }

  .chart-container-wrapper {
    height: 280px;
  }
}
</style>
