<template>
  <div>
    <!-- Top Header Section -->
    <div class="d-flex align-center flex-wrap gap-4 mb-6">
      <v-icon size="36" color="primary">mdi-server-network</v-icon>
      <h1 class="text-h5 font-weight-bold text-white">IoT 시스템 현황</h1>
      <v-spacer></v-spacer>

      <!-- <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" label="Search systems" variant="filled"
        density="compact" class="mr-2" clearable style="max-width: 320px" /> -->

      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        class="font-weight-bold"
        elevation="2"
        @click="showAddDialog = true"
        style="text-transform: none"
      >
        Add System
      </v-btn>
    </div>

    <!-- System Detail or List View -->
    <div v-if="selectedSystemId">
      <system-detail-view :system-id="selectedSystemId" @back="selectedSystemId = null" />
    </div>
    <div v-else>
      <v-card elevation="3">
        <!-- <v-card-title class="d-flex align-center justify-space-between py-4 text-h6 font-weight-bold">
          Systems Overview
          <v-chip v-if="systemCount" color="primary" size="small" variant="elevated">
            {{ systemCount }} {{ systemCount === 1 ? 'system' : 'systems' }}
          </v-chip>
        </v-card-title> -->
        <v-divider></v-divider>

        <v-card-text class="pa-4">
          <v-row v-if="!loading && systemStatusData.length">
            <v-col v-for="system in filteredSystemStatus" :key="system.id" cols="12" sm="6" md="4">
              <system-card
                :system="system"
                @view="viewSystemDetails"
                @edit="editSystem"
                @delete="confirmDeleteSystem"
                @manage-devices="viewSystemDetails"
              />
            </v-col>
          </v-row>

          <!-- Loading -->
          <div v-else-if="loading" class="text-center py-12">
            <v-progress-circular indeterminate color="primary" size="64" />
            <p class="text-body-1 mt-4 text-white">Loading systems...</p>
          </div>

          <!-- Empty -->
          <div v-else class="text-center py-12">
            <v-icon size="48" color="grey">mdi-server-off</v-icon>
            <p class="text-h6 mt-3 font-weight-bold text-grey-lighten-1">No systems found</p>
            <p class="text-body-2 text-grey-lighten-1 mb-6">
              {{ search ? 'Try a different search term' : 'Add a system to get started' }}
            </p>
            <v-btn color="primary" prepend-icon="mdi-plus" @click="showAddDialog = true">
              Add System
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import SystemCard from '../components/SystemCard.vue'
import SystemDetailView from '../components/SystemDetailView.vue'
import { systemsApi } from '../services/api'

const route = useRoute()
const router = useRouter()

const systems = ref([])
const systemStatusData = ref([])
const loading = ref(true)
const refreshingStatus = ref(false)
const search = ref('')

const showAddDialog = ref(false)
const selectedSystemId = ref(null)

const filteredSystemStatus = computed(() => {
  if (!search.value) return systemStatusData.value
  const keyword = search.value.toLowerCase()
  return systemStatusData.value.filter(
    (sys) =>
      sys.name.toLowerCase().includes(keyword) ||
      (sys.description && sys.description.toLowerCase().includes(keyword)),
  )
})

const systemCount = computed(() => filteredSystemStatus.value.length)

const fetchSystemStatus = async () => {
  try {
    refreshingStatus.value = true
    const response = await systemsApi.getStatus()
    systemStatusData.value = response.data || []
  } catch (err) {
    console.error('Failed to load system status', err)
  } finally {
    refreshingStatus.value = false
  }
}

const fetchSystems = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/systems')
    systems.value = response.data || []
    await fetchSystemStatus()
  } catch (err) {
    console.error('Failed to load systems', err)
  } finally {
    loading.value = false
  }
}

const viewSystemDetails = (systemId) => {
  selectedSystemId.value = systemId
  router.replace({ query: { id: systemId } })
}

const editSystem = (system) => {
  console.log('Edit system', system)
}

const confirmDeleteSystem = (system) => {
  console.log('Confirm delete system', system)
}

onMounted(() => {
  fetchSystems()
  if (route.query.id) selectedSystemId.value = route.query.id
})

watch(
  () => route.query,
  () => {
    if (route.query.id) selectedSystemId.value = route.query.id
  },
)
</script>

<style scoped>
.text-white {
  color: #ffffff !important;
}

.gap-4 {
  gap: 1rem;
}

.text-grey-lighten-1 {
  color: #94a3b8 !important;
}

.text-h4 {
  font-size: 1.75rem;
  font-weight: 700;
}

.v-btn {
  transition: all 0.3s ease;
}

.v-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
</style>
