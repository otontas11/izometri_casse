<template>
  <div
    ref="multiSelectElement"
    :class="[
      'base-multi-select',
      { 'base-multi-select--open': isDropdownOpen },
    ]"
    @focusout="handleFocusOut"
    @keydown.esc.stop.prevent="closeDropdownAndRestoreTriggerFocus"
  >
    <span :id="labelElementId" class="base-multi-select__label">
      {{ label }}
    </span>

    <button
      :id="id"
      ref="triggerElement"
      class="base-multi-select__trigger"
      type="button"
      aria-haspopup="true"
      :aria-controls="optionsPanelId"
      :aria-expanded="isDropdownOpen"
      :aria-labelledby="`${labelElementId} ${summaryElementId}`"
      :disabled="disabled"
      @click="handleTriggerClick"
      @keydown="handleTriggerKeydown"
    >
      <span
        :id="summaryElementId"
        :class="[
          'base-multi-select__summary',
          {
            'base-multi-select__summary--placeholder':
              modelValue.length === 0,
          },
        ]"
      >
        {{ selectedValueSummary }}
      </span>
      <span
        v-if="modelValue.length > 0"
        class="base-multi-select__selection-count"
        aria-hidden="true"
      >
        {{ modelValue.length }}
      </span>
      <AppIcon
        class="base-multi-select__chevron"
        name="chevron-down"
        :size="17"
      />
    </button>

    <div
      v-if="isDropdownOpen"
      :id="optionsPanelId"
      ref="optionsPanelElement"
      class="base-multi-select__panel"
      role="group"
      :aria-labelledby="labelElementId"
    >
      <div
        v-for="multiSelectOption in options"
        :key="multiSelectOption.value"
        :class="[
          'base-multi-select__option',
          {
            'base-multi-select__option--selected': modelValue.includes(
              multiSelectOption.value,
            ),
          },
        ]"
      >
        <button
          type="button"
          class="base-multi-select__checkbox"
          role="checkbox"
          data-multi-select-checkbox
          :aria-checked="modelValue.includes(multiSelectOption.value)"
          :aria-label="multiSelectOption.label"
          @click="handleOptionToggle(multiSelectOption.value)"
          @keydown="handleCheckboxKeydown"
        >
          <span aria-hidden="true">
            {{ modelValue.includes(multiSelectOption.value) ? '✓' : '' }}
          </span>
        </button>
        <span
          class="base-multi-select__option-label"
          @pointerdown.prevent
        >
          {{ multiSelectOption.label }}
        </span>
      </div>

      <footer v-if="modelValue.length > 0" class="base-multi-select__footer">
        <button type="button" @click="handleSelectionClear">
          {{ clearText }}
        </button>
      </footer>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

import AppIcon from '@/components/common/AppIcon.vue'

interface MultiSelectOption {
  label: string
  value: string
}

const props = withDefaults(
  defineProps<{
    clearText: string
    disabled?: boolean
    id: string
    label: string
    modelValue: string[]
    multipleSelectionText: string
    options: MultiSelectOption[]
    placeholder: string
  }>(),
  {
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [selectedValues: string[]]
}>()

const isDropdownOpen = ref(false)
const multiSelectElement = ref<HTMLElement | null>(null)
const optionsPanelElement = ref<HTMLElement | null>(null)
const triggerElement = ref<HTMLButtonElement | null>(null)

const labelElementId = computed(() => `${props.id}-label`)
const optionsPanelId = computed(() => `${props.id}-options`)
const summaryElementId = computed(() => `${props.id}-summary`)
const selectedOptionLabels = computed(() =>
  props.options
    .filter((multiSelectOption) =>
      props.modelValue.includes(multiSelectOption.value),
    )
    .map((multiSelectOption) => multiSelectOption.label),
)
const selectedValueSummary = computed(() => {
  if (selectedOptionLabels.value.length === 0) {
    return props.placeholder
  }

  if (selectedOptionLabels.value.length === 1) {
    return selectedOptionLabels.value[0]
  }

  return props.multipleSelectionText
})

const getCheckboxElements = () =>
  Array.from(
    optionsPanelElement.value?.querySelectorAll<HTMLButtonElement>(
      '[data-multi-select-checkbox]',
    ) ?? [],
  )

const openDropdown = () => {
  if (props.disabled || isDropdownOpen.value) {
    return
  }

  isDropdownOpen.value = true
}

const closeDropdown = () => {
  if (!isDropdownOpen.value) {
    return
  }

  isDropdownOpen.value = false
}

const closeDropdownAndRestoreTriggerFocus = async () => {
  if (!isDropdownOpen.value) {
    return
  }

  closeDropdown()
  await nextTick()
  triggerElement.value?.focus()
}

const openDropdownAndFocusOption = async (shouldFocusLastOption = false) => {
  openDropdown()
  await nextTick()
  const checkboxElements = getCheckboxElements()
  const checkboxElementToFocus = shouldFocusLastOption
    ? checkboxElements.at(-1)
    : checkboxElements[0]

  checkboxElementToFocus?.focus()
}

const handleTriggerClick = () => {
  if (isDropdownOpen.value) {
    closeDropdown()
    return
  }

  openDropdown()
}

const handleTriggerKeydown = (keyboardEvent: KeyboardEvent) => {
  if (
    keyboardEvent.key !== 'ArrowDown' &&
    keyboardEvent.key !== 'ArrowUp'
  ) {
    return
  }

  keyboardEvent.preventDefault()
  void openDropdownAndFocusOption(keyboardEvent.key === 'ArrowUp')
}

const handleOptionToggle = (optionValue: string) => {
  const isOptionSelected = props.modelValue.includes(optionValue)
  const updatedSelectedValues = isOptionSelected
    ? props.modelValue.filter((selectedValue) => selectedValue !== optionValue)
    : [...props.modelValue, optionValue]

  emit('update:modelValue', updatedSelectedValues)
}

const handleCheckboxKeydown = (keyboardEvent: KeyboardEvent) => {
  const checkboxElements = getCheckboxElements()
  const focusedCheckboxIndex = checkboxElements.indexOf(
    keyboardEvent.currentTarget as HTMLButtonElement,
  )

  if (focusedCheckboxIndex < 0 || checkboxElements.length === 0) {
    return
  }

  let checkboxIndexToFocus: number

  if (keyboardEvent.key === 'ArrowDown') {
    checkboxIndexToFocus =
      (focusedCheckboxIndex + 1) % checkboxElements.length
  } else if (keyboardEvent.key === 'ArrowUp') {
    checkboxIndexToFocus =
      (focusedCheckboxIndex - 1 + checkboxElements.length) %
      checkboxElements.length
  } else if (keyboardEvent.key === 'Home') {
    checkboxIndexToFocus = 0
  } else if (keyboardEvent.key === 'End') {
    checkboxIndexToFocus = checkboxElements.length - 1
  } else {
    return
  }

  keyboardEvent.preventDefault()
  checkboxElements[checkboxIndexToFocus]?.focus()
}

const handleSelectionClear = () => {
  emit('update:modelValue', [])
}

const handleFocusOut = (focusEvent: FocusEvent) => {
  const nextFocusedElement = focusEvent.relatedTarget

  if (
    !(nextFocusedElement instanceof Node) ||
    !multiSelectElement.value?.contains(nextFocusedElement)
  ) {
    closeDropdown()
  }
}

const handleOutsidePointerDown = (pointerEvent: PointerEvent) => {
  if (
    pointerEvent.target instanceof Node &&
    !multiSelectElement.value?.contains(pointerEvent.target)
  ) {
    closeDropdown()
  }
}

onMounted(() =>
  document.addEventListener('pointerdown', handleOutsidePointerDown),
)
onBeforeUnmount(() =>
  document.removeEventListener('pointerdown', handleOutsidePointerDown),
)
</script>

<style scoped src="./BaseMultiSelect.css"></style>
