<template>
  <div
    ref="datePickerElement"
    :class="[
      'base-date-picker',
      { 'base-date-picker--open': isCalendarOpen },
    ]"
    @keydown.esc.stop.prevent="closeCalendarAndRestoreTriggerFocus"
  >
    <span :id="labelElementId" class="base-date-picker__label">
      {{ label }}
    </span>

    <button
      :id="id"
      ref="triggerElement"
      class="base-date-picker__trigger"
      type="button"
      aria-haspopup="dialog"
      :aria-controls="calendarPanelId"
      :aria-expanded="isCalendarOpen"
      :aria-labelledby="`${labelElementId} ${selectedDateSummaryId}`"
      @click="handleTriggerClick"
      @keydown="handleTriggerKeydown"
    >
      <AppIcon class="base-date-picker__calendar-icon" name="calendar" :size="17" />
      <span
        :id="selectedDateSummaryId"
        :class="[
          'base-date-picker__summary',
          {
            'base-date-picker__summary--placeholder': !modelValue,
          },
        ]"
      >
        {{ selectedDateLabel }}
      </span>
      <AppIcon
        class="base-date-picker__chevron"
        name="chevron-down"
        :size="17"
      />
    </button>

    <section
      v-if="isCalendarOpen"
      :id="calendarPanelId"
      ref="calendarPanelElement"
      class="base-date-picker__panel"
      role="dialog"
      :aria-label="calendarAriaLabel"
    >
      <header class="base-date-picker__calendar-header">
        <button
          type="button"
          :aria-label="previousMonthText"
          @click="changeDisplayedMonth(-1)"
        >
          <span aria-hidden="true">‹</span>
        </button>
        <strong aria-live="polite">{{ displayedMonthLabel }}</strong>
        <button
          type="button"
          :aria-label="nextMonthText"
          @click="changeDisplayedMonth(1)"
        >
          <span aria-hidden="true">›</span>
        </button>
      </header>

      <div class="base-date-picker__weekdays" aria-hidden="true">
        <span
          v-for="weekdayLabel in weekdayLabels"
          :key="weekdayLabel"
        >
          {{ weekdayLabel }}
        </span>
      </div>

      <div class="base-date-picker__days">
        <template
          v-for="(calendarDay, calendarDayIndex) in calendarDays"
          :key="calendarDay?.dateValue ?? `empty-${calendarDayIndex}`"
        >
          <span v-if="!calendarDay" aria-hidden="true"></span>
          <button
            v-else
            type="button"
            :class="[
              'base-date-picker__day',
              {
                'base-date-picker__day--selected': calendarDay.isSelected,
                'base-date-picker__day--today': calendarDay.isToday,
              },
            ]"
            :aria-label="calendarDay.fullDateLabel"
            :aria-pressed="calendarDay.isSelected"
            :data-date-value="calendarDay.dateValue"
            @click="selectDate(calendarDay.dateValue)"
            @keydown="handleCalendarDayKeydown($event, calendarDay.dateValue)"
          >
            {{ calendarDay.dayNumber }}
          </button>
        </template>
      </div>

      <footer class="base-date-picker__footer">
        <button type="button" @click="handleTodaySelection">
          {{ todayText }}
        </button>
        <button
          v-if="modelValue"
          type="button"
          @click="handleDateClear"
        >
          {{ clearText }}
        </button>
      </footer>
    </section>
  </div>
</template>

<script lang="ts" setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'
import { useI18n } from 'vue-i18n'

import AppIcon from '@/components/common/AppIcon.vue'

interface CalendarDay {
  dateValue: string
  dayNumber: number
  fullDateLabel: string
  isSelected: boolean
  isToday: boolean
}

const DATE_VALUE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const CALENDAR_WEEK_LENGTH = 7

const props = defineProps<{
  calendarAriaLabel: string
  clearText: string
  id: string
  label: string
  modelValue: string
  nextMonthText: string
  placeholder: string
  previousMonthText: string
  todayText: string
}>()

const emit = defineEmits<{
  'update:modelValue': [selectedDate: string]
}>()

const { locale } = useI18n({ useScope: 'global' })
const datePickerElement = ref<HTMLElement | null>(null)
const calendarPanelElement = ref<HTMLElement | null>(null)
const triggerElement = ref<HTMLButtonElement | null>(null)
const isCalendarOpen = ref(false)
const currentDate = new Date()
const displayedMonthIndex = ref(currentDate.getMonth())
const displayedYear = ref(currentDate.getFullYear())

const labelElementId = computed(() => `${props.id}-label`)
const calendarPanelId = computed(() => `${props.id}-calendar`)
const selectedDateSummaryId = computed(() => `${props.id}-summary`)
const applicationLocaleCode = computed(() =>
  locale.value === 'en' ? 'en-US' : 'tr-TR',
)

const formatDateValue = (calendarDate: Date) => {
  const calendarYear = String(calendarDate.getFullYear()).padStart(4, '0')
  const calendarMonth = String(calendarDate.getMonth() + 1).padStart(2, '0')
  const calendarDay = String(calendarDate.getDate()).padStart(2, '0')

  return `${calendarYear}-${calendarMonth}-${calendarDay}`
}

const parseDateValue = (dateValue: string) => {
  if (!DATE_VALUE_PATTERN.test(dateValue)) {
    return null
  }

  const [selectedYear, selectedMonth, selectedDay] = dateValue
    .split('-')
    .map(Number)
  const parsedDate = new Date(
    selectedYear,
    selectedMonth - 1,
    selectedDay,
  )
  const isExactCalendarDate =
    parsedDate.getFullYear() === selectedYear &&
    parsedDate.getMonth() === selectedMonth - 1 &&
    parsedDate.getDate() === selectedDay

  return isExactCalendarDate ? parsedDate : null
}

const todayDateValue = formatDateValue(currentDate)
const selectedDateLabel = computed(() => {
  const selectedDate = parseDateValue(props.modelValue)

  if (!selectedDate) {
    return props.placeholder
  }

  return new Intl.DateTimeFormat(applicationLocaleCode.value, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(selectedDate)
})
const displayedMonthLabel = computed(() =>
  new Intl.DateTimeFormat(applicationLocaleCode.value, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(displayedYear.value, displayedMonthIndex.value, 1)),
)
const weekdayLabels = computed(() => {
  const weekdayFormatter = new Intl.DateTimeFormat(
    applicationLocaleCode.value,
    { weekday: 'short' },
  )
  const firstMondayOfReferenceWeek = new Date(2024, 0, 1)

  return Array.from({ length: CALENDAR_WEEK_LENGTH }, (_, weekdayIndex) =>
    weekdayFormatter.format(
      new Date(
        firstMondayOfReferenceWeek.getFullYear(),
        firstMondayOfReferenceWeek.getMonth(),
        firstMondayOfReferenceWeek.getDate() + weekdayIndex,
      ),
    ),
  )
})
const calendarDays = computed<Array<CalendarDay | null>>(() => {
  const firstDateOfDisplayedMonth = new Date(
    displayedYear.value,
    displayedMonthIndex.value,
    1,
  )
  const leadingEmptyDayCount =
    (firstDateOfDisplayedMonth.getDay() + 6) % CALENDAR_WEEK_LENGTH
  const dayCountInDisplayedMonth = new Date(
    displayedYear.value,
    displayedMonthIndex.value + 1,
    0,
  ).getDate()
  const fullDateFormatter = new Intl.DateTimeFormat(
    applicationLocaleCode.value,
    {
      day: 'numeric',
      month: 'long',
      weekday: 'long',
      year: 'numeric',
    },
  )
  const emptyCalendarDays = Array.from<null>({
    length: leadingEmptyDayCount,
  }).fill(null)
  const displayedCalendarDays = Array.from(
    { length: dayCountInDisplayedMonth },
    (_, dayIndex): CalendarDay => {
      const calendarDate = new Date(
        displayedYear.value,
        displayedMonthIndex.value,
        dayIndex + 1,
      )
      const dateValue = formatDateValue(calendarDate)

      return {
        dateValue,
        dayNumber: dayIndex + 1,
        fullDateLabel: fullDateFormatter.format(calendarDate),
        isSelected: dateValue === props.modelValue,
        isToday: dateValue === todayDateValue,
      }
    },
  )

  return [...emptyCalendarDays, ...displayedCalendarDays]
})

const closeCalendar = () => {
  isCalendarOpen.value = false
}

const focusCalendarDate = async (calendarDate: Date) => {
  displayedYear.value = calendarDate.getFullYear()
  displayedMonthIndex.value = calendarDate.getMonth()
  await nextTick()
  calendarPanelElement.value
    ?.querySelector<HTMLButtonElement>(
      `[data-date-value="${formatDateValue(calendarDate)}"]`,
    )
    ?.focus()
}

const openCalendar = async () => {
  if (isCalendarOpen.value) {
    return
  }

  const initialCalendarDate = parseDateValue(props.modelValue) ?? new Date()
  displayedYear.value = initialCalendarDate.getFullYear()
  displayedMonthIndex.value = initialCalendarDate.getMonth()
  isCalendarOpen.value = true
  await focusCalendarDate(initialCalendarDate)
}

const closeCalendarAndRestoreTriggerFocus = async () => {
  if (!isCalendarOpen.value) {
    return
  }

  closeCalendar()
  await nextTick()
  triggerElement.value?.focus()
}

const handleTriggerClick = () => {
  if (isCalendarOpen.value) {
    closeCalendar()
    return
  }

  void openCalendar()
}

const handleTriggerKeydown = (keyboardEvent: KeyboardEvent) => {
  if (keyboardEvent.key !== 'ArrowDown') {
    return
  }

  keyboardEvent.preventDefault()
  void openCalendar()
}

const changeDisplayedMonth = (monthOffset: number) => {
  const nextDisplayedMonth = new Date(
    displayedYear.value,
    displayedMonthIndex.value + monthOffset,
    1,
  )
  displayedYear.value = nextDisplayedMonth.getFullYear()
  displayedMonthIndex.value = nextDisplayedMonth.getMonth()
}

const selectDate = async (selectedDate: string) => {
  emit('update:modelValue', selectedDate)
  await closeCalendarAndRestoreTriggerFocus()
}

const handleTodaySelection = () => {
  void selectDate(todayDateValue)
}

const handleDateClear = () => {
  void selectDate('')
}

const handleCalendarDayKeydown = (
  keyboardEvent: KeyboardEvent,
  dateValue: string,
) => {
  const calendarDayOffsets: Partial<Record<string, number>> = {
    ArrowDown: CALENDAR_WEEK_LENGTH,
    ArrowLeft: -1,
    ArrowRight: 1,
    ArrowUp: -CALENDAR_WEEK_LENGTH,
  }
  const calendarDayOffset = calendarDayOffsets[keyboardEvent.key]

  if (calendarDayOffset === undefined) {
    return
  }

  const focusedCalendarDate = parseDateValue(dateValue)

  if (!focusedCalendarDate) {
    return
  }

  keyboardEvent.preventDefault()
  focusedCalendarDate.setDate(
    focusedCalendarDate.getDate() + calendarDayOffset,
  )
  void focusCalendarDate(focusedCalendarDate)
}

const handleDocumentPointerDown = (pointerEvent: PointerEvent) => {
  if (
    pointerEvent.target instanceof Node &&
    !datePickerElement.value?.contains(pointerEvent.target)
  ) {
    closeCalendar()
  }
}

const handleDocumentFocusIn = (focusEvent: FocusEvent) => {
  if (
    focusEvent.target instanceof Node &&
    !datePickerElement.value?.contains(focusEvent.target)
  ) {
    closeCalendar()
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown)
  document.addEventListener('focusin', handleDocumentFocusIn)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
  document.removeEventListener('focusin', handleDocumentFocusIn)
})
</script>

<style scoped src="./BaseDatePicker.css"></style>
