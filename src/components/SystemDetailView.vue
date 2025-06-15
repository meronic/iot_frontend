<template>
  <div>
    <!-- Back Navigation -->
    <div class="d-flex align-center mb-4">
      <v-btn color="primary" variant="text" size="small" @click="goBack" class="mr-2">
        <v-icon start>mdi-arrow-left</v-icon>
        Back to Systems
      </v-btn>
      <v-divider vertical class="mx-2"></v-divider>
      <span class="text-caption text-disabled">System Details</span>
    </div>

    <!-- System Header Card -->
    <v-card elevation="3" class="mb-6">
      <v-skeleton-loader
        v-if="loading"
        type="card-heading, list-item-three-line"
      ></v-skeleton-loader>

      <template v-else>
        <v-card-item>
          <template v-slot:prepend>
            <v-avatar color="primary" size="large" rounded>
              <v-icon size="large">mdi-server</v-icon>
            </v-avatar>
          </template>
          <v-card-title class="text-h4 font-weight-bold">{{ system.name }}</v-card-title>
          <v-card-subtitle>{{ system.description || 'No description available' }}</v-card-subtitle>

          <template v-slot:append>
            <v-btn color="primary" variant="outlined" @click="editSystem" class="mr-2">
              <v-icon start>mdi-pencil</v-icon>
              Edit System
            </v-btn>
          </template>
        </v-card-item>

        <v-divider></v-divider>

        <v-card-text>
          <v-row>
            <v-col cols="12" sm="6" lg="3">
              <v-card flat outlined class="system-stat-card">
                <v-card-text class="d-flex flex-column align-center justify-center text-center">
                  <v-icon color="primary" size="x-large" class="mb-2">mdi-devices</v-icon>
                  <div class="text-h3 font-weight-bold">{{ summary.total || 0 }}</div>
                  <div class="text-caption text-uppercase">전체 단말기 대수 :</div>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" sm="6" lg="3">
              <v-card flat outlined class="system-stat-card">
                <v-card-text class="d-flex flex-column align-center justify-center text-center">
                  <v-icon color="success" size="x-large" class="mb-2">mdi-check-circle</v-icon>
                  <div class="text-h3 font-weight-bold">{{ summary.active || 0 }}</div>
                  <div class="text-caption text-uppercase">Active Devices</div>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" sm="6" lg="3">
              <v-card flat outlined class="system-stat-card">
                <v-card-text class="d-flex flex-column align-center justify-center text-center">
                  <v-icon color="error" size="x-large" class="mb-2">mdi-alert-circle</v-icon>
                  <div class="text-h3 font-weight-bold">{{ summary.inactive || 0 }}</div>
                  <div class="text-caption text-uppercase">Inactive Devices</div>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" sm="6" lg="3">
              <v-card flat outlined class="system-stat-card">
                <v-card-text class="d-flex flex-column align-center justify-center text-center">
                  <v-icon color="warning" size="x-large" class="mb-2">mdi-wrench</v-icon>
                  <div class="text-h3 font-weight-bold">{{ summary.under_repair || 0 }}</div>
                  <div class="text-caption text-uppercase">Under Repair</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </template>
    </v-card>

    <!-- Device List Section -->
    <v-card elevation="3">
      <v-card-title class="d-flex align-center py-3">
        <v-icon color="primary" class="mr-2">mdi-view-list</v-icon>
        <span>System Devices</span>
        <v-chip
          v-if="!loading && devices.length"
          color="primary"
          size="small"
          class="ml-2"
          variant="outlined"
        >
          {{ devices.length }} {{ devices.length === 1 ? 'device' : 'devices' }}
        </v-chip>
        <v-spacer></v-spacer>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="addDeviceToSystem" size="small">
          Add Device
        </v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <!-- Filtering Controls -->
      <v-card-text class="device-filter-bar pa-4">
        <v-row>
          <v-col cols="12" sm="4" md="3">
            <v-select
              v-model="filters.status"
              :items="statusOptions"
              label="Status"
              density="compact"
              variant="outlined"
              clearable
              hide-details
              @update:model-value="filterDevices"
            ></v-select>
          </v-col>

          <v-col cols="12" sm="4" md="3">
            <v-select
              v-model="filters.type"
              :items="deviceTypeOptions"
              label="Device Type"
              density="compact"
              variant="outlined"
              clearable
              hide-details
              @update:model-value="filterDevices"
            ></v-select>
          </v-col>

          <v-col cols="12" sm="4" md="3">
            <v-text-field
              v-model="filters.search"
              prepend-inner-icon="mdi-magnify"
              label="Search devices"
              density="compact"
              variant="outlined"
              clearable
              hide-details
              @update:model-value="filterDevices"
            ></v-text-field>
          </v-col>

          <v-col cols="12" sm="12" md="3" class="d-flex align-center">
            <v-btn color="primary" variant="text" size="small" @click="resetFilters" class="mr-2">
              <v-icon start>mdi-filter-remove</v-icon>
              Reset Filters
            </v-btn>
            <v-btn
              color="primary"
              variant="text"
              size="small"
              @click="refreshData"
              :loading="loading"
            >
              <v-icon start>mdi-refresh</v-icon>
              Refresh
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider></v-divider>

      <!-- Device List Table -->
      <device-list
        :filters="{ systemId: systemId, ...filters }"
        @edit="editDevice"
        @delete="deleteDevice"
        @status-updated="refreshData"
      ></device-list>

      <v-card-actions v-if="!loading && !devices.length" class="justify-center pa-6">
        <div class="text-center">
          <v-icon size="large" color="grey">mdi-devices-off</v-icon>
          <p class="mt-2">No devices found in this system</p>
          <v-btn color="primary" variant="outlined" class="mt-2" @click="addDeviceToSystem">
            <v-icon start>mdi-plus</v-icon>
            Add Device
          </v-btn>
        </div>
      </v-card-actions>
    </v-card>

    <!-- Edit System Dialog -->
    <v-dialog v-model="showEditDialog" max-width="600" persistent>
      <v-card>
        <v-toolbar color="primary" density="compact">
          <v-toolbar-title>Edit System</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="showEditDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-card-text class="pt-4">
          <system-form
            :system="system"
            @save="saveSystem"
            @cancel="showEditDialog = false"
          ></system-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Add Device Dialog -->
    <v-dialog v-model="showAddDeviceDialog" max-width="600" persistent>
      <v-card>
        <v-toolbar color="primary" density="compact">
          <v-toolbar-title>Add Device to {{ system.name }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="showAddDeviceDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-card-text class="pt-4">
          <device-form
            :device="{ system_id: systemId }"
            @save="saveDevice"
            @cancel="showAddDeviceDialog = false"
          ></device-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Success Snackbar -->
    <v-snackbar v-model="showSnackbar" :color="snackbarColor" :timeout="3000" location="top">
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn variant="text" @click="showSnackbar = false"> Close </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import DeviceList from './DeviceList.vue'
import SystemForm from './SystemForm.vue'
import DeviceForm from './DeviceForm.vue'

export default {
  components: {
    DeviceList,
    SystemForm,
    DeviceForm,
  },
  props: {
    systemId: {
      type: String,
      required: true,
    },
  },
  emits: ['back'],
  setup(props, { emit }) {
    const router = useRouter()

    // Data sources
    const system = ref({})
    const devices = ref([])
    const summary = ref({
      total: 0,
      active: 0,
      inactive: 0,
      under_repair: 0,
    })
    const loading = ref(true)

    // UI state
    const showEditDialog = ref(false)
    const showAddDeviceDialog = ref(false)
    const filters = ref({
      search: '',
      status: null,
      type: null,
    })

    // Filter options
    const statusOptions = [
      { title: 'Active', value: 'active' },
      { title: 'Inactive', value: 'inactive' },
      { title: 'Under Repair', value: 'under_repair' },
    ]

    const deviceTypeOptions = [
      { title: 'IP Devices', value: 'ip' },
      { title: 'LoRa Devices', value: 'lora' },
    ]

    // Snackbar
    const showSnackbar = ref(false)
    const snackbarText = ref('')
    const snackbarColor = ref('success')

    // Methods
    const fetchSystemData = async () => {
      if (!props.systemId) return

      try {
        loading.value = true
        const response = await axios.get(`/api/systems/${props.systemId}`)
        system.value = response.data
      } catch (error) {
        console.error('Error fetching system:', error)
        showNotification('Failed to load system details', 'error')
      }
    }

    const fetchDevices = async () => {
      if (!props.systemId) return

      try {
        const response = await axios.get(`/api/devices?system_id=${props.systemId}`)
        devices.value = response.data

        // Calculate summary
        const total = devices.value.length
        const active = devices.value.filter((d) => d.status === 'active').length
        const inactive = devices.value.filter((d) => d.status === 'inactive').length
        const under_repair = devices.value.filter((d) => d.status === 'under_repair').length

        summary.value = {
          total,
          active,
          inactive,
          under_repair,
        }
      } catch (error) {
        console.error('Error fetching devices:', error)
      } finally {
        loading.value = false
      }
    }

    const refreshData = async () => {
      loading.value = true
      await Promise.all([fetchSystemData(), fetchDevices()])
    }

    const filterDevices = () => {
      // Filtering is handled by the DeviceList component
    }

    const resetFilters = () => {
      filters.value = {
        search: '',
        status: null,
        type: null,
      }
    }

    const goBack = () => {
      emit('back')
      router.replace({ path: '/systems' }) // Remove query parameters
    }

    const editSystem = () => {
      showEditDialog.value = true
    }

    const saveSystem = async (updatedSystem) => {
      try {
        await axios.put(`/api/systems/${props.systemId}`, updatedSystem)
        system.value = { ...updatedSystem }
        showEditDialog.value = false
        showNotification('System updated successfully', 'success')
      } catch (error) {
        console.error('Error updating system:', error)
        showNotification('Failed to update system', 'error')
      }
    }

    const addDeviceToSystem = () => {
      showAddDeviceDialog.value = true
    }

    const saveDevice = async (device) => {
      try {
        await axios.post('/api/devices', device)
        showAddDeviceDialog.value = false
        showNotification('Device added successfully', 'success')
        await fetchDevices()
      } catch (error) {
        console.error('Error adding device:', error)
        showNotification('Failed to add device', 'error')
      }
    }

    const editDevice = (device) => {
      // Navigate to device edit page or open edit dialog
      router.push({
        path: '/devices',
        query: { edit: device.id },
      })
    }

    const deleteDevice = () => {
      // Simply refresh data when device is deleted
      setTimeout(fetchDevices, 500)
    }

    const showNotification = (text, color = 'success') => {
      snackbarText.value = text
      snackbarColor.value = color
      showSnackbar.value = true
    }

    // Watch for changes in systemId prop
    watch(
      () => props.systemId,
      () => {
        refreshData()
      },
    )

    // Initialize data
    onMounted(() => {
      refreshData()
    })

    return {
      system,
      devices,
      summary,
      loading,
      filters,
      statusOptions,
      deviceTypeOptions,
      showEditDialog,
      showAddDeviceDialog,
      showSnackbar,
      snackbarText,
      snackbarColor,
      goBack,
      refreshData,
      filterDevices,
      resetFilters,
      editSystem,
      saveSystem,
      addDeviceToSystem,
      saveDevice,
      editDevice,
      deleteDevice,
    }
  },
}
</script>

<style scoped>
.system-stat-card {
  border-color: rgba(255, 255, 255, 0.12) !important;
  background-color: transparent !important;
  height: 100%;
}

.device-filter-bar {
  background-color: rgba(30, 58, 138, 0.05);
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .v-btn {
    margin-top: 0.5rem;
  }
}
</style>
