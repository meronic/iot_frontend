<template>
  <div class="chart-container">
    <canvas ref="chartCanvas"></canvas>
    <div v-if="loading" class="loading-overlay">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, computed } from 'vue';
import Chart from 'chart.js/auto';
import axios from 'axios';

export default {
  props: {
    chartData: {
      type: Object,
      required: true
    },
    days: {
      type: [Number, String],
      default: 30
    },
    systemId: {
      type: String,
      default: null
    }
  },
  setup(props) {
    const chartCanvas = ref(null);
    const loading = ref(false);
    let chart = null;

    const daysNumber = computed(() => Number(props.days));

    const createChart = () => {
      if (!chartCanvas.value) return;
      
      const ctx = chartCanvas.value.getContext('2d');
      chart = new Chart(ctx, {
        type: 'line',
        data: props.chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top'
            },
            tooltip: {
              mode: 'index',
              intersect: false
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Date'
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Device Count'
              }
            }
          }
        }
      });
    };

    onMounted(() => {
      createChart();
    });

    watch(() => props.chartData, (newData) => {
      if (chart) {
        chart.data = newData;
        chart.update();
      }
    }, { deep: true });

    return {
      chartCanvas,
      loading,
      daysNumber
    };
  }
};
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 300px;
  width: 100%;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.7);
}
</style>
