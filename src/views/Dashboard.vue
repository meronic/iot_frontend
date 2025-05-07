<template>
  <div class="dashboard-wrapper">
    <v-container fluid class="dashboard-container px-1 px-sm-2">
      <!-- Page Header with System Filter and Refresh Button -->
      <v-row class="my-1 mx-0">
        <v-col cols="12" md="6" class="d-flex align-center ps-1 ps-sm-2">
          <h1 class="text-h4 mb-0">Device Monitoring Dashboard</h1>
        </v-col>
        <v-col cols="12" md="6" class="d-flex align-center justify-end pe-1 pe-sm-2">
          <SystemFilter 
            :selectedSystem="selectedSystem" 
            @update:selectedSystem="updateSelectedSystem" 
          />
          <v-btn 
            color="primary" 
            variant="tonal" 
            class="ms-2" 
            :loading="isRefreshing"
            @click="refreshData"
          >
            <v-icon left>mdi-refresh</v-icon>
            Refresh
          </v-btn>
          <v-chip 
            class="ms-2 last-updated-chip"
            size="small"
          >
            Last updated: {{ formattedLastUpdate }}
          </v-chip>
        </v-col>
      </v-row>
      
      <!-- Status Summary Cards Row -->
      <v-row class="dashboard-status-row mt-2 mb-1 mx-0" no-gutters>
        <v-col cols="12" class="dashboard-col px-0 py-1">
          <StatusSummaryCards 
            :summary="summary" 
            @navigate-to-devices="navigateToDevices" 
          />
        </v-col>
      </v-row>
      
      <!-- Charts Row -->
      <v-row class="dashboard-chart-row my-1 mx-0" no-gutters>
        <!-- Status Distribution Chart -->
        <v-col cols="12" md="4" class="dashboard-col py-1 ps-0 pe-md-1 pe-0">
          <StatusDistributionChart :summary="summary" />
        </v-col>
        
        <!-- Device Type Summary (IP and LoRa) -->
        <v-col cols="12" md="8" class="dashboard-col py-1 ps-md-1 ps-0 pe-0">
          <DeviceTypeSummary :summary="summary" />
        </v-col>
      </v-row>
      
      <!-- System Status Overview -->
      <v-row class="dashboard-system-row my-1 mx-0" no-gutters>
        <v-col cols="12" class="dashboard-col px-0 py-1">
          <SystemStatusOverview 
            :systemStatus="systemStatus" 
            @navigate-to-devices-by-system="navigateToDevicesBySystem" 
          />
        </v-col>
      </v-row>
      
      <!-- Device Status Trends -->
      <v-row class="dashboard-trends-row mt-1 mb-2 mx-0" no-gutters>
        <v-col cols="12" class="dashboard-col px-0 py-1">
          <DeviceStatusTrends 
            :trends="trends" 
            @update-trend-days="trendDaysSelection = $event; fetchTrendData();" 
          />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import SystemFilter from '@/components/SystemFilter.vue';
import { dashboardApi, systemsApi } from '@/services/api';
import { fallbackSummary, fallbackSystemStatus, getFallbackTrendData } from '@/dashboard-fallback';
import { deepClone } from '@/utils/helpers'; // We will create this utility

// Import dashboard components
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
    // Initialize with deep cloned fallback data to ensure something is always shown
    const summary = ref(deepClone(fallbackSummary));
    const trends = ref(deepClone(getFallbackTrendData(7)));
    const systemStatus = ref(deepClone(fallbackSystemStatus));
    const isRefreshing = ref(false);
    const lastUpdated = ref(new Date());
    const selectedSystem = ref(null);
    const trendDaysSelection = ref("7");
    
    // Keep a backup copy of the data to ensure we always have something to show
    const backupSummary = deepClone(fallbackSummary);
    const backupTrends = deepClone(getFallbackTrendData(7));
    const backupSystemStatus = deepClone(fallbackSystemStatus);
    
    // Format the last updated time
    const formattedLastUpdate = computed(() => {
      const date = new Date(lastUpdated.value);
      return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(date);
    });
    
    // Navigation helper functions
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
    
    // Handle system filter changes
    const updateSelectedSystem = (systemId) => {
      selectedSystem.value = systemId;
      fetchDashboardData();
    };
    
    // Fetch trend data with reliable fallback
    const fetchTrendData = async () => {
      // Store current trends as temporary backup
      const currentTrends = deepClone(trends.value);
      const days = parseInt(trendDaysSelection.value);
      
      try {
        const trendResult = await dashboardApi.getTrends(days, selectedSystem.value);
        
        // Validate trend data structure
        if (trendResult && trendResult.data && 
            trendResult.data.dates && 
            Array.isArray(trendResult.data.dates) && 
            trendResult.data.dates.length > 0 &&
            trendResult.data.active && 
            trendResult.data.inactive && 
            trendResult.data.under_repair) {
          
          trends.value = trendResult.data;
        } else {
          console.warn('Invalid trend data structure, using fallback');
          
          // If current data is valid, keep it, otherwise use generated fallback
          if (currentTrends && 
              currentTrends.dates && 
              Array.isArray(currentTrends.dates) && 
              currentTrends.dates.length > 0) {
            trends.value = currentTrends;
          } else {
            trends.value = deepClone(getFallbackTrendData(days));
          }
        }
      } catch (error) {
        console.error('Error fetching trend data:', error);
        
        // If current data is valid, keep it, otherwise use generated fallback
        if (currentTrends && 
            currentTrends.dates && 
            Array.isArray(currentTrends.dates) && 
            currentTrends.dates.length > 0) {
          trends.value = currentTrends;
        } else {
          trends.value = deepClone(getFallbackTrendData(days));
        }
      }
    };
    
    // Fetch dashboard data from API with fallback
    const fetchDashboardData = async () => {
      isRefreshing.value = true;
      
      // Store current data as temporary backup before fetching
      const currentSummary = deepClone(summary.value);
      const currentSystemStatus = deepClone(systemStatus.value);
      
      try {
        // Try to fetch data from API
        const [summaryResult, systemStatusResult] = await Promise.all([
          dashboardApi.getSummary(selectedSystem.value),
          systemsApi.getStatus()
        ]);
        
        // Validate and safely update summary data
        if (summaryResult && summaryResult.data && 
            summaryResult.data.total_devices !== undefined && 
            summaryResult.data.status && 
            summaryResult.data.device_types) {
          
          // Ensure complete data structure, falling back to current values for missing properties
          const validatedSummary = ensureObjectCompleteness(summaryResult.data, backupSummary);
          summary.value = validatedSummary;
        } else {
          console.warn('Invalid summary data structure, keeping current data');
          // Keep current data or fall back to backup if current is invalid
          if (!summary.value || !summary.value.total_devices) {
            summary.value = deepClone(currentSummary.total_devices ? currentSummary : backupSummary);
          }
        }
        
        // Validate and safely update system status data
        if (systemStatusResult && Array.isArray(systemStatusResult.data) && 
            systemStatusResult.data.length > 0) {
          systemStatus.value = systemStatusResult.data;
        } else {
          console.warn('Invalid system status data structure, keeping current data');
          // Keep current data or fall back to backup if current is invalid
          if (!systemStatus.value || !Array.isArray(systemStatus.value) || systemStatus.value.length === 0) {
            systemStatus.value = deepClone(
              Array.isArray(currentSystemStatus) && currentSystemStatus.length > 0 
                ? currentSystemStatus 
                : backupSystemStatus
            );
          }
        }
        
        lastUpdated.value = new Date();
        
        // Fetch trend data
        await fetchTrendData();
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        
        // On error, ensure data is still displayed by using current data or fallback
        if (!summary.value || !summary.value.total_devices) {
          summary.value = deepClone(currentSummary.total_devices ? currentSummary : backupSummary);
        }
        
        if (!systemStatus.value || !Array.isArray(systemStatus.value) || systemStatus.value.length === 0) {
          systemStatus.value = deepClone(
            Array.isArray(currentSystemStatus) && currentSystemStatus.length > 0 
              ? currentSystemStatus 
              : backupSystemStatus
          );
        }
      } finally {
        isRefreshing.value = false;
      }
    };
    
    // Refresh dashboard data
    const refreshData = () => {
      fetchDashboardData();
    };
    
    // Initialize and fetch data on component mount
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
  max-width: 98%; /* Fill most of the screen width */
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
    max-width: 99%; /* Almost full width on very large screens */
  }
  
  .dashboard-col {
    padding: 10px 14px; /* Slightly larger padding on very large screens */
  }
}

/* Large screens */
@media (min-width: 1200px) and (max-width: 1919px) {
  .dashboard-container {
    max-width: 98%; /* Large width on standard desktop screens */
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
    padding: 0 4px; /* Minimal padding on small screens */
  }
  
  .dashboard-col {
    padding: 6px 4px;
  }
}
</style>