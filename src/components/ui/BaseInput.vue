<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    autocomplete?: string
    disabled?: boolean
    errorMessage?: string
    hint?: string
    id: string
    inputMode?:
      | 'decimal'
      | 'email'
      | 'none'
      | 'numeric'
      | 'search'
      | 'tel'
      | 'text'
      | 'url'
    label: string
    maximumLength?: number
    modelValue: string
    name?: string
    placeholder?: string
    readonly?: boolean
    required?: boolean
    type?: 'email' | 'password' | 'search' | 'tel' | 'text' | 'url'
  }>(),
  {
    autocomplete: 'off',
    disabled: false,
    errorMessage: '',
    hint: '',
    inputMode: 'text',
    maximumLength: undefined,
    name: undefined,
    placeholder: '',
    readonly: false,
    required: false,
    type: 'text',
  },
)

const emit = defineEmits<{
  blur: []
  'update:modelValue': [inputValue: string]
}>()

const inputDescriptionIds = computed(() => {
  const descriptionIds = [
    props.hint ? `${props.id}-hint` : '',
    props.errorMessage ? `${props.id}-error` : '',
  ].filter(Boolean)

  return descriptionIds.length ? descriptionIds.join(' ') : undefined
})

const handleInput = (inputEvent: Event) => {
  const inputElement = inputEvent.target as HTMLInputElement
  emit('update:modelValue', inputElement.value)
}
</script>

<template>
  <div
    :class="[
      'base-input',
      {
        'base-input--error': errorMessage,
        'base-input--readonly': readonly,
      },
    ]"
  >
    <label :for="id">
      {{ label }}
      <span v-if="required" aria-hidden="true">*</span>
    </label>

    <input
      :id="id"
      :name="name"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :inputmode="inputMode"
      :maxlength="maximumLength"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :aria-invalid="errorMessage ? 'true' : undefined"
      :aria-describedby="inputDescriptionIds"
      @input="handleInput"
      @blur="emit('blur')"
    />

    <small v-if="hint" :id="`${id}-hint`" class="base-input__hint">
      {{ hint }}
    </small>
    <small
      v-if="errorMessage"
      :id="`${id}-error`"
      class="base-input__error-message"
      role="alert"
    >
      {{ errorMessage }}
    </small>
  </div>
</template>

<style scoped>
.base-input {
  display: grid;
  gap: 0.45rem;
  min-width: 0;
}

.base-input label {
  color: var(--color-brand-950);
  font-size: var(--font-size-small);
  font-weight: 500;
}

.base-input label span {
  color: var(--color-danger);
}

.base-input input {
  width: 100%;
  min-height: 3rem;
  padding: 0.75rem 0.9rem;
  color: var(--color-text-primary);
  font-size: 0.8rem;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  transition:
    background var(--transition-fast),
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.base-input input::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.72;
}

.base-input input:hover:not(:disabled, :read-only) {
  border-color: color-mix(
    in srgb,
    var(--color-brand-950) 35%,
    var(--color-border)
  );
}

.base-input input:focus {
  border-color: var(--color-primary-600);
  box-shadow: 0 0 0 3px
    color-mix(in srgb, var(--color-primary-600) 13%, transparent);
}

.base-input input:disabled {
  cursor: wait;
  opacity: 0.68;
}

.base-input--readonly input {
  color: var(--color-text-secondary);
  cursor: default;
  background: var(--color-surface-subtle);
}

.base-input--error input {
  border-color: var(--color-danger);
}

.base-input__hint,
.base-input__error-message {
  font-size: var(--font-size-small);
  line-height: 1.45;
}

.base-input__hint {
  color: var(--color-text-secondary);
}

.base-input__error-message {
  color: var(--color-danger);
  font-weight: 500;
}
</style>
