<template>
  <v-card class="system-card" elevation="3">
    <v-card-title class="system-card-title d-flex align-center">
      <v-avatar color="primary" rounded size="42" class="mr-3">
        <v-icon size="24">mdi-server</v-icon>
      </v-avatar>
      <span class="text-truncate">{{ system.name }}</span>
      <v-spacer></v-spacer>

      <v-menu location="bottom">
        <template v-slot:activator="{ props }">
          <!-- <v-btn
            icon
            variant="text"
            size="small"
            v-bind="props"
            @click.stop
          >
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn> -->
        </template>
        <v-list>
          <v-list-item @click.stop="$emit('view', system.id)">
            <v-list-item-title>
              <v-icon size="small" start>mdi-eye</v-icon>
              View Details
            </v-list-item-title>
          </v-list-item>
          <v-list-item @click.stop="$emit('edit', system)">
            <v-list-item-title>
              <v-icon size="small" start>mdi-pencil</v-icon>
              Edit
            </v-list-item-title>
          </v-list-item>
          <v-list-item @click.stop="$emit('delete', system)">
            <v-list-item-title>
              <v-icon size="small" start color="error">mdi-delete</v-icon>
              Delete
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-card-title>

    <v-divider></v-divider>

    <v-card-text class="py-3">
      <p class="text-body-2 text-medium-emphasis mb-3">
        {{ system.description || 'No description available' }}
      </p>

      <!-- Device Status Summary -->
      <div class="d-flex flex-column mb-3">
        <div class="d-flex align-center justify-space-between status-row">
          <div class="d-flex align-center">
            <v-icon color="primary" size="large" class="mr-2">mdi-devices</v-icon>
            <span class="text-body-3">전체 단말기 </span>
          </div>
          <v-chip color="primary" variant="outlined" size="small" class="status-chip">
            {{ system.total || 0 }}
          </v-chip>
        </div>

        <div class="d-flex align-center justify-space-between status-row">
          <div class="d-flex align-center">
            <v-icon color="success" size="large" class="mr-2">mdi-check-circle</v-icon>
            <span class="text-body-2">정상</span>
          </div>
          <v-chip color="success" variant="flat" size="small" class="status-chip">
            {{ system.active || 0 }}
          </v-chip>
        </div>

        <div class="d-flex align-center justify-space-between status-row">
          <div class="d-flex align-center">
            <v-icon color="error" size="large" class="mr-2">mdi-alert-circle</v-icon>
            <span class="text-body-2">비정상</span>
          </div>
          <v-chip color="error" variant="flat" size="small" class="status-chip">
            {{ system.inactive || 0 }}
          </v-chip>
        </div>

        <div class="d-flex align-center justify-space-between status-row">
          <div class="d-flex align-center">
            <v-icon color="warning" size="large" class="mr-2">mdi-wrench</v-icon>
            <span class="text-body-2">수리 중</span>
          </div>
          <v-chip color="warning" variant="flat" size="small" class="status-chip">
            {{ system.under_repair || 0 }}
          </v-chip>
        </div>
      </div>

      <!-- Status Progress Bar -->
      <div v-if="system.total > 0">
        <v-progress-linear rounded height="12" bg-color="grey-darken-3">
          <template v-slot:default>
            <div class="status-bar">
              <div
                class="status-segment active"
                :style="{ width: `${(system.active / system.total) * 100}%` }"
                :title="`Active: ${system.active}`"
              ></div>
              <div
                class="status-segment inactive"
                :style="{ width: `${(system.inactive / system.total) * 100}%` }"
                :title="`Inactive: ${system.inactive}`"
              ></div>
              <div
                class="status-segment repair"
                :style="{ width: `${(system.under_repair / system.total) * 100}%` }"
                :title="`Under Repair: ${system.under_repair}`"
              ></div>
            </div>
          </template>
        </v-progress-linear>
        <div class="d-flex justify-space-between mt-1">
          <span class="text-caption">Active</span>
          <span class="text-caption">Inactive</span>
          <span class="text-caption">Repair</span>
        </div>
      </div>
    </v-card-text>

    <v-divider></v-divider>

    <!-- <v-card-actions>
      <v-btn
        variant="text"
        color="primary"
        size="small"
        @click="$emit('view', system.id)"
      >
        <v-icon size="small" start>mdi-eye</v-icon>
        View Details
      </v-btn>
      <v-spacer></v-spacer>
      <v-btn
        variant="outlined"
        color="primary"
        size="small"
        @click="$emit('manage-devices', system.id)"
      >
        <v-icon size="small" start>mdi-devices</v-icon>
        Manage Devices
      </v-btn>
    </v-card-actions> -->
  </v-card>
</template>

<script>
export default {
  props: {
    system: {
      type: Object,
      required: true,
    },
  },
  computed: {
    // Calculate the percentages for progress bars
    statusPercentages() {
      const total = this.system.total || 0
      if (total === 0) return { active: 0, inactive: 0, repair: 0 }

      return {
        active: ((this.system.active || 0) / total) * 100,
        inactive: ((this.system.inactive || 0) / total) * 100,
        repair: ((this.system.under_repair || 0) / total) * 100,
      }
    },
  },
}
</script>

<style scoped>
.system-card {
  position: relative;
  background: linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.8)) !important;
  border: 1px solid var(--border-color) !important;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  height: 100%;
}

.system-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.3) !important;
  border: 1px solid var(--primary-color) !important;
}

.system-card:hover::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  border-radius: 3px 3px 0 0;
}

.status-row {
  margin-bottom: 8px;
  padding: 4px 0;
}

.status-chip {
  min-width: 48px;
  display: flex;
  justify-content: center;
}

.status-bar {
  display: flex;
  width: 100%;
  height: 100%;
}

.status-segment {
  height: 100%;
}

.status-segment.active {
  background-color: #4caf50; /* Success green */
}

.status-segment.inactive {
  background-color: #f44336; /* Error red */
}

.status-segment.repair {
  background-color: #ffc107; /* Warning yellow */
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .system-card-title {
    flex-direction: column;
    align-items: flex-start;
  }

  .system-card-title .v-avatar {
    margin-bottom: 8px;
  }
}
</style>
