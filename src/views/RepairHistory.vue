<template>
  <div>
    <div class="d-flex align-center mb-6">
      <v-icon size="large" color="warning" class="mr-2">mdi-wrench</v-icon>
      <h1 class="text-h4 font-weight-bold">Repair History</h1>
      <v-spacer></v-spacer>
      
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="Search repair history"
        density="compact"
        variant="outlined"
        hide-details
        style="max-width: 300px"
        class="mr-2"
        clearable
      ></v-text-field>
      
      <v-btn 
        color="primary" 
        prepend-icon="mdi-refresh"
        variant="tonal"
        @click="refreshData"
        :loading="loading"
        elevation="1"
      >
        Refresh
      </v-btn>
    </div>
    
    <!-- Description Card -->
    <v-card elevation="2" class="mb-6">
      <v-card-text class="pa-4">
        <div class="d-flex align-center">
          <v-icon color="info" class="mr-2">mdi-information-outline</v-icon>
          <span class="text-body-1">This page shows the history of devices that have been sent for repair (status changed from "Inactive" to "Under Repair").</span>
        </div>
      </v-card-text>
    </v-card>
    
    <!-- Main Data Card -->
    <v-card elevation="3">
      <v-card-title class="d-flex align-center py-3">
        <v-icon color="warning" class="mr-2">mdi-history</v-icon>
        <span>Repair Records</span>
        <v-chip 
          color="warning" 
          size="small" 
          class="ml-2"
          variant="outlined"
        >
          {{ repairLogs.length }} records
        </v-chip>
      </v-card-title>
      <v-divider></v-divider>
      
      <!-- Filters -->
      <v-row class="pa-4">
        <v-col cols="12" sm="6" md="4">
          <v-select
            v-model="filters.system"
            :items="systemOptions"
            label="Filter by System"
            variant="outlined"
            density="compact"
            clearable
            hide-details
            @update:model-value="filterData"
          ></v-select>
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-select
            v-model="filters.timeframe"
            :items="timeframeOptions"
            label="Time Period"
            variant="outlined"
            density="compact"
            hide-details
            @update:model-value="filterData"
          ></v-select>
        </v-col>
        <v-col cols="12" sm="6" md="4" class="d-flex align-center">
          <v-btn 
            color="primary" 
            variant="text" 
            size="small" 
            @click="resetFilters"
            prepend-icon="mdi-filter-remove"
          >
            Reset Filters
          </v-btn>
        </v-col>
      </v-row>
      
      <!-- Data Table -->
      <v-data-table
        :headers="headers"
        :items="filteredLogs"
        :search="search"
        :loading="loading"
        :items-per-page="10"
        density="comfortable"
        class="elevation-0"
      >
        <template v-slot:item.device_info="{ item }">
          <div>
            <div class="font-weight-medium">{{ getDeviceName(item.device_id) }}</div>
            <div class="text-caption">{{ getDeviceSystem(item.device_id) }}</div>
          </div>
        </template>
        
        <template v-slot:item.timestamp="{ item }">
          {{ formatDate(item.timestamp) }}
        </template>
        
        <template v-slot:item.action_type="{ item }">
          <v-chip
            color="warning"
            size="x-small"
            variant="tonal"
          >
            <v-icon start size="x-small">mdi-wrench</v-icon>
            Status Change
          </v-chip>
        </template>
        
        <template v-slot:item.created_by="{ item }">
          <v-avatar size="24" color="primary" class="mr-1" v-if="item.created_by !== 'system'">
            <span class="text-caption">{{ item.created_by.charAt(0).toUpperCase() }}</span>
          </v-avatar>
          <span>{{ item.created_by === 'system' ? 'System' : item.created_by }}</span>
        </template>
        
        <template v-slot:item.actions="{ item }">
          <v-btn
            icon
            variant="text"
            size="small"
            color="primary"
            @click="viewDeviceDetails(item.device_id)"
          >
            <v-icon size="small">mdi-eye</v-icon>
          </v-btn>
        </template>
        
        <!-- No Data Display -->
        <template v-slot:no-data>
          <div class="text-center py-6">
            <v-icon size="large" color="grey">mdi-wrench-outline</v-icon>
            <p class="mt-2">No repair history records found</p>
            <v-btn color="primary" variant="text" class="mt-2" @click="refreshData">
              Refresh Data
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { logsApi, devicesApi, systemsApi } from '../services/api';

export default {
  setup() {
    const router = useRouter();
    const route = useRoute();
    
    // Data
    const repairLogs = ref([]);
    const allDevices = ref([]);
    const allSystems = ref([]);
    const loading = ref(true);
    const search = ref('');
    
    // Filters
    const filters = ref({
      system: null,
      timeframe: 'all'
    });
    
    // Options for filters
    const timeframeOptions = [
      { title: 'All time', value: 'all' },
      { title: 'Last 24 hours', value: 'day' },
      { title: 'Last 7 days', value: 'week' },
      { title: 'Last 30 days', value: 'month' },
    ];
    
    const systemOptions = computed(() => {
      return allSystems.value.map(system => ({
        title: system.name,
        value: system.id
      }));
    });
    
    // Table headers
    const headers = [
      { title: 'Device', key: 'device_info', width: '25%' },
      { title: 'Description', key: 'description', width: '30%' },
      { title: 'Action', key: 'action_type', width: '15%' },
      { title: 'Date & Time', key: 'timestamp', width: '15%' },
      { title: 'Created By', key: 'created_by', width: '10%' },
      { title: 'Actions', key: 'actions', sortable: false, width: '5%' }
    ];
    
    // Computed filtered logs
    const filteredLogs = computed(() => {
      let result = [...repairLogs.value];
      
      // Apply system filter
      if (filters.value.system) {
        const systemDeviceIds = allDevices.value
          .filter(device => device.system_id === filters.value.system)
          .map(device => device.id);
        
        result = result.filter(log => systemDeviceIds.includes(log.device_id));
      }
      
      // Apply timeframe filter
      if (filters.value.timeframe !== 'all') {
        const now = new Date();
        let cutoffDate;
        
        switch(filters.value.timeframe) {
          case 'day':
            cutoffDate = new Date(now.setDate(now.getDate() - 1));
            break;
          case 'week':
            cutoffDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            cutoffDate = new Date(now.setDate(now.getDate() - 30));
            break;
          default:
            cutoffDate = null;
        }
        
        if (cutoffDate) {
          result = result.filter(log => new Date(log.timestamp) >= cutoffDate);
        }
      }
      
      return result;
    });
    
    // Methods
    const fetchRepairLogs = async () => {
      try {
        loading.value = true;
        // Get repair logs directly using our specialized endpoint
        const response = await logsApi.getRepairLogs(filters.value.system);
        repairLogs.value = response.data || [];
      } catch (error) {
        console.error('Error fetching repair logs:', error);
      } finally {
        loading.value = false;
      }
    };
    
    const fetchDevices = async () => {
      try {
        const response = await devicesApi.getAll();
        allDevices.value = response.data || [];
      } catch (error) {
        console.error('Error fetching devices:', error);
      }
    };
    
    const fetchSystems = async () => {
      try {
        const response = await systemsApi.getAll();
        allSystems.value = response.data || [];
      } catch (error) {
        console.error('Error fetching systems:', error);
      }
    };
    
    const getDeviceName = (deviceId) => {
      const device = allDevices.value.find(d => d.id === deviceId);
      return device ? device.device_name : 'Unknown Device';
    };
    
    const getDeviceSystem = (deviceId) => {
      const device = allDevices.value.find(d => d.id === deviceId);
      if (!device) return 'Unknown System';
      
      const system = allSystems.value.find(s => s.id === device.system_id);
      return system ? system.name : 'Unknown System';
    };
    
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleString();
    };
    
    const viewDeviceDetails = (deviceId) => {
      router.push({ 
        path: '/devices',
        query: { device_id: deviceId }
      });
    };
    
    const refreshData = async () => {
      loading.value = true;
      await Promise.all([
        fetchRepairLogs(),
        fetchDevices(),
        fetchSystems()
      ]);
      loading.value = false;
    };
    
    const filterData = () => {
      // This function is just a hook for the filter updates
      // The actual filtering is done by the computed property
    };
    
    const resetFilters = () => {
      filters.value = {
        system: null,
        timeframe: 'all'
      };
      search.value = '';
    };
    
    // Watch for system filter changes to re-fetch repair logs
    watch(() => filters.value.system, async (newVal) => {
      if (repairLogs.value.length > 0) {
        await fetchRepairLogs();
      }
    });
    
    // Initialize data
    onMounted(async () => {
      await refreshData();
    });
    
    return {
      repairLogs,
      filteredLogs,
      loading,
      search,
      headers,
      filters,
      timeframeOptions,
      systemOptions,
      getDeviceName,
      getDeviceSystem,
      formatDate,
      viewDeviceDetails,
      refreshData,
      filterData,
      resetFilters
    };
  }
};
</script>

<style scoped>
/* Dark navy theme styling for repair history page */
.v-card {
  background: linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.8)) !important;
  border: 1px solid var(--border-color) !important;
  backdrop-filter: blur(10px);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4) !important;
}

/* Add subtle blue glow to warning elements */
.v-icon[color="warning"] {
  filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.3));
}

/* Card title styling */
.v-card-title {
  background: linear-gradient(90deg, #f1f5f9, #e2e8f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
  font-weight: 700 !important;
}

/* Filter section styling */
.v-select {
  background: rgba(15, 23, 42, 0.4) !important;
  border-radius: 8px !important;
}

.v-select:hover {
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
}

/* Table styling enhancements */
.v-data-table {
  background: transparent !important;
  border: 1px solid var(--border-color) !important;
}

.v-data-table-header {
  background-color: rgba(30, 58, 138, 0.15) !important;
}

.v-data-table > .v-data-table__wrapper > table > tbody > tr:hover {
  background-color: rgba(59, 130, 246, 0.08) !important;
}

.v-data-table > .v-data-table__wrapper > table > tbody > tr > td {
  border-bottom: 1px solid rgba(51, 65, 85, 0.5) !important;
}

/* Chip styling */
.v-chip {
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.2) !important;
}

.v-chip[color="warning"] {
  background-color: rgba(245, 158, 11, 0.2) !important;
  color: #f1f5f9 !important;
  border: 1px solid rgba(245, 158, 11, 0.5) !important;
}

/* Animation for refresh button */
.v-btn .v-icon {
  transition: transform 0.3s ease;
}

.v-btn:hover .v-icon {
  transform: rotate(30deg);
}

/* Text styling */
.text-h4 {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  background: linear-gradient(90deg, #f1f5f9, #e2e8f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
  font-weight: 700 !important;
}

/* Responsive adjustments with dark theme support */
@media (max-width: 600px) {
  .d-flex.align-center {
    flex-direction: column;
    align-items: stretch !important;
  }
  
  h1.text-h4 {
    font-size: 1.5rem !important;
    margin-bottom: 1rem;
  }
  
  .v-text-field, .v-btn {
    width: 100%;
    margin-top: 0.5rem;
    margin-right: 0 !important;
  }
}
</style>
