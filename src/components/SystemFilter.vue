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
    bg-color="surface"
    :menu-props="{
      maxHeight: 300,
      contentClass: 'system-filter-menu',
      transition: 'slide-y-transition',
      closeOnClick: true,
      closeOnContentClick: true,
    }"
    @update:modelValue="updateSystem"
  >
    <template v-slot:prepend-item>
      <v-list-item @click="clearSelection" class="system-filter-list-item">
        <v-list-item-title>All Systems</v-list-item-title>
      </v-list-item>
      <v-divider class="mt-2"></v-divider>
    </template>
  </v-select>
</template>

<script>
import { ref, onMounted } from 'vue';
import axios from 'axios';

export default {
  emits: ['update:system'],
  setup(props, { emit }) {
    const systems = ref([]);
    const selectedSystem = ref(null);
    
    const fetchSystems = async () => {
      try {
        const response = await axios.get('/api/systems');
        systems.value = response.data;
      } catch (error) {
        console.error('Error fetching systems:', error);
      }
    };
    
    const updateSystem = () => {
      emit('update:system', selectedSystem.value);
    };
    
    const clearSelection = () => {
      selectedSystem.value = null;
      updateSystem();
    };
    
    onMounted(fetchSystems);
    
    return {
      systems,
      selectedSystem,
      updateSystem,
      clearSelection
    };
  }
};
</script>

<style scoped>
.system-filter-menu {
  background-color: var(--bg-secondary, #1e293b) !important;
  border: 1px solid var(--border-color, rgba(148, 163, 184, 0.15)) !important;
  border-radius: 8px !important;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25) !important;
  z-index: 1000 !important;
  color: var(--text-primary, #f1f5f9) !important;
  overflow: hidden !important;
}

/* Apply styles to all list items in the dropdown */
:deep(.v-list-item) {
  border-radius: 4px !important;
  margin: 4px !important;
  color: var(--text-primary, #f1f5f9) !important;
}

:deep(.v-list-item:hover) {
  background-color: rgba(59, 130, 246, 0.1) !important;
}

:deep(.v-list-item--active) {
  background-color: rgba(59, 130, 246, 0.2) !important;
  color: var(--primary-color, #3b82f6) !important;
}

:deep(.v-list) {
  background-color: var(--bg-secondary, #1e293b) !important;
  padding: 8px !important;
}

:deep(.v-field__append-inner) {
  color: var(--text-secondary, #cbd5e1) !important;
}

:deep(.v-field__outline) {
  opacity: 0.8 !important;
}

:deep(.v-select__selection) {
  color: var(--text-primary, #f1f5f9) !important;
}
</style>
