<template>
  <v-card class="dashboard-card trends-card h-100">
    <div class="card-header">
      <v-card-title>
        <v-avatar color="success" class="status-icon-avatar mr-2">
          <v-icon>mdi-chart-line</v-icon>
        </v-avatar>
        Device Status Trends
      </v-card-title>
    </div>
    <v-card-text>
      <div class="d-flex justify-space-between align-center my-2">
        <div class="d-flex">
          <div class="me-4">
            <div class="d-flex align-center">
              <span class="status-dot status-active me-1"></span>
              <span class="text-body-2">Active</span>
              <span class="text-caption ms-1" :class="trendSummary.active > 0 ? 'text-success' : trendSummary.active < 0 ? 'text-error' : ''">
                {{ trendSummary.active > 0 ? '+' : '' }}{{ trendSummary.active }}
              </span>
            </div>
          </div>
          <div class="me-4">
            <div class="d-flex align-center">
              <span class="status-dot status-inactive me-1"></span>
              <span class="text-body-2">Inactive</span>
              <span class="text-caption ms-1" :class="trendSummary.inactive < 0 ? 'text-success' : trendSummary.inactive > 0 ? 'text-error' : ''">
                {{ trendSummary.inactive > 0 ? '+' : '' }}{{ trendSummary.inactive }}
              </span>
            </div>
          </div>
          <div>
            <div class="d-flex align-center">
              <span class="status-dot status-repair me-1"></span>
              <span class="text-body-2">Under Repair</span>
              <span class="text-caption ms-1" :class="trendSummary.under_repair < 0 ? 'text-success' : trendSummary.under_repair > 0 ? 'text-warning' : ''">
                {{ trendSummary.under_repair > 0 ? '+' : '' }}{{ trendSummary.under_repair }}
              </span>
            </div>
          </div>
        </div>
        
        <div>
          <v-select
            v-model="trendDaysSelection"
            :items="[
              { title: 'Last 7 days', value: '7' },
              { title: 'Last 14 days', value: '14' },
              { title: 'Last 30 days', value: '30' }
            ]"
            item-title="title"
            item-value="value"
            density="compact"
            hide-details
            variant="outlined"
            class="trend-days-selector"
            bg-color="rgba(15, 23, 42, 0.6)"
          ></v-select>
        </div>
      </div>
      
      <div class="trend-chart-container">
        <canvas ref="trendChart"></canvas>
        <div v-if="!trends || !trends.dates || trends.dates.length === 0" class="trend-no-data">
          <v-icon size="large" color="grey-lighten-1">mdi-chart-bell-curve</v-icon>
          <span class="mt-2">No trend data available</span>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import Chart from 'chart.js/auto';

export default {
  name: 'DeviceStatusTrends',
  
  props: {
    trends: {
      type: Object,
      required: true
    }
  },
  
  emits: ['update-trend-days'],
  
  setup(props, { emit }) {
    const trendDaysSelection = ref("7");
    const trendChart = ref(null);
    let trendChartInstance = null;
    
    // Trend summary calculation
    const trendSummary = computed(() => {
      if (!props.trends.active || !props.trends.inactive || !props.trends.under_repair || 
          props.trends.active.length === 0) {
        return { active: 0, inactive: 0, under_repair: 0 };
      }
      
      const lastIndex = props.trends.active.length - 1;
      const firstIndex = Math.max(0, lastIndex - parseInt(trendDaysSelection.value) + 1);
      
      const activeChange = props.trends.active[lastIndex] - props.trends.active[firstIndex];
      const inactiveChange = props.trends.inactive[lastIndex] - props.trends.inactive[firstIndex];
      const repairChange = props.trends.under_repair[lastIndex] - props.trends.under_repair[firstIndex];
      
      return {
        active: activeChange,
        inactive: inactiveChange,
        under_repair: repairChange
      };
    });
    
    // Initialize trend chart
    const initTrendChart = () => {
      if (trendChartInstance) {
        trendChartInstance.destroy();
      }
      
      const ctx = trendChart.value.getContext('2d');
      
      // Get trend data based on selected number of days
      const days = parseInt(trendDaysSelection.value);
      const displayDates = props.trends.dates ? props.trends.dates.slice(-days) : [];
      const displayActive = props.trends.active ? props.trends.active.slice(-days) : [];
      const displayInactive = props.trends.inactive ? props.trends.inactive.slice(-days) : [];
      const displayRepair = props.trends.under_repair ? props.trends.under_repair.slice(-days) : [];
      
      const formattedDates = displayDates.map(date => {
        const d = new Date(date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
      });
      
      trendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: formattedDates,
          datasets: [
            {
              label: 'Active',
              data: displayActive,
              borderColor: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderWidth: 2,
              tension: 0.3,
              fill: true
            },
            {
              label: 'Inactive',
              data: displayInactive,
              borderColor: '#EF4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderWidth: 2,
              tension: 0.3,
              fill: true
            },
            {
              label: 'Under Repair',
              data: displayRepair,
              borderColor: '#F59E0B',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              borderWidth: 2,
              tension: 0.3,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              mode: 'index',
              intersect: false,
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              titleColor: '#e2e8f0',
              bodyColor: '#f8fafc',
              borderColor: 'rgba(100, 116, 139, 0.3)',
              borderWidth: 1
            },
            legend: {
              display: false
            }
          },
          scales: {
            x: {
              grid: {
                display: false,
                color: 'rgba(100, 116, 139, 0.2)'
              },
              ticks: {
                color: 'rgba(203, 213, 225, 0.8)'
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(100, 116, 139, 0.1)'
              },
              ticks: {
                precision: 0,
                color: 'rgba(203, 213, 225, 0.8)'
              }
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          },
          elements: {
            point: {
              radius: 3,
              hoverRadius: 5
            }
          }
        }
      });
    };
    
    // Handle trend day selection change
    watch(trendDaysSelection, (newValue) => {
      emit('update-trend-days', newValue);
    });
    
    // Watch for changes in trends data
    watch(() => props.trends, () => {
      if (trendChart.value) {
        initTrendChart();
      }
    }, { deep: true });
    
    // Initialize chart on component mount
    onMounted(() => {
      if (trendChart.value) {
        initTrendChart();
      }
    });
    
    return {
      trendDaysSelection,
      trendChart,
      trendSummary
    };
  }
};
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

.trends-card {
  border-top: 4px solid #10B981;
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

/* Trend chart container */
.trend-chart-container {
  height: 250px;
  position: relative;
}

.trend-no-data {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(203, 213, 225, 0.6);
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

/* Trend days selector */
.trend-days-selector {
  max-width: 150px;
}

/* Text colors */
.text-success {
  color: #10B981 !important;
}

.text-error {
  color: #EF4444 !important;
}

.text-warning {
  color: #F59E0B !important;
}
</style>