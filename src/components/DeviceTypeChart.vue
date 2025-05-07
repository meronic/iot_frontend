<template>
  <div class="chart-wrapper">
    <div class="chart-container">
      <canvas ref="chartCanvas"></canvas>
    </div>
    <div class="chart-labels" v-if="processedData.length > 0">
      <div v-for="(item, index) in processedData" :key="index" class="chart-label" 
        :style="{ borderLeftColor: item.color }">
        <span class="label-name">{{ item.label }}:</span>
        <span class="label-value">{{ item.value }}</span>
        <span class="label-percentage">({{ item.percentage }}%)</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, computed } from 'vue';
import Chart from 'chart.js/auto';

export default {
  props: {
    chartData: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const chartCanvas = ref(null);
    const processedData = ref([]);
    let chart = null;

    const calculatePercentages = () => {
      if (!props.chartData || !props.chartData.labels || !props.chartData.datasets) {
        processedData.value = [];
        return;
      }

      const labels = props.chartData.labels;
      const data = props.chartData.datasets[0].data;
      const colors = props.chartData.datasets[0].backgroundColor;
      const total = data.reduce((a, b) => a + b, 0);
      
      processedData.value = labels.map((label, index) => {
        const value = data[index];
        const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
        return {
          label,
          value,
          percentage,
          color: colors[index]
        };
      });
    };

    const createChart = () => {
      if (!chartCanvas.value) return;
      
      const ctx = chartCanvas.value.getContext('2d');
      chart = new Chart(ctx, {
        type: 'doughnut', // Changed from pie to doughnut for consistency
        data: props.chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false // Hide the legend since we're using custom labels
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.formattedValue;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = Math.round((context.raw / total) * 100);
                  return `${label}: ${value} (${percentage}%)`;
                }
              }
            }
          },
          cutout: '70%' // Match the StatusChart cutout
        }
      });
    };

    onMounted(() => {
      calculatePercentages();
      createChart();
    });

    watch(() => props.chartData, (newData) => {
      calculatePercentages();
      if (chart) {
        chart.data = newData;
        chart.update();
      }
    }, { deep: true });

    return {
      chartCanvas,
      processedData
    };
  }
};
</script>

<style scoped>
.chart-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.chart-container {
  position: relative;
  height: 260px;
  width: 100%;
  margin-bottom: 20px;
}

.chart-labels {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 16px;
}

.chart-label {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: rgba(30, 41, 59, 0.5);
  border-radius: 6px;
  font-size: 0.9rem;
  border-left: 4px solid transparent;
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.chart-label:hover {
  background-color: rgba(30, 41, 59, 0.8);
  transform: translateX(2px);
}

.label-name {
  font-weight: 500;
  margin-right: 8px;
  color: var(--text-primary, #f1f5f9);
}

.label-value {
  font-weight: 600;
  margin-right: 4px;
  color: var(--text-primary, #f1f5f9);
}

.label-percentage {
  font-size: 0.8rem;
  color: var(--text-secondary, #cbd5e1);
}

@media (min-width: 768px) {
  .chart-wrapper {
    flex-direction: row;
  }
  
  .chart-container {
    width: 60%;
    margin-bottom: 0;
  }
  
  .chart-labels {
    width: 40%;
    justify-content: center;
    padding-left: 20px;
  }
}
</style>
