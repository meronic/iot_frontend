<template>
  <div class="status-chart-bar">
    <!-- 차트 컨테이너 -->
    <div class="chart-container">
      <canvas ref="chartCanvas"></canvas>
    </div>

    <!-- 컴팩트한 레전드 -->
    <div class="legend-container">
      <div v-for="(label, index) in chartData.labels" :key="index" class="legend-item">
        <span
          class="legend-dot"
          :style="{ backgroundColor: chartData.datasets[0].backgroundColor[index] }"
        ></span>
        <span class="legend-label">{{ label }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, nextTick } from 'vue'
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
    let chart = null
    const chartLoaded = ref(false)

    const createChart = async () => {
      if (!chartCanvas.value) return

      await nextTick()

      // 콘솔에 디버깅 정보 출력
      console.log('차트 생성 시작', props.chartData)

      const ctx = chartCanvas.value.getContext('2d')

      // 차트 크기 확인
      const rect = chartCanvas.value.getBoundingClientRect()
      console.log('차트 캔버스 크기:', rect.width, rect.height)

      // 차트 캔버스 높이 증가
      chartCanvas.value.style.width = '100%'
      chartCanvas.value.style.height = '40px' // 높이 증가

      // 캔버스 크기 명시적 설정
      chartCanvas.value.width = rect.width * 2 // 레티나 디스플레이 대응
      chartCanvas.value.height = 80 // 2배 높이로 설정

      const data = props.chartData.datasets[0].data
      const labels = props.chartData.labels
      const colors = props.chartData.datasets[0].backgroundColor
      const total = data.reduce((a, b) => a + b, 0)
      const percentageData = data.map((v) => (v / total) * 100)

      // Chart.js 옵션 수정 - 더 단순하게
      chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Status'],
          datasets: percentageData.map((percent, i) => ({
            label: labels[i],
            data: [percent],
            backgroundColor: colors[i],
            borderWidth: 0,
          })),
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              enabled: true,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 10,
              bodyFont: {
                size: 12,
              },
              callbacks: {
                label: function (context) {
                  const dataIndex = context.datasetIndex
                  return `${labels[dataIndex]}: ${data[dataIndex]} (${percent.toFixed(1)}%)`
                },
              },
            },
          },
          scales: {
            x: {
              stacked: true,
              display: false,
              grid: {
                display: false,
              },
            },
            y: {
              stacked: true,
              display: false,
              grid: {
                display: false,
              },
            },
          },
          animation: false, // 애니메이션 비활성화로 렌더링 문제 방지
        },
      })

      console.log('차트 생성 완료')
      chartLoaded.value = true
    }

    onMounted(() => {
      // 충분한 시간 후 차트 생성
      setTimeout(() => {
        createChart()
      }, 200)
    })

    watch(
      () => props.chartData,
      (newData) => {
        if (chart) {
          chart.destroy()
          chartLoaded.value = false

          setTimeout(() => {
            createChart()
          }, 100)
        }
      },
      { deep: true },
    )

    return {
      chartCanvas,
      chartLoaded,
    }
  },
}
</script>

<style scoped>
.status-chart-bar {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 6px;
}

.chart-container {
  width: 100%;
  height: 24px; /* 더 작은 높이 */
  position: relative;
}

canvas {
  width: 100% !important;
  height: 100% !important;
  display: block;
}

.legend-container {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 2px 5px;
  border-radius: 3px;
  background-color: rgba(30, 41, 59, 0.3);
}

.legend-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}

.legend-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.85);
  white-space: nowrap;
}

@media (max-width: 600px) {
  .legend-container {
    gap: 4px;
  }

  .legend-item {
    padding: 1px 4px;
  }

  .legend-label {
    font-size: 8px;
  }
}
</style>
