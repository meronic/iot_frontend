<template>
  <div>
    <v-card class="main-container mb-6 pa-4" elevation="2">
      <!-- Header Section -->
      <div class="d-flex flex-wrap align-center mb-6">
        <div class="d-flex align-center">
          <v-icon size="32" color="primary" class="mr-3">mdi-tools</v-icon>
          <h1 class="text-h5 font-weight-bold">수리 중인 단말기 : {{ filteredLogs.length }}대</h1>
        </div>

        <v-spacer></v-spacer>

        <div class="d-flex flex-wrap search-controls">
          <v-btn
            color="primary"
            prepend-icon="mdi-refresh"
            @click="refreshData"
            :loading="loading"
            class="refresh-btn"
          >
            새로고침
          </v-btn>
        </div>
      </div>

      <!-- Filters Section -->
      <v-card class="filter-card mb-6" variant="outlined">
        <v-card-text class="py-2 px-4">
          <v-row>
            <v-col cols="12" sm="6" md="4">
              <v-select
                v-model="filters.system"
                :items="systemOptions"
                label="시스템 필터"
                variant="outlined"
                density="comfortable"
                clearable
                hide-details
                @update:model-value="filterData"
                class="filter-select"
              ></v-select>
            </v-col>

            <v-col cols="12" sm="6" md="4">
              <v-select
                v-model="filters.timeframe"
                :items="timeframeOptions"
                label="기간 선택"
                variant="outlined"
                density="comfortable"
                hide-details
                @update:model-value="filterData"
                class="filter-select"
              ></v-select>
            </v-col>

            <v-col cols="12" sm="6" md="4" class="d-flex align-center justify-sm-end">
              <v-btn
                color="secondary"
                variant="text"
                @click="resetFilters"
                prepend-icon="mdi-filter-remove"
                class="reset-btn"
              >
                필터 초기화
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Data Table Section -->
      <v-card class="table-card" elevation="1">
        <v-data-table
          :headers="headers"
          :items="filteredLogs"
          :search="search"
          :loading="loading"
          :items-per-page="10"
          density="comfortable"
          class="repair-table"
        >
          <!-- 단말기명 표시 -->
          <template v-slot:item.device_name="{ item }">
            <span>{{ getDeviceName(item.device_id) }}</span>
          </template>

          <!-- 시스템명 표시 -->
          <template v-slot:item.device_system="{ item }">
            <span class="text-caption text-medium-emphasis">{{
              getDeviceSystem(item.device_id)
            }}</span>
          </template>

          <!-- 설명란 표시 - 수정 가능하도록 변경 -->
          <template v-slot:item.message="{ item }">
            <div v-if="editingMessage && editingMessage.id === item.id" class="d-flex align-center">
              <v-text-field
                v-model="editingMessage.text"
                variant="outlined"
                density="compact"
                hide-details
                autofocus
                @keyup.enter="saveMessage(item)"
                @keyup.esc="cancelEdit"
                class="mr-2"
              ></v-text-field>
              <div class="d-flex">
                <v-btn icon size="small" color="success" @click="saveMessage(item)" class="mr-1">
                  <v-icon size="small">mdi-check</v-icon>
                </v-btn>
                <v-btn icon size="small" color="error" @click="cancelEdit">
                  <v-icon size="small">mdi-close</v-icon>
                </v-btn>
              </div>
            </div>
            <div v-else @click="startEdit(item)" class="message-content">
              <v-tooltip activator="parent" location="top">클릭하여 수정</v-tooltip>
              {{ item.message }}
              <v-icon size="small" color="primary" class="edit-icon ms-2">mdi-pencil</v-icon>
            </div>
          </template>

          <!-- 날짜 및 시간 -->
          <template v-slot:item.timestamp="{ item }">
            <div class="timestamp">{{ formatDate(item.timestamp) }}</div>
          </template>

          <!-- 수리 상태 표시 -->
          <template v-slot:item.action_type="{ item }">
            <v-chip color="warning" size="small" variant="elevated" class="status-chip">
              <v-icon start size="small">mdi-wrench</v-icon>
              수리중
            </v-chip>
          </template>

          <!-- no data -->
          <template v-slot:no-data>
            <div class="empty-state text-center py-8">
              <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-devices</v-icon>
              <h3 class="text-h6 mb-2">수리 기록이 없습니다</h3>
              <p class="text-body-2 text-medium-emphasis mb-4">
                현재 필터 조건에 맞는 수리 중인 단말기가 없습니다
              </p>
              <v-btn color="primary" @click="refreshData" class="mt-2">데이터 새로고침</v-btn>
            </div>
          </template>
        </v-data-table>
      </v-card>
    </v-card>

    <!-- 알림 메시지 스낵바 -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">닫기</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { logsApi, devicesApi, systemsApi } from '../services/api'

export default {
  setup() {
    const router = useRouter()
    const repairLogs = ref([])
    const allDevices = ref([])
    const allSystems = ref([])
    const loading = ref(true)
    const search = ref('')
    const error = ref(null)

    // 메시지 편집 관련 상태 변수
    const editingMessage = ref(null)
    const originalMessage = ref('')

    // 알림 메시지용 스낵바
    const snackbar = ref({
      show: false,
      text: '',
      color: 'success',
    })

    const filters = ref({
      system: null,
      timeframe: 'all',
    })

    const timeframeOptions = [
      { title: '전체 기간', value: 'all' },
      { title: '최근 24시간', value: 'day' },
      { title: '최근 7일', value: 'week' },
      { title: '최근 30일', value: 'month' },
    ]

    const systemOptions = computed(() => {
      return allSystems.value.map((system) => ({
        title: system.name,
        value: system.id,
      }))
    })

    const headers = [
      { title: '단말기명', key: 'device_name', width: '15%' },
      { title: '시스템명', key: 'device_system', width: '15%' },
      { title: '설명', key: 'message', width: '40%' },
      { title: '상태', key: 'action_type', width: '10%' },
      { title: '날짜 및 시간', key: 'timestamp', width: '20%' },
    ]

    const filteredLogs = computed(() => {
      let result = [...repairLogs.value]

      if (filters.value.system) {
        const systemDeviceIds = allDevices.value
          .filter((device) => device.system_id === filters.value.system)
          .map((device) => device.id)
        result = result.filter((log) => systemDeviceIds.includes(log.device_id))
      }

      if (filters.value.timeframe !== 'all') {
        const now = new Date()
        let cutoffDate
        switch (filters.value.timeframe) {
          case 'day':
            cutoffDate = new Date(now.setDate(now.getDate() - 1))
            break
          case 'week':
            cutoffDate = new Date(now.setDate(now.getDate() - 7))
            break
          case 'month':
            cutoffDate = new Date(now.setDate(now.getDate() - 30))
            break
        }
        result = result.filter((log) => new Date(log.timestamp) >= cutoffDate)
      }

      return result
    })

    const fetchRepairLogs = async () => {
      try {
        const response = await logsApi.getRepairLogs(filters.value.system)
        repairLogs.value = Array.isArray(response.data) ? response.data : []
      } catch (err) {
        console.error('수리 로그 데이터 가져오기 오류:', err)
        repairLogs.value = []
        showSnackbar('데이터를 불러오는 중 오류가 발생했습니다.', 'error')
      }
    }

    const fetchDevices = async () => {
      try {
        const response = await devicesApi.getAll()
        allDevices.value = Array.isArray(response.data) ? response.data : []
      } catch (error) {
        console.error('단말기 데이터 가져오기 오류:', error)
        allDevices.value = []
      }
    }

    const fetchSystems = async () => {
      try {
        const response = await systemsApi.getAll()
        allSystems.value = Array.isArray(response.data) ? response.data : []
      } catch (error) {
        console.error('시스템 데이터 가져오기 오류:', error)
        allSystems.value = []
      }
    }

    const refreshData = async () => {
      loading.value = true
      try {
        await Promise.all([fetchRepairLogs(), fetchDevices(), fetchSystems()])
      } finally {
        loading.value = false
      }
    }

    const getDeviceName = (deviceId) => {
      const device = allDevices.value.find((d) => d.id === deviceId)
      return device ? device.device_name : '알 수 없는 단말기'
    }

    const getDeviceSystem = (deviceId) => {
      const device = allDevices.value.find((d) => d.id === deviceId)
      const system = allSystems.value.find((s) => s.id === device?.system_id)
      return system ? system.name : '알 수 없는 시스템'
    }

    const formatDate = (dateString) => {
      if (!dateString) return ''
      try {
        const date = new Date(dateString)
        return date.toLocaleString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      } catch {
        return dateString
      }
    }

    const viewDeviceDetails = (deviceId) => {
      router.push({ path: '/devices', query: { device_id: deviceId } })
    }

    const resetFilters = () => {
      filters.value = { system: null, timeframe: 'all' }
      search.value = ''
    }

    const filterData = () => {
      /* handled by computed */
    }

    // 설명 수정 관련 함수들
    const startEdit = (item) => {
      // 이미 편집 중인 경우 먼저 취소
      if (editingMessage.value) {
        cancelEdit()
      }

      // 편집 시작
      originalMessage.value = item.message
      editingMessage.value = {
        id: item.id,
        text: item.message,
      }
    }

    const cancelEdit = () => {
      editingMessage.value = null
    }

    const saveMessage = async (item) => {
      if (!editingMessage.value || !editingMessage.value.text.trim()) {
        showSnackbar('설명을 입력해주세요.', 'warning')
        return
      }

      loading.value = true
      try {
        // API를 통해 메시지 업데이트
        await logsApi.updateLogMessage(item.id, editingMessage.value.text)

        // 로컬 데이터 업데이트
        const logIndex = repairLogs.value.findIndex((log) => log.id === item.id)
        if (logIndex !== -1) {
          repairLogs.value[logIndex].message = editingMessage.value.text
        }

        showSnackbar('설명이 성공적으로 업데이트되었습니다.', 'success')
        editingMessage.value = null
      } catch (error) {
        console.error('메시지 업데이트 오류:', error)
        showSnackbar('설명 업데이트 중 오류가 발생했습니다.', 'error')
      } finally {
        loading.value = false
      }
    }

    const showSnackbar = (text, color = 'success') => {
      snackbar.value = {
        show: true,
        text,
        color,
      }
    }

    watch(
      () => filters.value.system,
      async () => {
        await fetchRepairLogs()
      },
    )

    onMounted(() => {
      refreshData()
    })

    return {
      repairLogs,
      filteredLogs,
      loading,
      error,
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
      resetFilters,
      // 설명 수정 관련
      editingMessage,
      startEdit,
      cancelEdit,
      saveMessage,
      snackbar,
    }
  },
}
</script>

<style scoped>
/* Dark navy theme styling for repair history page */
.v-card {
  background: linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.8)) !important;
  border: 1px solid var(--border-color) !important;
  backdrop-filter: blur(10px);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4) !important;
}

/* Add subtle blue glow to warning elements */
.v-icon[color='warning'] {
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

.v-chip[color='warning'] {
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

  .v-text-field,
  .v-btn {
    width: 100%;
    margin-top: 0.5rem;
    margin-right: 0 !important;
  }
}

/* 기존 스타일은 유지하고 설명 수정 관련 스타일만 추가 */
.message-content {
  position: relative;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.message-content:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.message-content .edit-icon {
  opacity: 0;
  transition: opacity 0.2s;
}

.message-content:hover .edit-icon {
  opacity: 1;
}

/* 반응형 스타일 조정 */
@media (max-width: 600px) {
  .message-content .edit-icon {
    opacity: 0.5;
  }
}
</style>
