<template>
  <v-form ref="form" v-model="valid" lazy-validation @submit.prevent="submitForm">
    <v-container>
      <v-row>
        <v-col cols="12" md="6">
          <v-select
            v-model="formData.device_id"
            :items="devices"
            item-title="device_name"
            item-value="id"
            label="Device *"
            required
            :rules="[(v) => !!v || 'Device is required']"
          >
            <template v-slot:item="{ item, props }">
              <v-list-item v-bind="props">
                <template v-slot:title>
                  {{ item.raw.device_name }}
                </template>
                <template v-slot:subtitle>
                  {{ item.raw.facility_name }}
                </template>
              </v-list-item>
            </template>
          </v-select>
        </v-col>

        <v-col cols="12" md="6">
          <v-select
            v-model="formData.issue_status"
            :items="issueStatusOptions"
            label="Status *"
            required
            :rules="[(v) => !!v || 'Status is required']"
          ></v-select>
        </v-col>

        <v-col cols="12">
          <v-text-field
            v-model="formData.issue_title"
            label="Issue Title *"
            required
            :rules="[(v) => !!v || 'Issue title is required']"
          ></v-text-field>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col class="d-flex justify-end">
          <v-btn color="grey" text class="mr-4" @click="$emit('cancel')"> Cancel </v-btn>
          <v-btn color="primary" type="submit" :disabled="!valid"> Save </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </v-form>
</template>

<script>
import { ref, reactive, onMounted, watch } from 'vue'
import axios from 'axios'

export default {
  props: {
    issue: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ['save', 'cancel'],
  setup(props, { emit }) {
    const form = ref(null)
    const valid = ref(true)
    const devices = ref([])

    const issueStatusOptions = [
      { title: 'Open', value: 'open' },
      { title: 'In Progress', value: 'in_progress' },
      { title: 'Resolved', value: 'resolved' },
    ]

    // Initialize with empty form or provided issue
    const formData = reactive({
      id: props.issue.id || null,
      device_id: props.issue.device_id || '',
      issue_title: props.issue.issue_title || '',
      issue_status: props.issue.issue_status || 'open',
    })

    const fetchDevices = async () => {
      try {
        const response = await axios.get('/api/devices')
        devices.value = response.data
      } catch (error) {
        console.error('Error fetching devices:', error)
      }
    }

    const submitForm = async () => {
      if (form.value.validate()) {
        emit('save', { ...formData })
      }
    }

    // Update form when props change
    watch(
      () => props.issue,
      (newIssue) => {
        if (newIssue.id) {
          formData.id = newIssue.id
          formData.device_id = newIssue.device_id
          formData.issue_title = newIssue.issue_title
          formData.issue_status = newIssue.issue_status
        }
      },
      { deep: true },
    )

    onMounted(fetchDevices)

    return {
      form,
      valid,
      devices,
      issueStatusOptions,
      formData,
      submitForm,
    }
  },
}
</script>
