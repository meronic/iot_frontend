import axios from 'axios'

// 백엔드 서버 URL 설정 (실제 FastAPI 서버 주소로 변경)
const API_URL = 'http://172.25.35.154:8000/api' // 백엔드 주소와 포트 수정

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// System API calls
export const systemsApi = {
  getAll() {
    return apiClient.get('/systems')
  },
  get(id) {
    return apiClient.get(`/systems/${id}`)
  },
  getStatus() {
    return apiClient.get('/systems/status')
  },
  getDeviceCounts() {
    return apiClient.get('/systems/device-counts')
  },
}

// Device API calls
export const devicesApi = {
  getAll(params = {}) {
    return apiClient.get('/devices', { params })
  },

  getAll(params = {}) {
    return apiClient.get('/devices', { params })
  },
  get(id) {
    return apiClient.get(`/devices/${id}`)
  },
  create(device) {
    return apiClient.post('/devices', device)
  },
  update(id, device) {
    return apiClient.put(`/devices/${id}`, device)
  },

  delete(id) {
    return apiClient.delete(`/devices/${id}`)
  },

  // 디바이스 수리
  setToRepair(id) {
    return apiClient.put(`/devices/${id}/status`, { status: 'under_repair' })
  },
}

// Dashboard API calls
export const dashboardApi = {
  getSummary(systemId = null) {
    const params = systemId ? { system_id: systemId } : {}
    return apiClient.get('/summary', { params })
  },
  getTrends() {
    return apiClient.get('/weekly-stats')
  },
}

// log
// logsApi 수정
export const logsApi = {
  getDeviceLogs(deviceId, params = {}) {
    return apiClient.get(`/logs?device_id=${deviceId}`, { params })
  },
  getAllLogs(params = {}) {
    return apiClient.get('/logs', { params })
  },
  getRepairLogs(systemId = null) {
    const params = systemId ? { system_id: systemId } : {}
    return apiClient.get('/logs/repair', { params })
  },
  createLog(log) {
    return apiClient.post('/logs', log)
  },

  // 수정된 updateLogMessage 함수
  updateLogMessage(logId, newMessage) {
    return apiClient.patch(`/logs/${logId}`, {
      message: newMessage,
    })
  },
}

export default {
  systems: systemsApi,
  devices: devicesApi,
  dashboard: dashboardApi,
  logs: logsApi,
}
