<template>
  <div>
    <!-- Filter Controls -->
    <div v-if="showFilters" class="d-flex flex-wrap align-center mb-3 device-filter-bar">
      <v-select
        v-model="localFilters.status"
        :items="statusOptions"
        label="Status"
        density="compact"
        variant="outlined"
        class="mr-4 mb-2"
        style="min-width: 150px;"
        clearable
        @update:model-value="applyFilters"
      ></v-select>
      
      <v-select
        v-model="localFilters.deviceType"
        :items="deviceTypeOptions"
        label="Device Type"
        density="compact"
        variant="outlined"
        class="mr-4 mb-2"
        style="min-width: 150px;"
        clearable
        @update:model-value="applyFilters"
      ></v-select>
      
      <v-text-field
        v-model="localFilters.search"
        prepend-inner-icon="mdi-magnify"
        label="Search devices"
        density="compact"
        variant="outlined"
        hide-details
        class="mr-4 mb-2"
        style="min-width: 200px;"
        @update:model-value="applyFilters"
        clearable
      ></v-text-field>
      
      <v-btn 
        color="primary"
        variant="text"
        size="small"
        @click="resetFilters"
        class="mb-2"
      >
        <v-icon start>mdi-filter-remove</v-icon>
        Reset
      </v-btn>
    </div>
    
    <!-- Data Table -->
    <v-data-table
      :headers="headers"
      :items="filteredDevices"
      :loading="loading"
      :search="localFilters.search"
      class="elevation-1"
      :items-per-page="limit || 10"
    >
      <template v-slot:item.status="{ item }">
        <v-chip
          :color="getStatusColor(item.status)"
          text-color="white"
          size="x-small"
        >
          {{ formatStatus(item.status) }}
        </v-chip>
      </template>
      
      <template v-slot:item.is_lora="{ item }">
        <v-icon v-if="item.is_lora" color="purple" size="small">mdi-access-point</v-icon>
        <v-icon v-else color="blue" size="small">mdi-lan</v-icon>
        <span class="ml-1">{{ item.is_lora ? 'LoRa' : 'IP' }}</span>
      </template>
      
      <template v-slot:item.created_at="{ item }">
        {{ formatDate(item.created_at) }}
      </template>
      
      <template v-slot:item.actions="{ item }">
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn
              icon
              variant="text"
              size="small"
              v-bind="props"
            >
              <v-icon size="small">mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item
              @click="$emit('edit', item)"
            >
              <v-list-item-title>
                <v-icon size="small" start>mdi-pencil</v-icon>
                Edit
              </v-list-item-title>
            </v-list-item>
            
            <v-list-item
              v-if="item.status === 'inactive'"
              @click="setToRepair(item)"
              density="compact"
            >
              <v-list-item-title>
                <v-icon size="small" start color="warning">mdi-wrench</v-icon>
                Set to Repair
              </v-list-item-title>
            </v-list-item>
            
            <v-list-item
              @click="$emit('delete', item)"
              density="compact"
            >
              <v-list-item-title>
                <v-icon size="small" start color="error">mdi-delete</v-icon>
                Delete
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
      
      <!-- No Data Display -->
      <template v-slot:no-data>
        <div class="text-center py-4">
          <v-icon size="large" color="grey">mdi-devices-off</v-icon>
          <p class="mt-2">No devices found</p>
        </div>
      </template>
    </v-data-table>
    
    <!-- Set to Repair Confirmation Dialog -->
    <v-dialog v-model="showRepairDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h5">
          Set Device to Repair
        </v-card-title>
        <v-card-text>
          <p>Are you sure you want to set <strong>{{ selectedDevice?.device_name }}</strong> to "Under Repair" status?</p>
          <p class="mt-2">This will create a repair history entry and notify maintenance personnel.</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="showRepairDialog = false">
            Cancel
          </v-btn>
          <v-btn color="warning" variant="elevated" @click="confirmSetToRepair">
            Set to Repair
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';
import axios from 'axios';

export default {
  props: {
    filters: {
      type: Object,
      default: () => ({ search: '', systemId: null, status: null })
    },
    limit: {
      type: Number,
      default: null
    },
    showFilters: {
      type: Boolean,
      default: false
    }
  },
  emits: ['edit', 'delete', 'status-updated'],
  setup(props, { emit }) {
    const devices = ref([]);
    const loading = ref(true);
    const showRepairDialog = ref(false);
    const selectedDevice = ref(null);
    
    // Local filter state
    const localFilters = ref({
      search: props.filters.search || '',
      systemId: props.filters.systemId || null,
      status: props.filters.status || null,
      deviceType: null
    });
    
    // Filter options
    const statusOptions = [
      { title: 'Active', value: 'active' },
      { title: 'Inactive', value: 'inactive' },
      { title: 'Under Repair', value: 'under_repair' }
    ];
    
    const deviceTypeOptions = [
      { title: 'IP Devices', value: 'ip' },
      { title: 'LoRa Devices', value: 'lora' }
    ];
    
    const headers = [
      { title: 'Device Name', key: 'device_name', width: '20%' },
      { title: 'Facility', key: 'facility_name', width: '15%' },
      { title: 'System', key: 'system_name', width: '15%' },
      { title: 'IP Address', key: 'ip_address', width: '12%' },
      { title: 'Type', key: 'is_lora', width: '10%' },
      { title: 'Status', key: 'status', width: '10%' },
      { title: 'Created', key: 'created_at', width: '12%' },
      { title: 'Actions', key: 'actions', sortable: false, width: '6%' }
    ];
    
    // Computed property for filtered devices
    const filteredDevices = computed(() => {
      let result = [...devices.value];
      
      if (localFilters.value.status) {
        result = result.filter(device => device.status === localFilters.value.status);
      }
      
      if (localFilters.value.deviceType) {
        if (localFilters.value.deviceType === 'lora') {
          result = result.filter(device => device.is_lora);
        } else if (localFilters.value.deviceType === 'ip') {
          result = result.filter(device => !device.is_lora);
        }
      }
      
      return result;
    });
    
    const fetchDevices = async () => {
      try {
        loading.value = true;
        
        let url = '/api/devices';
        const params = {};
        
        // Apply incoming filters from props to API request
        if (props.filters.systemId) {
          params.system_id = props.filters.systemId;
          localFilters.value.systemId = props.filters.systemId;
        }
        
        if (props.filters.status) {
          params.status = props.filters.status;
          localFilters.value.status = props.filters.status;
        }
        
        if (props.filters.search) {
          params.search = props.filters.search;
          localFilters.value.search = props.filters.search;
        }
        
        const response = await axios.get(url, { params });
        devices.value = response.data;
      } catch (error) {
        console.error('Error fetching devices:', error);
      } finally {
        loading.value = false;
      }
    };
    
    const getStatusColor = (status) => {
      const statusColors = {
        'active': 'success',
        'inactive': 'error',
        'under_repair': 'warning'
      };
      return statusColors[status] || 'grey';
    };
    
    const formatStatus = (status) => {
      return status
        .replace('_', ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
    };
    
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleString();
    };
    
    const applyFilters = () => {
      // This method uses the computed filteredDevices property
      // No need to do anything here as the computed property handles filtering
    };
    
    const resetFilters = () => {
      localFilters.value = {
        search: '',
        systemId: props.filters.systemId || null, // Keep the system filter from props
        status: null,
        deviceType: null
      };
    };
    
    const setToRepair = (device) => {
      selectedDevice.value = device;
      showRepairDialog.value = true;
    };
    
    const confirmSetToRepair = async () => {
      try {
        loading.value = true;
        const response = await axios.put(`/api/devices/${selectedDevice.value.id}/status`, {
          status: 'under_repair'
        });
        
        // Update local device data
        const index = devices.value.findIndex(d => d.id === selectedDevice.value.id);
        if (index !== -1) {
          devices.value[index].status = 'under_repair';
        }
        
        // Create a log entry for the status change
        await axios.post('/api/logs', {
          device_id: selectedDevice.value.id,
          action_type: 'status_change',
          description: `Device status changed from inactive to under_repair`,
          created_by: 'user'
        });
        
        showRepairDialog.value = false;
        emit('status-updated', { ...selectedDevice.value, status: 'under_repair' });
      } catch (error) {
        console.error('Error setting device to repair:', error);
      } finally {
        loading.value = false;
      }
    };
    
    // Watch for changes in filters prop
    watch(() => props.filters, (newFilters) => {
      // Update localFilters.systemId if it has changed in props
      if (newFilters.systemId !== localFilters.value.systemId) {
        localFilters.value.systemId = newFilters.systemId;
      }
      
      // Update localFilters.status if it has changed in props
      if (newFilters.status !== localFilters.value.status) {
        localFilters.value.status = newFilters.status;
      }
      
      fetchDevices();
    }, { deep: true });
    
    onMounted(() => {
      fetchDevices();
      
      // Set up auto-refresh every 60 seconds
      const interval = setInterval(fetchDevices, 60000);
      
      return () => {
        clearInterval(interval);
      };
    });
    
    return {
      devices,
      filteredDevices,
      localFilters,
      headers,
      loading,
      statusOptions,
      deviceTypeOptions,
      showRepairDialog,
      selectedDevice,
      getStatusColor,
      formatStatus,
      formatDate,
      applyFilters,
      resetFilters,
      setToRepair,
      confirmSetToRepair
    };
  }
};
</script>

<style scoped>
.device-filter-bar {
  background-color: var(--surface-color, #1E293B);
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Mobile responsiveness */
@media (max-width: 600px) {
  .device-filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .device-filter-bar .v-select,
  .device-filter-bar .v-text-field,
  .device-filter-bar .v-btn {
    width: 100%;
    margin-right: 0 !important;
  }
}
</style>
