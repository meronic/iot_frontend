<template>
  <div class="dashboard-wrapper">
    <v-container fluid class="dashboard-container px-1 px-sm-1">
      <!-- Page Header with System Filter and Refresh Button -->
      <v-row class="my-1 mx-0">
        <v-col cols="12" md="6" class="d-flex align-center ps-1 ps-sm-2">
          <h1 class="text-h5 mb-0">IoT 단말기 전체 현황</h1>
        </v-col>


        <v-col cols="12" md="6" class="d-flex align-center justify-end pe-1 pe-sm-2">
          <!-- <SystemFilter :selectedSystem="selectedSystem" @update:selectedSystem="updateSelectedSystem" /> -->
          <v-btn color="primary" variant="tonal" class="ms-2" :loading="isRefreshing" @click="refreshData">
            <v-icon left>mdi-refresh</v-icon>
            Refresh
          </v-btn>
          <v-chip class="ms-2 last-updated-chip" size="small">
            마지막 업데이트 시간 : {{ formattedLastUpdate }}
          </v-chip>
        </v-col>
      </v-row>

      <!-- 첫번째 카드 줄 전체 현황 -->
      <!-- Status Summary Cards Row -->
      <v-row class="dashboard-status-row mt-2 mb-1 mx-0" no-gutters>
        <v-col cols="12" class="dashboard-col px-0 py-1">
          <StatusSummaryCards :summary="summary" @navigate-to-devices="navigateToDevices" />
        </v-col>
      </v-row>

      <!-- 두번째 카드 줄  -->
      <!-- Charts Row -->
      <v-row class="dashboard-chart-row my-1 mx-0" no-gutters>
        <!-- 상태 현황 -->
        <v-col cols="12" md="6" lg="6" class="dashboard-col py-1 pe-3">
          <DeviceStatusTrends :trends="trends" @update-trend-days="trendDaysSelection = $event; fetchTrendData();"
            class="fixed-height-card" />
        </v-col>

        <!-- Device Type Summary (IP and LoRa) -->
        <v-col cols="12" md="6" lg="6" class="dashboard-col py-1 pe-2">
          <DeviceTypeSummary :summary="summary" class="fixed-height-card" />
        </v-col>
      </v-row>


      <!-- System Status Overview -->
      <v-row class="dashboard-system-row my-1 mx-0" no-gutters>
        <v-col cols="12" class="dashboard-col px-0 py-1">
          <SystemStatusOverview :systemStatus="systemStatus" @navigate-to-devices-by-system="navigateToDevicesBySystem" />
        </v-col>
      </v-row>

      <!-- 차트 긴거 일단 주석 처리 -->
      <!-- Device Status Trends -->
      <!-- <v-row class="dashboard-trends-row mt-1 mb-2 mx-0" no-gutters>
        <v-col cols="12" class="dashboard-col px-0 py-1">
          <DeviceStatusTrends :trends="trends" @update-trend-days="trendDaysSelection = $event; fetchTrendData();" />
        </v-col>
      </v-row> -->
    </v-container>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import SystemFilter from '@/components/SystemFilter.vue';
import { dashboardApi, systemsApi } from '@/services/api';
import { fallbackSummary, fallbackSystemStatus, getFallbackTrendData } from '@/dashboard-fallback';
import { deepClone } from '@/utils/helpers';

import StatusSummaryCards from '@/components/dashboard/StatusSummaryCards.vue';
import StatusDistributionChart from '@/components/dashboard/StatusDistributionChart.vue';
import DeviceTypeSummary from '@/components/dashboard/DeviceTypeSummary.vue';
import SystemStatusOverview from '@/components/dashboard/SystemStatusOverview.vue';
import DeviceStatusTrends from '@/components/dashboard/DeviceStatusTrends.vue';

export default {
  components: {
    SystemFilter,
    StatusSummaryCards,
    StatusDistributionChart,
    DeviceTypeSummary,
    SystemStatusOverview,
    DeviceStatusTrends
  },

  setup() {
    const router = useRouter();
    const summary = ref(deepClone(fallbackSummary));
    const trends = ref(deepClone(getFallbackTrendData(7)));
    const systemStatus = ref(deepClone(fallbackSystemStatus));
    const isRefreshing = ref(false);
    const lastUpdated = ref(new Date());
    const selectedSystem = ref(null);
    const trendDaysSelection = ref("7");

    const backupSummary = deepClone(fallbackSummary);
    const backupTrends = deepClone(getFallbackTrendData(7));
    const backupSystemStatus = deepClone(fallbackSystemStatus);

    const formattedLastUpdate = computed(() => {
      const date = new Date(lastUpdated.value);
      return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(date);
    });

    const navigateToDevices = (status) => {
      router.push({
        path: '/devices',
        query: {
          status: status,
          system: selectedSystem.value
        }
      });
    };

    const navigateToDevicesBySystem = (systemId) => {
      router.push({
        path: '/devices',
        query: { system: systemId }
      });
    };

    const updateSelectedSystem = (systemId) => {
      selectedSystem.value = systemId;
      fetchDashboardData();
    };

    // trend data fetch
    const fetchTrendData = async () => {
      const currentTrends = deepClone(trends.value);
      const days = parseInt(trendDaysSelection.value);

      try {
        const trendResult = await dashboardApi.getTrends(days, selectedSystem.value);
        console.log('[Trend API 응답 확인]', trendResult);

        const rawArray = trendResult?.data?.data;  // ✅ 배열은 여기 있음

        if (Array.isArray(rawArray) && rawArray.length > 0) {
          const processed = {
            dates: [],
            active: [],
            inactive: [],
            under_repair: []
          };

          rawArray.forEach(item => {
            processed.dates.push(item.date);
            processed.active.push(item.active_devices);
            processed.inactive.push(item.inactive_devices);
            processed.under_repair.push(item.under_repair_devices);
          });

          console.log('[📊 Trend 변환 결과]', processed);
          trends.value = processed;
        } else {
          console.warn('Invalid trend data structure, using fallback (empty)');
          trends.value = currentTrends?.dates?.length > 0
            ? currentTrends
            : deepClone(getFallbackTrendData(days));
        }
      } catch (error) {
        console.error('Error fetching trend data:', error);
        trends.value = currentTrends?.dates?.length > 0
          ? currentTrends
          : deepClone(getFallbackTrendData(days));
      }
    };



    const fetchDashboardData = async () => {
      isRefreshing.value = true;

      const currentSummary = deepClone(summary.value);
      const currentSystemStatus = deepClone(systemStatus.value);

      try {
        const [summaryResult, systemStatusResult] = await Promise.all([
          dashboardApi.getSummary(selectedSystem.value),
          systemsApi.getStatus()
        ]);

        // ✅ 요약 데이터 적용
        if (summaryResult && summaryResult.data &&
          summaryResult.data.total_devices !== undefined &&
          summaryResult.data.status &&
          summaryResult.data.device_types) {
          summary.value = summaryResult.data;
        } else {
          console.warn('Invalid summary data structure, keeping current data');
          summary.value = currentSummary?.total_devices
            ? currentSummary
            : deepClone(backupSummary);
        }

        // ✅ 시스템 상태 데이터 적용
        if (systemStatusResult && Array.isArray(systemStatusResult.data) && systemStatusResult.data.length > 0) {
          systemStatus.value = systemStatusResult.data;
        } else {
          console.warn('Invalid system status data, keeping current');
          systemStatus.value = currentSystemStatus?.length > 0
            ? currentSystemStatus
            : deepClone(backupSystemStatus);
        }

        lastUpdated.value = new Date();
        await fetchTrendData();
      } catch (error) {
        console.error("Error fetching dashboard data:", error);

        summary.value = currentSummary?.total_devices
          ? currentSummary
          : deepClone(backupSummary);

        systemStatus.value = currentSystemStatus?.length > 0
          ? currentSystemStatus
          : deepClone(backupSystemStatus);
      } finally {
        isRefreshing.value = false;
      }
    };

    const refreshData = () => {
      fetchDashboardData();
    };

    onMounted(() => {
      fetchDashboardData();
    });

    return {
      summary,
      trends,
      systemStatus,
      isRefreshing,
      lastUpdated,
      formattedLastUpdate,
      selectedSystem,
      trendDaysSelection,
      navigateToDevices,
      navigateToDevicesBySystem,
      updateSelectedSystem,
      refreshData,
      fetchTrendData
    };
  }
};
</script>

<style>
/* Dashboard wrapper for full width */
.dashboard-wrapper {
  width: 100%;
  min-height: 100%;
  background-color: #0f172a;
}

/* Dashboard main styling */
.dashboard-container {
  width: 100%;
  max-width: 98%;
  /* Fill most of the screen width */
  margin: 0 auto;
  padding: 0;
}

/* Status Cards Row Styling - with full width and no margins */
.dashboard-status-row,
.dashboard-chart-row,
.dashboard-system-row,
.dashboard-trends-row {
  margin: 0;
  width: 100%;
}

/* Last Updated Chip */
.last-updated-chip {
  background: linear-gradient(to right, #0284c7, #0ea5e9);
  color: white;
  font-weight: 500;
}

/* Status Chart Container - for fixed height/width ratios */
.status-chart-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  overflow: hidden;
}

/* Status Distribution component needs these for stability */
.chart-card-content {
  padding: 0 !important;
}

.static-legend {
  margin-top: 8px !important;
  padding: 0 16px 8px !important;
}

/* Ensure dashboard components have proper heights across all screen sizes */
/* Extra large screens */
@media (min-width: 1920px) {
  .dashboard-container {
    max-width: 99%;
    /* Almost full width on very large screens */
  }

  .dashboard-col {
    padding: 10px 14px;
    /* Slightly larger padding on very large screens */
  }
}

/* Large screens */
@media (min-width: 1200px) and (max-width: 1919px) {
  .dashboard-container {
    max-width: 98%;
    /* Large width on standard desktop screens */
  }

  .dashboard-col {
    padding: 8px 12px;
  }
}

/* Medium screens */
@media (min-width: 960px) and (max-width: 1199px) {
  .dashboard-container {
    max-width: 100%;
  }

  .dashboard-col {
    padding: 8px 10px;
  }
}

/* Small screens */
@media (min-width: 600px) and (max-width: 959px) {
  .dashboard-container {
    max-width: 100%;
  }

  .dashboard-col {
    padding: 8px 8px;
  }
}

/* Extra small screens */
@media (max-width: 599px) {
  .dashboard-container {
    max-width: 100%;
    padding: 0 4px;
    /* Minimal padding on small screens */
  }

  .dashboard-col {
    padding: 6px 4px;
  }
}


/* 두 컴포넌트의 높이를 고정합니다 */
.fixed-height-card {
  height: 350px !important;
  /* 필요한 경우 이 값을 조정하세요 */
  min-height: 400px !important;
  max-height: 400px !important;
  overflow: hidden;
}

/* DeviceTypeSummary 컴포넌트에 적용할 스타일 */
/* DeviceTypeSummary.vue 파일에 이 스타일을 추가하세요 */
.dashboard-card {
  height: 100% !important;
}

/* 내부 차트 컨테이너의 높이를 조정합니다 */
.trend-chart-container {
  height: 200px;
  /* 이미 DeviceStatusTrends에 있는 값 */
}
</style>