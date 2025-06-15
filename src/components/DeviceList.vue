<template>
  <div>
    <!-- Filter Controls -->
    <div v-if="showFilters" class="device-filter-bar">
      <div class="d-flex flex-wrap align-center gap-4">
        <!-- 시스템 필터 -->
        <v-select
          v-model="localFilters.systemId"
          :items="systems"
          item-title="name"
          item-value="id"
          label="시스템 명"
          clearable
          hide-details
          density="compact"
          variant="outlined"
          class="filter-select"
          color="primary"
          bg-color="#1a2234"
          :menu-props="{ contentClass: 'custom-select-menu' }"
          @update:model-value="applyFilters"
          return-object
        >
          <template v-slot:prepend-item>
            <v-list-item @click="clearSystemFilter" class="filter-all-item">
              <v-list-item-title>All Systems</v-list-item-title>
            </v-list-item>
            <v-divider class="mt-2"></v-divider>
          </template>
        </v-select>

        <!-- 상태 필터 -->
        <v-select
          v-model="localFilters.status"
          :items="statusOptions"
          item-title="title"
          item-value="value"
          label="상태"
          density="compact"
          variant="outlined"
          class="filter-select"
          clearable
          hide-details
          color="primary"
          bg-color="#1a2234"
          :menu-props="{ contentClass: 'custom-select-menu' }"
          @update:model-value="applyFilters"
        >
          <template v-slot:prepend-item>
            <v-list-item @click="clearStatusFilter" class="filter-all-item">
              <v-list-item-title>All Statuses</v-list-item-title>
            </v-list-item>
            <v-divider class="mt-2"></v-divider>
          </template>
        </v-select>

        <!-- 디바이스 타입 필터 -->
        <v-select
          v-model="localFilters.deviceType"
          :items="deviceTypeOptions"
          item-title="title"
          item-value="value"
          label="통신 타입"
          density="compact"
          variant="outlined"
          class="filter-select"
          clearable
          hide-details
          color="primary"
          bg-color="#1a2234"
          :menu-props="{ contentClass: 'custom-select-menu' }"
          @update:model-value="applyFilters"
        >
          <template v-slot:prepend-item>
            <v-list-item @click="clearDeviceTypeFilter" class="filter-all-item">
              <v-list-item-title>All Device Types</v-list-item-title>
            </v-list-item>
            <v-divider class="mt-2"></v-divider>
          </template>
        </v-select>

        <!-- 검색 및 리셋 버튼 -->
        <div class="d-flex align-center search-container">
          <v-text-field
            v-model="localFilters.search"
            prepend-inner-icon="mdi-magnify"
            label="Search devices"
            density="compact"
            variant="outlined"
            hide-details
            class="search-field"
            @update:model-value="applyFilters"
            clearable
            color="primary"
            bg-color="#1a2234"
          ></v-text-field>

          <v-btn
            color="primary"
            variant="text"
            @click="resetFilters"
            class="reset-button ml-4"
            height="40"
          >
            <v-icon start>mdi-filter-remove</v-icon>
            Reset
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <v-data-table
      :headers="headers"
      :items="filteredDevices"
      :loading="loading"
      :items-per-page="limit || 10"
    >
      <template v-slot:item.status="{ item }">
        <div class="d-flex align-center">
          <v-chip :color="getStatusColor(item.status)" text-color="white" size="small">
            {{ formatStatus(item.status) }}
          </v-chip>
        </div>
      </template>

      <template v-slot:item.is_lora="{ item }">
        <div class="d-flex align-center">
          <v-icon v-if="item.is_lora" color="purple" size="large">mdi-access-point</v-icon>
          <v-icon v-else color="blue" size="large">mdi-lan</v-icon>
          <span class="ml-1">{{ item.is_lora ? 'LoRa' : 'IP' }}</span>
        </div>
      </template>

      <template v-slot:item.last_active_at="{ item }">
        <div class="d-flex align-center">
          {{ formatDate(item.last_active_at) }}
        </div>
      </template>

      <!-- 경과일 표시 -->
      <template v-slot:item.days_elapsed="{ item }">
        <div class="d-flex align-center">
          <v-chip
            :color="getDaysElapsedColor(item.last_active_at)"
            text-color="white"
            size="small"
            variant="elevated"
          >
            {{ getDaysElapsed(item.last_active_at) }}
          </v-chip>
        </div>
      </template>

      <template v-slot:item.actions="{ item }">
        <div class="d-flex justify-end">
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn icon variant="text" size="small" v-bind="props">
                <v-icon size="small">mdi-dots-vertical</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item @click="editItem(item)">
                <v-list-item-title class="d-flex align-center">
                  <v-icon size="small" class="mr-2">mdi-pencil</v-icon>
                  <span>단말기 수정</span>
                </v-list-item-title>
              </v-list-item>

              <v-list-item v-if="item.status === 'inactive'" @click="setToRepair(item)">
                <v-list-item-title class="d-flex align-center">
                  <v-icon size="small" color="warning" class="mr-2">mdi-wrench</v-icon>
                  <span>수리 중 변경</span>
                </v-list-item-title>
              </v-list-item>

              <v-list-item @click="deleteItem(item)">
                <v-list-item-title class="d-flex align-center">
                  <v-icon size="small" color="error" class="mr-2">mdi-delete</v-icon>
                  <span>삭제</span>
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </template>

      <template v-slot:no-data>
        <div class="text-center py-4">
          <v-icon size="large" color="grey">mdi-devices-off</v-icon>
          <p class="mt-2">No devices found</p>
        </div>
      </template>
    </v-data-table>

    <!-- 수리 상태 변경 다이얼로그 -->
    <v-dialog v-model="showRepairDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h5"> 단말기 상태 변경 </v-card-title>
        <v-card-text>
          <p>
            <strong>{{ selectedDevice?.device_name }}</strong> 단말기를 수리 중 으로 변경할까요?
          </p>
          <br />
          <p class="mt-2">- inactive 상태 Repair로 변경</p>
          <p class="mt-2">- 수리 내역에 데이터가 추가 됩니다.</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="showRepairDialog = false">
            취소
          </v-btn>
          <v-btn color="warning" variant="elevated" @click="confirmSetToRepair"> 변경 </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, nextTick, onBeforeUnmount } from 'vue'
import axios from 'axios'

export default {
  props: {
    filters: {
      type: Object,
      default: () => ({ search: '', systemId: null, status: null }),
    },
    limit: Number,
    showFilters: Boolean,
  },
  emits: ['edit', 'delete', 'status-updated'],
  setup(props, { emit }) {
    const devices = ref([])
    const systems = ref([])
    const loading = ref(true)
    const showRepairDialog = ref(false)
    const selectedDevice = ref(null)

    const localFilters = ref({
      search: props.filters.search || '',
      systemId: props.filters.systemId || null,
      status: props.filters.status || null,
      deviceType: null,
    })

    const statusOptions = [
      { title: '정상', value: 'active' },
      { title: '비정상', value: 'inactive' },
      { title: '수리 중', value: 'under_repair' },
    ]

    const deviceTypeOptions = [
      { title: 'IP Devices', value: 'ip' },
      { title: 'LoRa Devices', value: 'lora' },
    ]

    const headers = [
      { title: '단말기 명', key: 'device_name', width: '15%' },
      { title: '장비 명', key: 'facility_name', width: '15%' },
      { title: '시스템', key: 'system_name', width: '15%' },
      { title: 'IP Address', key: 'ip_address', width: '10%' },
      { title: '통신', key: 'is_lora', width: '10%' },
      { title: '상태', key: 'status', width: '10%' },
      { title: '마지막 데이터 시간', key: 'last_active_at', width: '12%' },
      { title: '경과일', key: 'days_elapsed', width: '7%' },
      { title: '비고', key: 'actions', sortable: false, width: '6%' },
    ]

    const filteredDevices = computed(() => {
      let result = [...devices.value]

      if (localFilters.value.systemId) {
        const systemId =
          typeof localFilters.value.systemId === 'object'
            ? localFilters.value.systemId.id
            : localFilters.value.systemId
        result = result.filter((d) => d.system_id === String(systemId))
      }

      if (localFilters.value.status) {
        result = result.filter((d) => d.status === localFilters.value.status)
      }

      if (localFilters.value.deviceType === 'lora') {
        result = result.filter((d) => d.is_lora === true)
      } else if (localFilters.value.deviceType === 'ip') {
        result = result.filter((d) => d.is_lora === false)
      }

      if (localFilters.value.search) {
        const keyword = localFilters.value.search.toLowerCase()
        result = result.filter(
          (d) =>
            (d.device_name && d.device_name.toLowerCase().includes(keyword)) ||
            (d.facility_name && d.facility_name.toLowerCase().includes(keyword)) ||
            (d.system_name && d.system_name.toLowerCase().includes(keyword)),
        )
      }

      return result
    })

    const fetchSystems = async () => {
      try {
        const response = await axios.get('/api/systems')
        systems.value = response.data
      } catch (err) {
        console.error('시스템 정보 조회 오류:', err)
      }
    }

    const fetchDevices = async () => {
      try {
        loading.value = true
        const response = await axios.get('/api/devices')
        devices.value = response.data
      } catch (err) {
        console.error('디바이스 조회 오류:', err)
      } finally {
        loading.value = false
      }
    }

    const applyFilters = () => fetchDevices()
    const resetFilters = () => {
      localFilters.value = { search: '', systemId: null, status: null, deviceType: null }
      fetchDevices()
    }

    const formatStatus = (status) =>
      status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    const getStatusColor = (status) =>
      ({ active: 'success', inactive: 'error', under_repair: 'warning' })[status] || 'grey'

    // 날짜 포맷 함수 수정 - 1995년대 데이터 처리
    const formatDate = (dateString) => {
      if (!dateString) return '수집 데이터 없음'

      const date = new Date(dateString)
      const year = date.getFullYear()

      // 1995년대 (1990~1999) 데이터인 경우
      if (year >= 1990 && year <= 1999) {
        return '수집 데이터 없음'
      }

      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    // 경과일 계산 함수
    const getDaysElapsed = (dateString) => {
      if (!dateString) return '데이터 없음'

      const date = new Date(dateString)
      const year = date.getFullYear()

      // 1995년대 데이터인 경우
      if (year >= 1990 && year <= 1999) {
        return '데이터 없음'
      }

      const now = new Date()
      const diffTime = Math.abs(now - date)
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 0) {
        return '오늘'
      } else if (diffDays === 1) {
        return '1일 전'
      } else if (diffDays < 7) {
        return `${diffDays}일 전`
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7)
        return `${weeks}주 전`
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30)
        return `${months}개월 전`
      } else {
        const years = Math.floor(diffDays / 365)
        return `${years}년 전`
      }
    }

    // 경과일에 따른 색상 설정
    const getDaysElapsedColor = (dateString) => {
      if (!dateString) return 'grey'

      const date = new Date(dateString)
      const year = date.getFullYear()

      // 1995년대 데이터인 경우
      if (year >= 1990 && year <= 1999) {
        return 'grey'
      }

      const now = new Date()
      const diffTime = Math.abs(now - date)
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays <= 1) {
        return 'success' // 1일 이내 - 녹색
      } else if (diffDays <= 7) {
        return 'info' // 1주일 이내 - 파란색
      } else if (diffDays <= 30) {
        return 'warning' // 1달 이내 - 주황색
      } else {
        return 'error' // 1달 이상 - 빨간색
      }
    }

    const clearSystemFilter = () => {
      localFilters.value.systemId = null
      applyFilters()
    }
    const clearStatusFilter = () => {
      localFilters.value.status = null
      applyFilters()
    }
    const clearDeviceTypeFilter = () => {
      localFilters.value.deviceType = null
      applyFilters()
    }

    const editItem = (item) => emit('edit', item)
    const deleteItem = (item) => emit('delete', item)
    const setToRepair = (device) => {
      selectedDevice.value = device
      showRepairDialog.value = true
    }

    const confirmSetToRepair = async () => {
      try {
        loading.value = true
        await axios.put(`/api/devices/${selectedDevice.value.id}/status`, {
          status: 'under_repair',
        })

        const index = devices.value.findIndex((d) => d.id === selectedDevice.value.id)
        if (index !== -1) devices.value[index].status = 'under_repair'

        showRepairDialog.value = false
        emit('status-updated', { ...selectedDevice.value, status: 'under_repair' })
        fetchDevices()
      } catch (e) {
        console.error('상태 변경 실패:', e)
      } finally {
        loading.value = false
      }
    }

    watch(
      () => props.filters,
      async (newFilters) => {
        await nextTick()
        if (newFilters && typeof newFilters === 'object') {
          if ('systemId' in newFilters) localFilters.value.systemId = newFilters.systemId
          if ('status' in newFilters) localFilters.value.status = newFilters.status
          if ('search' in newFilters) localFilters.value.search = newFilters.search
        }
        fetchDevices()
      },
      { deep: true },
    )

    let autoRefreshInterval = null
    onMounted(() => {
      fetchSystems()
      fetchDevices()
      autoRefreshInterval = setInterval(fetchDevices, 60000)
    })
    onBeforeUnmount(() => {
      if (autoRefreshInterval) clearInterval(autoRefreshInterval)
    })

    return {
      devices,
      systems,
      filteredDevices,
      localFilters,
      headers,
      loading,
      statusOptions,
      deviceTypeOptions,
      showRepairDialog,
      selectedDevice,
      editItem,
      deleteItem,
      getStatusColor,
      formatStatus,
      formatDate,
      getDaysElapsed,
      getDaysElapsedColor,
      applyFilters,
      resetFilters,
      setToRepair,
      confirmSetToRepair,
      clearSystemFilter,
      clearStatusFilter,
      clearDeviceTypeFilter,
      fetchDevices,
    }
  },
}
</script>

<style scoped>
.device-filter-bar {
  padding: 12px 16px;
  background-color: var(--surface-color, #1e293b);
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filter-select {
  width: 180px;
  margin-bottom: 0 !important;
}

.search-container {
  flex-grow: 1;
  align-items: center;
}

.search-field {
  max-width: 400px;
}

.reset-button {
  height: 40px !important;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

/* 테이블 내부 스타일 일관성 */
:deep(.v-data-table .v-data-table__td) {
  height: 48px;
  padding: 0 16px;
}

/* 필드 스타일 */
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

/* Mobile responsiveness */
@media (max-width: 960px) {
  .device-filter-bar > .d-flex {
    gap: 16px;
  }

  .filter-select,
  .search-field {
    width: 100%;
    max-width: 100%;
  }

  .search-container {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .reset-button {
    margin-left: 0 !important;
    margin-top: 8px !important;
  }
}

@media (max-width: 600px) {
  .device-filter-bar > .d-flex {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>

<style>
/* 드롭다운 메뉴 공통 스타일 */
.custom-select-menu {
  background-color: #0f172a !important;
  border: 1px solid #475569 !important;
  border-radius: 8px !important;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5) !important;
}

.custom-select-menu .v-list {
  background-color: #0f172a !important;
  padding: 8px !important;
}

.custom-select-menu .v-list-item {
  border-radius: 4px !important;
  margin: 4px !important;
  color: #f1f5f9 !important;
  font-weight: 500 !important;
  min-height: 40px !important;
  transition: none !important;
  /* 트랜지션 제거 */
}

.custom-select-menu .v-list-item:hover {
  background-color: #1e293b !important;
  /* 더 미묘한 색상으로 변경 */
  transform: none !important;
  /* 변형 없음 */
}

.custom-select-menu .v-list-item--active {
  background-color: #2563eb !important;
  color: #ffffff !important;
  font-weight: 600 !important;
}

/* "All" 옵션 스타일 */
.filter-all-item {
  background-color: rgba(37, 99, 235, 0.1) !important;
  font-weight: 600 !important;
  transition: none !important;
  /* 트랜지션 제거 */
}

.filter-all-item:hover {
  background-color: rgba(37, 99, 235, 0.15) !important;
  /* 색상 차이 줄임 */
}

/* 액션 메뉴 스타일 */
.v-menu .v-list {
  background-color: #0f172a !important;
  padding: 8px !important;
  border-radius: 8px !important;
}

.v-menu .v-list-item {
  border-radius: 4px !important;
  margin: 4px !important;
  min-height: 40px !important;
  color: #f1f5f9 !important;
  transition: none !important;
  /* 트랜지션 제거 */
}

.v-menu .v-list-item:hover {
  background-color: #1e293b !important;
  /* 더 미묘한 색상으로 변경 */
}

.v-menu .v-overlay__content {
  background-color: #0f172a !important;
  border: 1px solid #475569 !important;
  border-radius: 8px !important;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5) !important;
}

/* 상태 필터 표시자 스타일 */
.custom-select-menu .v-list-item[aria-selected='true'] {
  background-color: #2563eb !important;
}

/* 드롭다운 메뉴 트랜지션 조정 */
.v-overlay__content,
.v-menu__content {
  transition: none !important;
  /* 트랜지션 제거 */
}

/* 애니메이션 제거 */
.v-overlay__scrim {
  transition: none !important;
}

/* 메뉴 컨테이너 안정성 확보 */
.v-select__menu {
  transform-origin: center top !important;
  position: fixed !important;
}

/* 리스트 아이템 호버 효과를 위한 전역 스타일 추가 */
.v-list-item::before,
.v-list-item::after {
  display: none !important;
  /* 기본 리플 효과 제거 */
}

/* 컨텐츠가 변경될 때 레이아웃 이동 방지 */
.v-overlay__content {
  will-change: auto !important;
  backface-visibility: hidden !important;
}

/* 필터 선택 박스 스타일 */
.filter-select {
  min-width: 150px;
}

.search-field {
  min-width: 200px;
}

.device-filter-bar {
  margin-bottom: 16px;
  padding: 16px;
  background-color: #0f1419;
  border-radius: 8px;
}

/* 커스텀 셀렉트 메뉴 스타일 */
:deep(.custom-select-menu) {
  background-color: #1a2234 !important;
}

.filter-all-item {
  font-weight: 500;
  color: #90caf9;
}

.filter-all-item:hover {
  background-color: rgba(144, 202, 249, 0.08);
}

/* 경과일 칩 스타일 */
:deep(.v-chip) {
  font-weight: 500;
  font-size: 0.75rem;
}
</style>
