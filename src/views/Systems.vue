<template>
  <div>
    <!-- Top Header Section with Navigation -->
    <div class="d-flex align-center mb-6">
      <v-icon size="large" color="primary" class="mr-2">mdi-server-network</v-icon>
      <h1 class="text-h4 font-weight-bold">Systems Management</h1>
      <v-spacer></v-spacer>
      
      <!-- Search & Add Button -->
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="Search systems"
        density="compact"
        variant="outlined"
        hide-details
        style="max-width: 300px"
        class="mr-2"
        clearable
      ></v-text-field>
      
      <v-btn 
        color="primary" 
        prepend-icon="mdi-plus"
        class="ml-2" 
        @click="showAddDialog = true"
        elevation="1"
      >
        Add System
      </v-btn>
    </div>
    
    <!-- Main Content Section -->
    <div v-if="selectedSystemId">
      <!-- System Detail View -->
      <system-detail-view 
        :system-id="selectedSystemId" 
        @back="selectedSystemId = null"
      />
    </div>
    <div v-else>
      <!-- Systems List View -->
      <v-card elevation="3">
        <v-card-title class="d-flex align-center py-3">
          <v-icon color="primary" class="mr-2">mdi-view-list</v-icon>
          <span>Systems Overview</span>
          <v-chip 
            v-if="systemCount" 
            color="primary" 
            size="small" 
            class="ml-2"
            variant="outlined"
          >
            {{ systemCount }} {{ systemCount === 1 ? 'system' : 'systems' }}
          </v-chip>
          
          <v-spacer></v-spacer>
          
          <v-btn 
            v-if="!loading && systemStatusData.length > 0" 
            color="primary"
            variant="text"
            size="small"
            @click="refreshSystemStatus"
            :loading="refreshingStatus"
            class="me-2"
          >
            <v-icon start>mdi-refresh</v-icon>
            Refresh Status
          </v-btn>
        </v-card-title>
        <v-divider></v-divider>
        
        <!-- Grid of Enhanced System Cards -->
        <v-card-text class="pa-4">
          <v-row v-if="!loading && systemStatusData.length">
            <v-col
              v-for="system in filteredSystemStatus"
              :key="system.id"
              cols="12"
              sm="6"
              md="4"
            >
              <system-card 
                :system="system"
                @view="viewSystemDetails"
                @edit="editSystem"
                @delete="confirmDeleteSystem"
                @manage-devices="viewSystemDetails"
              />
            </v-col>
          </v-row>
          
          <!-- Loading State -->
          <div v-else-if="loading" class="text-center py-8">
            <v-progress-circular
              indeterminate
              color="primary"
              size="64"
            ></v-progress-circular>
            <p class="text-body-1 mt-4">Loading systems...</p>
          </div>
          
          <!-- Empty State -->
          <div v-else class="text-center py-8">
            <v-icon size="large" color="grey">mdi-server-off</v-icon>
            <p class="text-h6 mt-2">No systems found</p>
            <p class="text-body-2 mb-4">{{ search ? 'Try a different search term' : 'Add a system to get started' }}</p>
            <v-btn color="primary" prepend-icon="mdi-plus" @click="showAddDialog = true">
              Add System
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </div>
    
    <!-- Add/Edit System Dialog -->
    <v-dialog v-model="showAddDialog" max-width="600" persistent scrollable>
      <v-card>
        <v-toolbar color="primary" density="compact">
          <v-toolbar-title>
            {{ editMode ? 'Edit System' : 'Add New System' }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="showAddDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-card-text class="pt-4">
          <system-form 
            :system="currentSystem" 
            @save="saveSystem"
            @cancel="showAddDialog = false"
          ></system-form>
        </v-card-text>
      </v-card>
    </v-dialog>
    
    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-h5">
          <v-icon color="error" class="mr-2">mdi-alert-circle</v-icon>
          Confirm Delete
        </v-card-title>
        <v-card-text>
          <p>Are you sure you want to delete <strong>{{ currentSystem.name }}</strong>?</p>
          <p class="mt-2 text-caption"><v-icon size="small" color="warning" class="mr-1">mdi-information</v-icon> This will only succeed if no devices are associated with this system.</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="showDeleteDialog = false">
            Cancel
          </v-btn>
          <v-btn color="error" variant="flat" @click="deleteSystem">
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
import axios from 'axios';
import SystemForm from '../components/SystemForm.vue';
import SystemDetailView from '../components/SystemDetailView.vue';
import SystemCard from '../components/SystemCard.vue';
import { systemsApi } from '../services/api';

export default {
  components: {
    SystemForm,
    SystemDetailView,
    SystemCard
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    
    // Data sources
    const systems = ref([]);
    const deviceCountBySystem = ref({});
    const systemStatusData = ref([]);
    const loading = ref(true);
    const refreshingStatus = ref(false);
    const search = ref('');
    
    // UI state
    const showAddDialog = ref(false);
    const showDeleteDialog = ref(false);
    const editMode = ref(false);
    const currentSystem = ref({});
    const selectedSystemId = ref(null);
    
    // Snackbar
    const showSnackbar = ref(false);
    const snackbarText = ref('');
    const snackbarColor = ref('success');
    
    // Computed properties
    const filteredSystems = computed(() => {
      if (!search.value) return systems.value;
      
      const searchTerm = search.value.toLowerCase();
      return systems.value.filter(system => 
        system.name.toLowerCase().includes(searchTerm) || 
        (system.description && system.description.toLowerCase().includes(searchTerm))
      );
    });
    
    const systemCount = computed(() => {
      return filteredSystems.value.length;
    });
    
    // Filter system status data based on search term
    const filteredSystemStatus = computed(() => {
      if (!search.value) return systemStatusData.value;
      
      const searchTerm = search.value.toLowerCase();
      return systemStatusData.value.filter(system => 
        system.name.toLowerCase().includes(searchTerm) || 
        (system.description && system.description.toLowerCase().includes(searchTerm))
      );
    });
    
    // Methods
    const fetchSystemStatus = async () => {
      try {
        refreshingStatus.value = true;
        const response = await systemsApi.getStatus();
        
        if (response && Array.isArray(response.data) && response.data.length > 0) {
          systemStatusData.value = response.data;
        } else {
          console.warn('Invalid or empty system status data received');
        }
      } catch (error) {
        console.error('Error fetching system status:', error);
        showNotification('Failed to load system statuses', 'error');
      } finally {
        refreshingStatus.value = false;
      }
    };
    
    const refreshSystemStatus = () => {
      fetchSystemStatus();
      showNotification('System status refreshed', 'info');
    };
    
    const fetchSystems = async () => {
      try {
        loading.value = true;
        const response = await axios.get('/api/systems');
        systems.value = response.data;
        await Promise.all([
          fetchDeviceCounts(),
          fetchSystemStatus()
        ]);
      } catch (error) {
        console.error('Error fetching systems:', error);
        showNotification('Failed to load systems', 'error');
      } finally {
        loading.value = false;
      }
    };
    
    const fetchDeviceCounts = async () => {
      try {
        const response = await axios.get('/api/systems/device-counts');
        deviceCountBySystem.value = response.data || {};
      } catch (error) {
        console.error('Error fetching device counts:', error);
      }
    };
    
    const getDeviceCount = (systemId) => {
      return deviceCountBySystem.value[systemId] || 0;
    };
    
    const viewSystemDetails = (systemId) => {
      selectedSystemId.value = systemId;
      // Update the URL to reflect the selected system
      router.replace({ query: { id: systemId } });
    };
    
    const editSystem = (system) => {
      currentSystem.value = { ...system };
      editMode.value = true;
      showAddDialog.value = true;
    };
    
    const confirmDeleteSystem = (system) => {
      currentSystem.value = { ...system };
      showDeleteDialog.value = true;
    };
    
    const saveSystem = async (system) => {
      try {
        if (editMode.value) {
          await axios.put(`/api/systems/${system.id}`, system);
          showNotification(`System "${system.name}" has been updated`, 'success');
        } else {
          await axios.post('/api/systems', system);
          showNotification(`System "${system.name}" has been added`, 'success');
        }
        await fetchSystems();
        showAddDialog.value = false;
        editMode.value = false;
        
        // Reset form
        currentSystem.value = {};
      } catch (error) {
        console.error('Error saving system:', error);
        showNotification('Failed to save system. Please try again.', 'error');
      }
    };
    
    const deleteSystem = async () => {
      try {
        await axios.delete(`/api/systems/${currentSystem.value.id}`);
        showNotification(`System "${currentSystem.value.name}" has been deleted`, 'info');
        
        // If we're currently viewing the deleted system, go back to the list view
        if (selectedSystemId.value === currentSystem.value.id) {
          selectedSystemId.value = null;
          router.replace({ query: {} });
        }
        
        await fetchSystems();
        showDeleteDialog.value = false;
      } catch (error) {
        console.error('Error deleting system:', error);
        showNotification('Failed to delete system. This might be because there are devices still using this system.', 'error');
      }
    };
    
    const showNotification = (text, color = 'success') => {
      snackbarText.value = text;
      snackbarColor.value = color;
      showSnackbar.value = true;
    };
    
    // Initialize from route query parameters
    const initFromRoute = () => {
      if (route.query.id) {
        selectedSystemId.value = route.query.id;
      }
    };
    
    // Watch for changes in the route
    watch(() => route.query, () => {
      initFromRoute();
    });
    
    // Initialize data
    onMounted(() => {
      fetchSystems();
      initFromRoute();
    });
    
    return {
      // Data
      systems,
      filteredSystems,
      systemStatusData,
      filteredSystemStatus,
      systemCount,
      loading,
      refreshingStatus,
      search,
      
      // UI state
      showAddDialog,
      showDeleteDialog,
      editMode,
      currentSystem,
      selectedSystemId,
      showSnackbar,
      snackbarText,
      snackbarColor,
      
      // Methods
      getDeviceCount,
      viewSystemDetails,
      editSystem,
      confirmDeleteSystem,
      saveSystem,
      deleteSystem,
      refreshSystemStatus
    };
  }
};
</script>

<style scoped>
/* Dark navy theme styling for systems page */
.system-card {
  background: linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.8)) !important;
  border: 1px solid var(--border-color) !important;
  backdrop-filter: blur(10px);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  height: 100%;
}

.system-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.4) !important;
  border: 1px solid var(--primary-color) !important;
}

/* Add glow effect to cards on hover */
.system-card:hover::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  border-radius: 3px 3px 0 0;
}

/* Card title and content styling */
.v-card-title {
  background: linear-gradient(90deg, #f1f5f9, #e2e8f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
  font-weight: 700 !important;
}

.v-card-text {
  color: rgba(241, 245, 249, 0.8) !important;
}

/* Subtitle with subtle gradient */
.text-subtitle-1 {
  background: linear-gradient(90deg, #cbd5e1, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
}

/* Page heading */
.text-h4 {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  background: linear-gradient(90deg, #f1f5f9, #e2e8f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
  font-weight: 700 !important;
}

/* Active system counts */
.active-count {
  color: var(--active-color) !important;
  text-shadow: 0 0 8px rgba(16, 185, 129, 0.3);
}

/* Form field styling */
.v-text-field {
  background: rgba(15, 23, 42, 0.4) !important;
  border-radius: 8px !important;
}

.v-text-field:hover {
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
}

/* Button styling */
.v-btn {
  transition: all 0.3s ease;
}

.v-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Animation for icons */
.v-icon {
  transition: all 0.3s ease;
}

.system-card:hover .v-icon {
  transform: scale(1.1);
  filter: drop-shadow(0 0 8px rgba(30, 58, 138, 0.4));
}

/* Dialog styling */
.v-dialog .v-card {
  background: linear-gradient(145deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.9)) !important;
  border: 1px solid var(--border-color) !important;
  backdrop-filter: blur(15px);
}

/* Empty state styling */
.empty-state {
  background: rgba(15, 23, 42, 0.4) !important;
  border: 1px dashed rgba(148, 163, 184, 0.3) !important;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.empty-state:hover {
  background: rgba(30, 41, 59, 0.6) !important;
  border-color: rgba(148, 163, 184, 0.5) !important;
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
    margin-left: 0 !important;
  }
}
</style>
