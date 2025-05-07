// Fallback data for the dashboard when API calls fail
export const fallbackSummary = {
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

export const fallbackSystemStatus = [
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

export const getFallbackTrendData = (days = 30) => {
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
    
    // Generate values with some pattern
    active.push(Math.round(10 + Math.sin(i/5) * 3));
    inactive.push(Math.round(2 + Math.cos(i/4) * 1.5));
    under_repair.push(Math.round(1 + Math.sin(i/7) * 1));
  }
  
  return { dates, active, inactive, under_repair };
};