<template>
  <v-form ref="form" v-model="valid" lazy-validation @submit.prevent="submitForm">
    <v-container>
      <v-row>
        <v-col cols="12">
          <v-text-field
            v-model="formData.name"
            label="System Name *"
            required
            :rules="[(v) => !!v || 'System name is required']"
          ></v-text-field>
        </v-col>

        <v-col cols="12">
          <v-textarea v-model="formData.description" label="Description" rows="3"></v-textarea>
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
import { ref, reactive, watch } from 'vue'

export default {
  props: {
    system: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ['save', 'cancel'],
  setup(props, { emit }) {
    const form = ref(null)
    const valid = ref(true)

    // Initialize with empty form or provided system
    const formData = reactive({
      id: props.system.id || null,
      name: props.system.name || '',
      description: props.system.description || '',
    })

    const submitForm = async () => {
      if (form.value.validate()) {
        emit('save', { ...formData })
      }
    }

    // Update form when props change
    watch(
      () => props.system,
      (newSystem) => {
        if (newSystem.id) {
          formData.id = newSystem.id
          formData.name = newSystem.name
          formData.description = newSystem.description
        }
      },
      { deep: true },
    )

    return {
      form,
      valid,
      formData,
      submitForm,
    }
  },
}
</script>
