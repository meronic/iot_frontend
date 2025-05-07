import axios from 'axios';

// Base URL for API calls
const API_URL = '/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000
});

// Create fallback data for when API is unavailable
const getFallbackSummaryData = () => {
  return {
    total_devices: 15,
    status: {
      active: 11,
      inactive: 2,
      under_repair: 2
    },
    device_types: {
      lora: 6,
      ip: 9
    }
  };
};

const getFallbackTrendData = (days = 30) => {
  const dates = [];
  const active = [];
  const inactive = [];
  const under_repair = [];
  
  // Generate dates for last X days
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
    
    // Generate random values (but with some pattern)
    active.push(Math.round(10 + Math.sin(i/5) * 3));
    inactive.push(Math.round(2 + Math.cos(i/4) * 1.5));
    under_repair.push(Math.round(1 + Math.sin(i/7) * 1));
  }
  
  return { dates, active, inactive, under_repair };
};

const getFallbackSystemStatus = () => {
  return [
    {
      id: "system1",
      name: "Factory Monitoring",
      description: "Manufacturing plant sensors and monitors",
      total: 5,
      active: 3,
      inactive: 1,
      under_repair: 1
    },
    {
      id: "system2",
      name: "Smart Building",
      description: "Office building automation and monitoring",
      total: 5,
      active: 4,
      inactive: 0,
      under_repair: 1
    },
    {
      id: "system3",
      name: "Agriculture Sensors",
      description: "Farm and greenhouse monitoring systems",
      total: 5,
      active: 4,
      inactive: 1,
      under_repair: 0
    }
  ];
};

// System API calls
export const systemsApi = {
  getAll() {
    return apiClient.get('/systems')
      .catch(error => {
        console.log('API error, using fallback data for systems list', error);
        return { data: getFallbackSystemStatus() };
      });
  },
  get(id) {
    return apiClient.get(`/systems/${id}`)
      .catch(error => {
        console.log('API error, using fallback data for system', error);
        return { 
          data: getFallbackSystemStatus().find(s => s.id === id) || {
            id: id,
            name: "Sample System",
            description: "Fallback system data" 
          }
        };
      });
  },
  create(system) {
    return apiClient.post('/systems', system);
  },
  update(id, system) {
    return apiClient.put(`/systems/${id}`, system);
  },
  delete(id) {
    return apiClient.delete(`/systems/${id}`);
  },
  getStatus() {
    return apiClient.get('/systems/status')
      .catch(error => {
        console.log('API error, using fallback data for system status', error);
        return { data: getFallbackSystemStatus() };
      });
  },
  getDeviceCounts() {
    return apiClient.get('/systems/device-counts')
      .catch(error => {
        console.log('API error, using fallback data for device counts', error);
        const counts = {};
        getFallbackSystemStatus().forEach(system => {
          counts[system.id] = system.total;
        });
        return { data: counts };
      });
  }
};

// Function to generate fallback device data
const getFallbackDeviceData = (params = {}) => {
  const devices = [
    {
      id: "device1",
      system_id: "system1",
      device_name: "Temp-Sensor-A1",
      facility_name: "Assembly Line 1",
      ip_address: "192.168.1.101",
      port: 22,
      is_lora: false,
      is_use: true,
      status: {
        status: "active",
        ping_status: true,
        ssh_status: true,
        last_data_time: new Date().toISOString()
      }
    },
    {
      id: "device2",
      system_id: "system1",
      device_name: "Pressure-Monitor-B2",
      facility_name: "Assembly Line 2",
      ip_address: "192.168.1.102",
      port: 22,
      is_lora: false,
      is_use: true,
      status: {
        status: "inactive",
        ping_status: false,
        ssh_status: false,
        last_data_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    },
    {
      id: "device3",
      system_id: "system2",
      device_name: "HVAC-Controller-F6",
      facility_name: "Floor 1",
      ip_address: "192.168.2.101",
      port: 22,
      is_lora: false,
      is_use: true,
      status: {
        status: "under_repair",
        ping_status: true,
        ssh_status: true,
        last_data_time: new Date().toISOString()
      }
    }
  ];
  
  // Filter by system_id if provided
  if (params.system_id) {
    return devices.filter(d => d.system_id === params.system_id);
  }
  
  // Filter by status if provided
  if (params.status) {
    return devices.filter(d => d.status.status === params.status);
  }
  
  return devices;
};

// Device API calls
export const devicesApi = {
  getAll(params = {}) {
    return apiClient.get('/devices', { params })
      .catch(error => {
        console.log('API error, using fallback data for devices list', error);
        return { data: getFallbackDeviceData(params) };
      });
  },
  get(id) {
    return apiClient.get(`/devices/${id}`)
      .catch(error => {
        console.log('API error, using fallback data for device details', error);
        const device = getFallbackDeviceData().find(d => d.id === id);
        return { data: device || {
          id: id,
          device_name: "Fallback Device",
          facility_name: "Fallback Facility",
          system_id: "system1",
          status: { status: "active" }
        }};
      });
  },
  create(device) {
    return apiClient.post('/devices', device);
  },
  update(id, device) {
    return apiClient.put(`/devices/${id}`, device);
  },
  delete(id) {
    return apiClient.delete(`/devices/${id}`);
  },
  updateStatus(id, status) {
    return apiClient.put(`/device-status/${id}`, status);
  },
  setStatus(id, status) {
    return apiClient.put(`/devices/${id}/status`, status);
  },
  setToRepair(id) {
    return apiClient.put(`/devices/${id}/status`, { 
      status: 'under_repair',
      created_by: 'user'
    });
  },
  getHistory(id, days = 30) {
    return apiClient.get(`/device-history/${id}?days=${days}`)
      .catch(error => {
        console.log('API error, using fallback data for device history', error);
        // Generate some historical data
        const history = [];
        const today = new Date();
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const status = i % 7 === 0 ? "inactive" : (i % 15 === 0 ? "under_repair" : "active");
          
          history.push({
            date: date.toISOString().split('T')[0],
            status: status,
            ping_status: status !== "inactive",
            last_data_time: date.toISOString()
          });
        }
        return { data: history };
      });
  }
};

// Issues API calls
export const issuesApi = {
  getAll(params = {}) {
    return apiClient.get('/issues', { params });
  },
  get(id) {
    return apiClient.get(`/issues/${id}`);
  },
  create(issue) {
    return apiClient.post('/issues', issue);
  },
  update(id, issue) {
    return apiClient.put(`/issues/${id}`, issue);
  },
  delete(id) {
    return apiClient.delete(`/issues/${id}`);
  }
};

// Dashboard API calls
// Import fallback data to avoid duplication
import { fallbackSummary } from '@/dashboard-fallback';

export const dashboardApi = {
  getSummary(systemId = null) {
    const params = systemId ? { system_id: systemId } : {};
    return apiClient.get('/summary', { params })
      .then(response => {
        if (!response.data || !response.data.total_devices || 
            !response.data.status || !response.data.device_types) {
          console.warn('Invalid API response for summary, using fallback data');
          return { data: fallbackSummary };
        }
        return response;
      })
      .catch(error => {
        console.log('API error, using fallback data for summary', error);
        return { data: fallbackSummary };
      });
  },
  getTrends(days = 30, systemId = null) {
    const params = { days };
    if (systemId) {
      params.system_id = systemId;
    }
    return apiClient.get('/trends', { params })
      .catch(error => {
        console.log('API error, using fallback data for trends', error);
        return { data: getFallbackTrendData(days) };
      });
  }
};

// Logs API calls
export const logsApi = {
  getDeviceLogs(deviceId, params = {}) {
    return apiClient.get(`/logs/${deviceId}`, { params });
  },
  getAllLogs(params = {}) {
    return apiClient.get('/logs', { params });
  },
  getRepairLogs(systemId = null) {
    const params = {
      status_change: 'to_repair'
    };
    if (systemId) {
      params.system_id = systemId;
    }
    return apiClient.get('/logs', { params });
  },
  createLog(log) {
    return apiClient.post('/logs', log);
  }
};

export default {
  systems: systemsApi,
  devices: devicesApi,
  issues: issuesApi,
  dashboard: dashboardApi,
  logs: logsApi
};
