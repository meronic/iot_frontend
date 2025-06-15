<template>
  <v-select
    v-model="selectedSystem"
    :items="systems"
    item-title="name"
    item-value="id"
    label="Filter by System"
    clearable
    hide-details
    density="compact"
    variant="outlined"
    style="min-width: 200px"
    color="primary"
    bg-color="#1a2234"
    :menu-props="{
      maxHeight: 300,
      contentClass: 'system-filter-menu',
      transition: 'slide-y-transition',
      closeOnClick: true,
      closeOnContentClick: true,
    }"
    @update:model-value="updateSystem"
  >
    <template #prepend-item>
      <v-list-item @click="clearSelection" class="system-filter-list-item">
        <template #title>
          <span>All Systems</span>
        </template>
      </v-list-item>
      <v-divider class="mt-2"></v-divider>
    </template>
  </v-select>
</template>

<script>
import { ref, onMounted } from 'vue'
import axios from 'axios'

export default {
  emits: ['update:system'],
  setup(props, { emit }) {
    const systems = ref([])
    const selectedSystem = ref(null)

    const fetchSystems = async () => {
      try {
        const response = await axios.get('/api/systems')
        systems.value = response.data
      } catch (error) {
        console.error('Error fetching systems:', error)
      }
    }

    const updateSystem = () => {
      emit('update:system', selectedSystem.value)
    }

    const clearSelection = () => {
      selectedSystem.value = null
      updateSystem()
    }

    onMounted(fetchSystems)

    return {
      systems,
      selectedSystem,
      updateSystem,
      clearSelection,
    }
  },
}
</script>

<style>
/* 드롭다운 메뉴 스타일 */
.system-filter-menu {
  background-color: #0f172a !important;
  border: 1px solid #475569 !important;
  border-radius: 8px !important;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25) !important;
  z-index: 1000 !important;
  overflow: hidden !important;
}

.system-filter-menu .v-list {
  background-color: #0f172a !important;
  padding: 8px !important;
}

.system-filter-menu .v-list-item {
  border-radius: 4px !important;
  margin: 4px !important;
  color: #f1f5f9 !important;
}

.system-filter-menu .v-list-item:hover {
  background-color: #1e40af !important;
}

.system-filter-menu .v-list-item--active {
  background-color: #2563eb !important;
  color: #ffffff !important;
}
</style>

<style scoped>
:deep(.v-field__append-inner) {
  color: #cbd5e1 !important;
}

:deep(.v-field__outline) {
  opacity: 1 !important;
  border-color: #475569 !important;
}

:deep(.v-select__selection) {
  color: #f1f5f9 !important;
}

:deep(.v-field__input) {
  color: #f1f5f9 !important;
}

:deep(.v-field) {
  background-color: #1a2234 !important;
}
</style>
