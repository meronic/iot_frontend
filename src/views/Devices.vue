<template>
  <div>
    <div class="d-flex align-center mb-6">
      <v-icon size="large" color="primary" class="mr-2">mdi-devices</v-icon>
      <h1 class="text-h4 font-weight-bold">Devices Management</h1>
      <v-spacer></v-spacer>
      
      <!-- Fixed System Filter -->
      <system-filter 
        @update:system="updateSystemFilter" 
        :value="filters.systemId"
        class="mr-2" 
        variant="tonal"
      ></system-filter>
      
      <!-- Add Device Button -->
      <v-btn 
        color="primary" 
        prepend-icon="mdi-plus"
        class="ml-2" 
        @click="showAddDialog = true"
        elevation="1"
      >
        Add Device
      </v-btn>
    </div>
    
    <v-card elevation="3">
      <v-card-title class="d-flex align-center py-3">
        <v-icon color="primary" class="mr-2">mdi-view-list</v-icon>
        <span>Device List</span>
        <v-chip 
          v-if="activeFilters" 
          color="primary" 
          size="small" 
          class="ml-2" 
          variant="outlined"
        >
          Filtered
        </v-chip>
      </v-card-title>
      <v-divider></v-divider>
      
      <!-- Device List Component with Filters -->
      <device-list 
        :filters="filters" 
        :showFilters="true"
        @edit="editDevice" 
        @delete="confirmDeleteDevice"
        @status-updated="handleStatusUpdate"
      ></device-list>
    </v-card>
    
    <!-- Add/Edit Device Dialog (Modal) -->
    <v-dialog v-model="showAddDialog" max-width="600" persistent scrollable>
      <v-card>
        <v-toolbar color="primary" density="compact">
          <v-toolbar-title>
            {{ editMode ? 'Edit Device' : 'Add New Device' }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="showAddDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-card-text class="pt-4">
          <device-form 
            :device="currentDevice" 
            @save="saveDevice"
            @cancel="showAddDialog = false"
          ></device-form>
        </v-card-text>
      </v-card>
    </v-dialog>
    
    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-h5">
          Confirm Delete
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete <strong>{{ currentDevice.device_name }}</strong>? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="showDeleteDialog = false">
            Cancel
          </v-btn>
          <v-btn color="error" variant="flat" @click="deleteDevice">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Success Snackbar -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      :timeout="3000"
      location="top"
    >
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="showSnackbar = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DeviceList from '../components/DeviceList.vue';
import DeviceForm from '../components/DeviceForm.vue';
import SystemFilter from '../components/SystemFilter.vue';
import { devicesApi } from '../services/api';

export default {
  components: {
    DeviceList,
    DeviceForm,
    SystemFilter
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    
    // State management
    const filters = ref({
      search: '',
      systemId: null,
      status: null
    });
    
    const showAddDialog = ref(false);
    const showDeleteDialog = ref(false);
    const editMode = ref(false);
    const currentDevice = ref({});
    
    // Snackbar
    const showSnackbar = ref(false);
    const snackbarText = ref('');
    const snackbarColor = ref('success');
    
    // Computed for filter indicator
    const activeFilters = computed(() => {
      return filters.value.status || filters.value.search;
    });
    
    // Initialize filters from route query parameters
    const initFiltersFromRoute = () => {
      if (route.query.system_id) {
        filters.value.systemId = route.query.system_id;
      }
      
      if (route.query.status) {
        filters.value.status = route.query.status;
      }
      
      if (route.query.search) {
        filters.value.search = route.query.search;
      }
    };
    
    // Update URL with filter parameters
    const updateRouteWithFilters = () => {
      const query = { ...route.query };
      
      if (filters.value.systemId) {
        query.system_id = filters.value.systemId;
      } else {
        delete query.system_id;
      }
      
      if (filters.value.status) {
        query.status = filters.value.status;
      } else {
        delete query.status;
      }
      
      if (filters.value.search) {
        query.search = filters.value.search;
      } else {
        delete query.search;
      }
      
      router.replace({ query });
    };
    
    // Filter handlers
    const updateSystemFilter = (systemId) => {
      filters.value.systemId = systemId;
      updateRouteWithFilters();
    };
    
    // Device operation handlers
    const editDevice = (device) => {
      currentDevice.value = { ...device };
      editMode.value = true;
      showAddDialog.value = true;
    };
    
    const confirmDeleteDevice = (device) => {
      currentDevice.value = { ...device };
      showDeleteDialog.value = true;
    };
    
    const handleStatusUpdate = async (device) => {
      try {
        // Use the setToRepair method for inactive devices
        await devicesApi.setToRepair(device.id);
        showNotification(`${device.device_name} has been set to Repair mode`, 'success');
      } catch (error) {
        console.error('Error setting device to repair mode:', error);
        showNotification('Failed to set device to repair mode. Please try again.', 'error');
      }
    };
    
    const saveDevice = async (device) => {
      try {
        if (editMode.value) {
          await devicesApi.update(device.id, device);
          showNotification(`Device "${device.device_name}" has been updated`, 'success');
        } else {
          await devicesApi.create(device);
          showNotification(`Device "${device.device_name}" has been added`, 'success');
        }
        showAddDialog.value = false;
        editMode.value = false;
        
        // Reset form
        currentDevice.value = {};
      } catch (error) {
        console.error('Error saving device:', error);
        showNotification('Failed to save device. Please try again.', 'error');
      }
    };
    
    const deleteDevice = async () => {
      try {
        await devicesApi.delete(currentDevice.value.id);
        showDeleteDialog.value = false;
        showNotification(`Device "${currentDevice.value.device_name}" has been deleted`, 'info');
      } catch (error) {
        console.error('Error deleting device:', error);
        showNotification('Failed to delete device. Please try again.', 'error');
      }
    };
    
    const showNotification = (text, color = 'success') => {
      snackbarText.value = text;
      snackbarColor.value = color;
      showSnackbar.value = true;
    };
    
    // Watch for route changes to update filters
    watch(() => route.query, () => {
      initFiltersFromRoute();
    });
    
    // Initialize with route parameters
    onMounted(() => {
      initFiltersFromRoute();
    });
    
    return {
      filters,
      showAddDialog,
      showDeleteDialog,
      editMode,
      currentDevice,
      showSnackbar,
      snackbarText,
      snackbarColor,
      activeFilters,
      editDevice,
      confirmDeleteDevice,
      saveDevice,
      deleteDevice,
      updateSystemFilter,
      handleStatusUpdate
    };
  }
};
</script>

<style scoped>
/* Dark navy theme for devices page */
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

/* Add subtle glow to specific elements */
.v-icon[color="primary"] {
  filter: drop-shadow(0 0 8px rgba(30, 58, 138, 0.3));
}

.v-icon[color="success"] {
  filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.3));
}

.v-icon[color="error"] {
  filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.3));
}

.v-icon[color="warning"] {
  filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.3));
}

/* Heading styles with gradient text */
.text-h4 {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  background: linear-gradient(90deg, #f1f5f9, #e2e8f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
  font-weight: 700 !important;
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

/* Status chips with glowing effect */
.v-chip[color="success"] {
  background-color: rgba(16, 185, 129, 0.2) !important;
  color: #f1f5f9 !important;
  border: 1px solid rgba(16, 185, 129, 0.5) !important;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.2) !important;
}

.v-chip[color="error"] {
  background-color: rgba(239, 68, 68, 0.2) !important;
  color: #f1f5f9 !important;
  border: 1px solid rgba(239, 68, 68, 0.5) !important;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.2) !important;
}

.v-chip[color="warning"] {
  background-color: rgba(245, 158, 11, 0.2) !important;
  color: #f1f5f9 !important;
  border: 1px solid rgba(245, 158, 11, 0.5) !important;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.2) !important;
}

/* Form field styling */
.v-text-field {
  background: rgba(15, 23, 42, 0.4) !important;
  border-radius: 8px !important;
}

.v-text-field:hover {
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
}

.v-btn {
  transition: all 0.3s ease;
}

.v-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Animation for buttons */
.v-btn .v-icon {
  transition: transform 0.3s ease;
}

.v-btn:hover .v-icon {
  transform: rotate(10deg);
}

/* Table styling */
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

/* Responsive adjustments */
@media (max-width: 600px) {
  .d-flex.align-center {
    flex-direction: column;
    align-items: stretch !important;
  }
  
  .v-toolbar__title {
    font-size: 1.25rem;
  }
  
  h1.text-h4 {
    font-size: 1.5rem !important;
    margin-bottom: 1rem;
  }
  
  .v-btn {
    margin-top: 0.5rem;
    width: 100%;
  }
}
</style>
