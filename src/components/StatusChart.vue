<template>
  <div class="chart-wrapper">
    <div class="chart-container">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, computed } from 'vue'
import Chart from 'chart.js/auto'

export default {
  props: {
    chartData: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    const chartCanvas = ref(null)
    const processedData = ref([])
    let chart = null

    const calculatePercentages = () => {
      if (!props.chartData || !props.chartData.labels || !props.chartData.datasets) {
        processedData.value = []
        return
      }

      const labels = props.chartData.labels
      const data = props.chartData.datasets[0].data
      const colors = props.chartData.datasets[0].backgroundColor
      const total = data.reduce((a, b) => a + b, 0)

      processedData.value = labels.map((label, index) => {
        const value = data[index]
        const percentage = total > 0 ? Math.round((value / total) * 100) : 0
        return {
          label,
          value,
          percentage,
          color: colors[index],
        }
      })
    }

    const createChart = () => {
      if (!chartCanvas.value) return

      const ctx = chartCanvas.value.getContext('2d')

      // Set stable width/height for the canvas to prevent layout shifts
      chartCanvas.value.style.width = '100%'
      chartCanvas.value.style.height = '240px'

      // Set configuration options with a focus on preventing label clipping and size stability
      chart = new Chart(ctx, {
        type: 'doughnut',
        data: props.chartData,
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 1, // Keep the chart perfectly square
          devicePixelRatio: 2,
          plugins: {
            legend: {
              display: false, // We're using custom legend below the chart
              position: 'bottom',
              align: 'center',
              labels: {
                font: {
                  size: 12,
                  family: "'Roboto', sans-serif",
                  weight: 500,
                },
                color: '#f1f5f9',
                padding: 16,
                usePointStyle: true,
                boxWidth: 8,
                boxHeight: 8,
                textAlign: 'center',
              },
              maxWidth: 280,
              maxHeight: 100,
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const label = context.label || ''
                  const value = context.formattedValue
                  const total = context.dataset.data.reduce((a, b) => a + b, 0)
                  const percentage = Math.round((context.raw / total) * 100)
                  return `${label}: ${value} (${percentage}%)`
                },
              },
              padding: 12,
              displayColors: true,
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              titleColor: '#ffffff',
              bodyColor: '#ffffff',
              titleFont: {
                size: 14,
                weight: 'bold',
              },
              bodyFont: {
                size: 13,
              },
              cornerRadius: 6,
            },
            datalabels: {
              display: false,
            },
          },
          cutout: '60%',
          rotation: -90,
          layout: {
            padding: 0, // Remove padding to prevent layout instability
          },
          animation: {
            animateScale: false, // Disable animations that can cause layout shifts
            animateRotate: false,
            duration: 0,
          },
          elements: {
            arc: {
              borderWidth: 0,
              borderColor: 'transparent',
            },
          },
          resizeDelay: 0, // Avoid delayed resizing which can cause shifting
          onResize: null, // Disable automatic resize handling to prevent layout shifts
        },
      })
    }

    onMounted(() => {
      calculatePercentages()
      createChart()
    })

    watch(
      () => props.chartData,
      (newData) => {
        calculatePercentages()
        if (chart) {
          // Only update if the data has actually changed to prevent unnecessary redraws
          const currentData = chart.data.datasets[0].data
          const newDataValues = newData.datasets[0].data

          // Compare data arrays
          const hasChanged =
            currentData.length !== newDataValues.length ||
            currentData.some((val, idx) => val !== newDataValues[idx])

          if (hasChanged) {
            chart.data = newData
            chart.update({
              duration: 0, // Disable animation for updates
              lazy: false, // Force immediate update
              easing: 'linear',
            })
          }
        }
      },
      { deep: true },
    )

    return {
      chartCanvas,
      processedData,
    }
  },
}
</script>

<style scoped>
.chart-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  min-height: 220px;
  padding: 0;
  box-sizing: border-box;
  position: relative;
  overflow: visible !important;
}

.chart-container {
  position: relative;
  height: 100%;
  width: 100%;
  max-width: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
  overflow: visible !important;
  padding: 0;
}

canvas {
  max-width: 100%;
  height: auto !important;
  display: block;
}

/* Ensure proper chart sizing on different screen sizes */
@media (max-width: 960px) {
  .chart-wrapper {
    min-height: 200px;
  }

  .chart-container {
    max-width: 280px;
  }
}

@media (max-width: 768px) {
  .chart-wrapper {
    min-height: 180px;
  }

  .chart-container {
    max-width: 240px;
  }
}

@media (max-width: 600px) {
  .chart-wrapper {
    min-height: 180px;
  }

  .chart-container {
    max-width: 200px;
  }
}
</style>
