<template>
  <Teleport to="body">
    <Transition name="signature-verification-modal">
      <div v-if="isOpen"
           class="signature-verification-modal"
           @click.self="requestModalClose"
      >
        <section ref="modalDialogElement"
                 class="signature-verification-modal__dialog"
                 role="dialog"
                 aria-modal="true"
                 :aria-busy="isSubmitting"
                 aria-labelledby="signature-verification-modal-title"
                 aria-describedby="signature-verification-modal-description"
        >
          <header class="signature-verification-modal__header">
            <span aria-hidden="true">
              <AppIcon name="signature" :size="24" />
            </span>
            <div>
              <small>{{ t('signature.verification.eyebrow') }}</small>
              <h2 id="signature-verification-modal-title">
                {{ t('signature.verification.title') }}
              </h2>
            </div>
            <button type="button"
                    :disabled="isSubmitting"
                    :aria-label="t('signature.verification.closeAriaLabel')"
                    @click="requestModalClose"
            >
              <AppIcon name="close" :size="20" />
            </button>
          </header>

          <p id="signature-verification-modal-description"
             class="signature-verification-modal__phone-message"
          >
            {{
              t('signature.verification.phoneMessage', {
                phoneNumber: MASKED_DEMO_PHONE_NUMBER,
              })
            }}
          </p>

          <form class="signature-verification-modal__form"
                @submit.prevent="handleVerificationCodeSubmit"
          >
            <fieldset :disabled="isSubmitting">
              <legend>{{ t('signature.verification.codePrompt') }}</legend>
              <div class="signature-verification-modal__code-inputs"
                   role="group"
                   :aria-label="t('signature.verification.codeInputAriaLabel')"
                   @paste="handleVerificationCodePaste"
              >
                <input v-for="digitIndex in VERIFICATION_CODE_LENGTH"
                       :key="digitIndex"
                       ref="verificationCodeInputElements"
                       :value="verificationCodeDigits[digitIndex - 1]"
                       :class="{
                         'signature-verification-modal__code-input--invalid':
                           isVerificationCodeInvalid,
                       }"
                       type="text"
                       inputmode="numeric"
                       pattern="[0-9]*"
                       maxlength="1"
                       autocomplete="one-time-code"
                       :aria-label="
                         t('signature.verification.codeDigitAriaLabel', {
                           position: digitIndex,
                         })
                       "
                       :aria-invalid="isVerificationCodeInvalid"
                       @input="handleVerificationCodeInput($event, digitIndex - 1)"
                       @keydown="
                         handleVerificationCodeKeydown($event, digitIndex - 1)
                       "
                />
              </div>
            </fieldset>

            <p v-if="isVerificationCodeInvalid"
               class="signature-verification-modal__error-message"
               role="alert"
            >
              <span aria-hidden="true">!</span>
              {{ t('signature.verification.invalidCode') }}
            </p>

            <p class="signature-verification-modal__demo-code">
              <span aria-hidden="true">
                <AppIcon name="wallet" :size="18" />
              </span>
              {{
                t('signature.verification.demoCode', {
                  code: DEMO_SIGNATURE_VERIFICATION_CODE,
                })
              }}
            </p>

            <button class="signature-verification-modal__submit-button"
                    type="submit"
                    :disabled="!canSubmitVerificationCode"
            >
              <span v-if="isSubmitting"
                    class="signature-verification-modal__spinner"
                    aria-hidden="true"
              ></span>
              {{
                isSubmitting
                  ? t('signature.verification.verifying')
                  : t('signature.verification.confirm')
              }}
            </button>

            <button class="signature-verification-modal__resend-button"
                    type="button"
                    :disabled="resendSecondsRemaining > 0 || isSubmitting"
                    @click="handleVerificationCodeResend"
            >
              {{
                resendSecondsRemaining > 0
                  ? t('signature.verification.resendCountdown', {
                    seconds: resendSecondsRemaining,
                  })
                  : t('signature.verification.resend')
              }}
            </button>
          </form>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import AppIcon from '@/components/common/AppIcon.vue'

const DEMO_SIGNATURE_VERIFICATION_CODE = '123456'
const MASKED_DEMO_PHONE_NUMBER = '5453***2125'
const RESEND_COUNTDOWN_SECONDS = 30
const VERIFICATION_CODE_LENGTH = 6

const props = defineProps<{
  isOpen: boolean
  isSubmitting: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: []
  resend: []
}>()

const { t } = useI18n({ useScope: 'global' })
const modalDialogElement = ref<HTMLElement | null>(null)
const verificationCodeInputElements = ref<HTMLInputElement[]>([])
const verificationCodeDigits = ref<string[]>(
  Array.from({ length: VERIFICATION_CODE_LENGTH }, () => ''),
)
const isVerificationCodeInvalid = ref(false)
const resendSecondsRemaining = ref(RESEND_COUNTDOWN_SECONDS)
let resendCountdownIntervalId: number | null = null
let previouslyFocusedElement: HTMLElement | null = null
let previousBodyOverflowValue = ''
let isBodyScrollLockedByModal = false

const enteredVerificationCode = computed(() =>
  verificationCodeDigits.value.join(''),
)
const canSubmitVerificationCode = computed(
  () =>
    !props.isSubmitting &&
    enteredVerificationCode.value.length === VERIFICATION_CODE_LENGTH,
)

const clearResendCountdown = () => {
  if (resendCountdownIntervalId === null) {
    return
  }

  window.clearInterval(resendCountdownIntervalId)
  resendCountdownIntervalId = null
}

const startResendCountdown = () => {
  clearResendCountdown()
  resendSecondsRemaining.value = RESEND_COUNTDOWN_SECONDS
  resendCountdownIntervalId = window.setInterval(() => {
    resendSecondsRemaining.value -= 1

    if (resendSecondsRemaining.value <= 0) {
      clearResendCountdown()
    }
  }, 1_000)
}

const resetVerificationCode = () => {
  verificationCodeDigits.value = Array.from(
    { length: VERIFICATION_CODE_LENGTH },
    () => '',
  )
  isVerificationCodeInvalid.value = false
}

const focusVerificationCodeInput = (digitIndex: number) => {
  verificationCodeInputElements.value[digitIndex]?.focus()
}

const updateVerificationCodeDigit = (digitIndex: number, digit: string) => {
  const updatedVerificationCodeDigits = [...verificationCodeDigits.value]
  updatedVerificationCodeDigits[digitIndex] = digit
  verificationCodeDigits.value = updatedVerificationCodeDigits
  isVerificationCodeInvalid.value = false
}

const handleVerificationCodeInput = (inputEvent: Event, digitIndex: number) => {
  const codeInputElement = inputEvent.target as HTMLInputElement
  const enteredDigit = codeInputElement.value.replace(/\D/g, '').slice(-1)

  codeInputElement.value = enteredDigit
  updateVerificationCodeDigit(digitIndex, enteredDigit)

  if (enteredDigit && digitIndex < VERIFICATION_CODE_LENGTH - 1) {
    focusVerificationCodeInput(digitIndex + 1)
  }
}

const handleVerificationCodeKeydown = (
  keyboardEvent: KeyboardEvent,
  digitIndex: number,
) => {
  if (
    keyboardEvent.key === 'Backspace' &&
    !verificationCodeDigits.value[digitIndex] &&
    digitIndex > 0
  ) {
    keyboardEvent.preventDefault()
    updateVerificationCodeDigit(digitIndex - 1, '')
    focusVerificationCodeInput(digitIndex - 1)
    return
  }

  if (keyboardEvent.key === 'ArrowLeft' && digitIndex > 0) {
    keyboardEvent.preventDefault()
    focusVerificationCodeInput(digitIndex - 1)
  }

  if (
    keyboardEvent.key === 'ArrowRight' &&
    digitIndex < VERIFICATION_CODE_LENGTH - 1
  ) {
    keyboardEvent.preventDefault()
    focusVerificationCodeInput(digitIndex + 1)
  }
}

const handleVerificationCodePaste = (clipboardEvent: ClipboardEvent) => {
  const pastedVerificationCode = clipboardEvent.clipboardData
    ?.getData('text')
    .replace(/\D/g, '')
    .slice(0, VERIFICATION_CODE_LENGTH)

  if (!pastedVerificationCode) {
    return
  }

  clipboardEvent.preventDefault()
  verificationCodeDigits.value = Array.from(
    { length: VERIFICATION_CODE_LENGTH },
    (_, digitIndex) => pastedVerificationCode[digitIndex] ?? '',
  )
  isVerificationCodeInvalid.value = false
  focusVerificationCodeInput(
    Math.min(pastedVerificationCode.length, VERIFICATION_CODE_LENGTH) - 1,
  )
}

const handleVerificationCodeSubmit = () => {
  if (!canSubmitVerificationCode.value) {
    return
  }

  if (enteredVerificationCode.value !== DEMO_SIGNATURE_VERIFICATION_CODE) {
    isVerificationCodeInvalid.value = true
    focusVerificationCodeInput(0)
    return
  }

  emit('confirm')
}

const handleVerificationCodeResend = async () => {
  if (resendSecondsRemaining.value > 0 || props.isSubmitting) {
    return
  }

  resetVerificationCode()
  startResendCountdown()
  emit('resend')
  await nextTick()
  focusVerificationCodeInput(0)
}

const requestModalClose = () => {
  if (!props.isSubmitting) {
    emit('close')
  }
}

const handleDocumentKeydown = (keyboardEvent: KeyboardEvent) => {
  if (!props.isOpen) {
    return
  }

  if (keyboardEvent.key === 'Escape') {
    keyboardEvent.preventDefault()
    requestModalClose()
    return
  }

  if (keyboardEvent.key !== 'Tab') {
    return
  }

  const focusableElements = Array.from(
    modalDialogElement.value?.querySelectorAll<HTMLElement>(
      'input:not(:disabled), button:not(:disabled)',
    ) ?? [],
  )

  if (focusableElements.length === 0) {
    keyboardEvent.preventDefault()
    return
  }

  const firstFocusableElement = focusableElements[0]
  const lastFocusableElement = focusableElements[focusableElements.length - 1]
  const activeElement = document.activeElement

  if (
    keyboardEvent.shiftKey &&
    (activeElement === firstFocusableElement ||
      !modalDialogElement.value?.contains(activeElement))
  ) {
    keyboardEvent.preventDefault()
    lastFocusableElement?.focus()
  } else if (
    !keyboardEvent.shiftKey &&
    activeElement === lastFocusableElement
  ) {
    keyboardEvent.preventDefault()
    firstFocusableElement?.focus()
  }
}

watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen) {
      previouslyFocusedElement =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
      previousBodyOverflowValue = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      isBodyScrollLockedByModal = true
      resetVerificationCode()
      startResendCountdown()

      await nextTick()
      focusVerificationCodeInput(0)
      return
    }

    clearResendCountdown()

    if (isBodyScrollLockedByModal) {
      document.body.style.overflow = previousBodyOverflowValue
      isBodyScrollLockedByModal = false
    }

    previouslyFocusedElement?.focus()
    previouslyFocusedElement = null
  },
)

onMounted(() => document.addEventListener('keydown', handleDocumentKeydown))

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleDocumentKeydown)
  clearResendCountdown()

  if (isBodyScrollLockedByModal) {
    document.body.style.overflow = previousBodyOverflowValue
  }
})
</script>

<style scoped src="./SignatureVerificationModal.css"></style>
