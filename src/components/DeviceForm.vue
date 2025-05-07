<template>
  <v-form ref="form" v-model="valid" lazy-validation @submit.prevent="submitForm">
    <v-container>
      <v-row>
        <v-col cols="12" md="6">
          <v-select
            v-model="formData.system_id"
            :items="systems"
            item-title="name"
            item-value="id"
            label="System *"
            required
            :rules="[v => !!v || 'System is required']"
          ></v-select>
        </v-col>
        
        <v-col cols="12" md="6">
          <v-text-field
            v-model="formData.device_name"
            label="Device Name *"
            required
            :rules="[v => !!v || 'Device name is required']"
          ></v-text-field>
        </v-col>
        
        <v-col cols="12" md="6">
          <v-text-field
            v-model="formData.facility_name"
            label="Facility Name *"
            required
            :rules="[v => !!v || 'Facility name is required']"
          ></v-text-field>
        </v-col>
        
        <v-col cols="12" md="6">
          <v-switch
            v-model="formData.is_lora"
            color="primary"
            label="LoRa Device"
            hide-details
          ></v-switch>
        </v-col>
        
        <template v-if="!formData.is_lora">
          <v-col cols="12" md="8">
            <v-text-field
              v-model="formData.ip_address"
              label="IP Address"
              :rules="[
                v => !v || /^(\d{1,3}\.){3}\d{1,3}$/.test(v) || 'Invalid IP address format'
              ]"
            ></v-text-field>
          </v-col>
          
          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="formData.port"
              label="Port"
              type="number"
              min="1"
              max="65535"
            ></v-text-field>
          </v-col>
        </template>
        
        <v-col cols="12">
          <v-switch
            v-model="formData.is_use"
            color="primary"
            label="Device is in use"
            hide-details
          ></v-switch>
        </v-col>
      </v-row>
      
      <v-row class="mt-4">
        <v-col class="d-flex justify-end">
          <v-btn color="grey" text class="mr-4" @click="$emit('cancel')">
            Cancel
          </v-btn>
          <v-btn color="primary" type="submit" :disabled="!valid">
            Save
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </v-form>
</template>

<script>
import { ref, reactive, onMounted, watch } from 'vue';
import axios from 'axios';

export default {
  props: {
    device: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['save', 'cancel'],
  setup(props, { emit }) {
    const form = ref(null);
    const valid = ref(true);
    const systems = ref([]);
    
    // Initialize with empty form or provided device
    const formData = reactive({
      id: props.device.id || null,
      system_id: props.device.system_id || '',
      device_name: props.device.device_name || '',
      facility_name: props.device.facility_name || '',
      ip_address: props.device.ip_address || '',
      port: props.device.port || 22,
      is_lora: props.device.is_lora || false,
      is_use: props.device.is_use !== undefined ? props.device.is_use : true
    });
    
    const fetchSystems = async () => {
      try {
        const response = await axios.get('/api/systems');
        systems.value = response.data;
      } catch (error) {
        console.error('Error fetching systems:', error);
      }
    };
    
    const submitForm = async () => {
      if (form.value.validate()) {
        emit('save', { ...formData });
      }
    };
    
    // Update form when props change
    watch(() => props.device, (newDevice) => {
      if (newDevice.id) {
        formData.id = newDevice.id;
        formData.system_id = newDevice.system_id;
        formData.device_name = newDevice.device_name;
        formData.facility_name = newDevice.facility_name;
        formData.ip_address = newDevice.ip_address;
        formData.port = newDevice.port;
        formData.is_lora = newDevice.is_lora;
        formData.is_use = newDevice.is_use;
      }
    }, { deep: true });
    
    onMounted(fetchSystems);
    
    return {
      form,
      valid,
      systems,
      formData,
      submitForm
    };
  }
};
</script>
