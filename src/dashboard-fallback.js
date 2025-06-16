// Fallback data for the dashboard when API calls fail
export const fallbackSummary = {
  total_devices: 0,
  status: {
    active: 0,
    inactive: 0,
    under_repair: 0,
  },
  device_types: {
    lora: 0,
    ip: 0,
  },
}

export const fallbackSystemStatus = [
  {
    id: 'system1',
    name: '백엔드 API 연결 끊김',
    description: 'API 서버 상태를 확인하세요',
    total: 0,
    active: 0,
    inactive: 0,
    under_repair: 0,
  },
]

export const getFallbackTrendData = (days = 30) => {
  const dates = []
  const active = []
  const inactive = []
  const under_repair = []

  // Generate dates for last X days
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    dates.push(date.toISOString().split('T')[0])

    // Generate values with some pattern
    active.push(Math.round(10 + Math.sin(i / 5) * 3))
    inactive.push(Math.round(2 + Math.cos(i / 4) * 1.5))
    under_repair.push(Math.round(1 + Math.sin(i / 7) * 1))
  }

  return { dates, active, inactive, under_repair }
}
