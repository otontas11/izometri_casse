<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import AppIcon from '@/components/common/AppIcon.vue'
import { formatFileSize } from '@/utils/formatters'

const props = withDefaults(
  defineProps<{
    errorMessage?: string
    isOpen: boolean
    isSubmitting: boolean
    timestampFile: File | null
  }>(),
  {
    errorMessage: '',
  },
)

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const modalDialogElement = ref<HTMLElement | null>(null)
const confirmationButtonElement = ref<HTMLButtonElement | null>(null)
let previouslyFocusedElement: HTMLElement | null = null
let previousBodyOverflowValue = ''
let isBodyScrollLockedByModal = false

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

  const focusableButtons = Array.from(
    modalDialogElement.value?.querySelectorAll<HTMLButtonElement>(
      'button:not(:disabled)',
    ) ?? [],
  )

  if (focusableButtons.length === 0) {
    keyboardEvent.preventDefault()
    return
  }

  const firstFocusableButton = focusableButtons[0]
  const lastFocusableButton = focusableButtons[focusableButtons.length - 1]
  const activeElement = document.activeElement

  if (
    keyboardEvent.shiftKey &&
    (activeElement === firstFocusableButton ||
      !modalDialogElement.value?.contains(activeElement))
  ) {
    keyboardEvent.preventDefault()
    lastFocusableButton?.focus()
  } else if (!keyboardEvent.shiftKey && activeElement === lastFocusableButton) {
    keyboardEvent.preventDefault()
    firstFocusableButton?.focus()
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

      await nextTick()
      confirmationButtonElement.value?.focus()
      return
    }

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

  if (isBodyScrollLockedByModal) {
    document.body.style.overflow = previousBodyOverflowValue
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="timestamp-confirmation-modal">
      <div
        v-if="isOpen && timestampFile"
        class="timestamp-confirmation-modal"
        @click.self="requestModalClose"
      >
        <section
          ref="modalDialogElement"
          class="timestamp-confirmation-modal__dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="timestamp-confirmation-modal-title"
          aria-describedby="timestamp-confirmation-modal-description"
        >
          <header class="timestamp-confirmation-modal__header">
            <span aria-hidden="true">
              <AppIcon name="timestamp" :size="23" />
            </span>
            <div>
              <small>Son kontrol</small>
              <h2 id="timestamp-confirmation-modal-title">
                Zaman damgasını onaylayın
              </h2>
            </div>
            <button
              type="button"
              :disabled="isSubmitting"
              aria-label="Onay penceresini kapat"
              @click="requestModalClose"
            >
              <AppIcon name="close" :size="19" />
            </button>
          </header>

          <p id="timestamp-confirmation-modal-description">
            Aşağıdaki dosya için doğrulanabilir bir işlem kaydı oluşturulacak.
            Onaydan sonra kayıt işlem geçmişinize eklenir.
          </p>

          <div class="timestamp-confirmation-modal__file-summary">
            <span aria-hidden="true">
              <AppIcon name="document" :size="22" />
            </span>
            <div>
              <strong>{{ timestampFile.name }}</strong>
              <small>{{ formatFileSize(timestampFile.size) }}</small>
            </div>
          </div>

          <dl class="timestamp-confirmation-modal__details">
            <div>
              <dt>İşlem</dt>
              <dd>Zaman damgalama</dd>
            </div>
            <div>
              <dt>Kontör maliyeti</dt>
              <dd>1 kontör</dd>
            </div>
          </dl>

          <p
            v-if="errorMessage"
            class="timestamp-confirmation-modal__error-message"
            role="alert"
          >
            <span aria-hidden="true">!</span>
            {{ errorMessage }}
          </p>

          <footer class="timestamp-confirmation-modal__actions">
            <button
              type="button"
              :disabled="isSubmitting"
              @click="requestModalClose"
            >
              Vazgeç
            </button>
            <button
              ref="confirmationButtonElement"
              type="button"
              :disabled="isSubmitting"
              @click="emit('confirm')"
            >
              <span
                v-if="isSubmitting"
                class="timestamp-confirmation-modal__spinner"
                aria-hidden="true"
              ></span>
              {{ isSubmitting ? 'İşlem oluşturuluyor…' : 'Onayla ve zaman damgala' }}
            </button>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.timestamp-confirmation-modal {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: grid;
  padding: 1rem;
  place-items: center;
  background: color-mix(in srgb, var(--color-brand-950) 58%, transparent);
  backdrop-filter: blur(5px);
}

.timestamp-confirmation-modal__dialog {
  display: grid;
  width: min(100%, 34rem);
  max-height: calc(100vh - 2rem);
  padding: clamp(1.25rem, 4vw, 2rem);
  overflow-y: auto;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: 1.25rem;
  box-shadow: 0 1.5rem 4rem
    color-mix(in srgb, var(--color-brand-950) 22%, transparent);
}

.timestamp-confirmation-modal__header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.85rem;
  align-items: center;
}

.timestamp-confirmation-modal__header > span {
  display: grid;
  width: 3rem;
  height: 3rem;
  place-items: center;
  color: var(--color-accent-600);
  background: var(--color-accent-100);
  border-radius: var(--radius-sm);
}

.timestamp-confirmation-modal__header small,
.timestamp-confirmation-modal__header h2,
.timestamp-confirmation-modal__dialog > p {
  margin: 0;
}

.timestamp-confirmation-modal__header small {
  color: var(--color-accent-600);
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.timestamp-confirmation-modal__header h2 {
  margin-top: 0.25rem;
  color: var(--color-brand-950);
  font-size: 1.2rem;
  line-height: 1.25;
  letter-spacing: -0.025em;
}

.timestamp-confirmation-modal__header button {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  color: var(--color-text-secondary);
  cursor: pointer;
  background: var(--color-surface-subtle);
  border-radius: 50%;
}

.timestamp-confirmation-modal__header button:disabled {
  cursor: wait;
  opacity: 0.55;
}

.timestamp-confirmation-modal__dialog > p {
  margin-top: 1.25rem;
  color: var(--color-text-secondary);
  font-size: 0.82rem;
  line-height: 1.65;
}

.timestamp-confirmation-modal__file-summary {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.8rem;
  align-items: center;
  margin-top: 1.35rem;
  padding: 1rem;
  background: var(--color-surface-subtle);
  border-radius: var(--radius-md);
}

.timestamp-confirmation-modal__file-summary > span {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  color: var(--color-primary-600);
  background: var(--color-primary-100);
  border-radius: var(--radius-sm);
}

.timestamp-confirmation-modal__file-summary div {
  display: grid;
  min-width: 0;
  gap: 0.25rem;
}

.timestamp-confirmation-modal__file-summary strong {
  overflow: hidden;
  color: var(--color-brand-950);
  font-size: 0.82rem;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timestamp-confirmation-modal__file-summary small {
  color: var(--color-text-secondary);
  font-size: 0.7rem;
}

.timestamp-confirmation-modal__details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin: 1rem 0 0;
}

.timestamp-confirmation-modal__details div {
  padding: 0.9rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.timestamp-confirmation-modal__details dt,
.timestamp-confirmation-modal__details dd {
  margin: 0;
}

.timestamp-confirmation-modal__details dt {
  color: var(--color-text-secondary);
  font-size: 0.68rem;
}

.timestamp-confirmation-modal__details dd {
  margin-top: 0.3rem;
  color: var(--color-brand-950);
  font-size: 0.78rem;
  font-weight: 500;
}

.timestamp-confirmation-modal__error-message {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  padding: 0.8rem 0.9rem;
  color: var(--color-danger) !important;
  font-weight: 500;
  background: color-mix(
    in srgb,
    var(--color-danger) 8%,
    var(--color-surface-raised)
  );
  border: 1px solid color-mix(in srgb, var(--color-danger) 24%, transparent);
  border-radius: var(--radius-sm);
}

.timestamp-confirmation-modal__error-message span {
  display: grid;
  width: 1.4rem;
  height: 1.4rem;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid currentColor;
  border-radius: 50%;
}

.timestamp-confirmation-modal__actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--color-border);
}

.timestamp-confirmation-modal__actions button {
  display: inline-flex;
  gap: 0.55rem;
  align-items: center;
  justify-content: center;
  min-height: 2.8rem;
  padding: 0.7rem 1rem;
  color: var(--color-brand-950);
  font-size: 0.76rem;
  font-weight: 500;
  cursor: pointer;
  background: var(--color-surface-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.timestamp-confirmation-modal__actions button:last-child {
  color: var(--color-text-inverse);
  background: var(--color-brand-950);
  border-color: var(--color-brand-950);
}

.timestamp-confirmation-modal__actions button:disabled {
  cursor: wait;
  opacity: 0.68;
}

.timestamp-confirmation-modal__spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid color-mix(in srgb, currentColor 35%, transparent);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: timestamp-confirmation-modal-spin 700ms linear infinite;
}

.timestamp-confirmation-modal-enter-active,
.timestamp-confirmation-modal-leave-active {
  transition: opacity var(--transition-fast);
}

.timestamp-confirmation-modal-enter-active
  .timestamp-confirmation-modal__dialog,
.timestamp-confirmation-modal-leave-active
  .timestamp-confirmation-modal__dialog {
  transition: transform var(--transition-fast);
}

.timestamp-confirmation-modal-enter-from,
.timestamp-confirmation-modal-leave-to {
  opacity: 0;
}

.timestamp-confirmation-modal-enter-from
  .timestamp-confirmation-modal__dialog,
.timestamp-confirmation-modal-leave-to
  .timestamp-confirmation-modal__dialog {
  transform: translateY(0.75rem) scale(0.985);
}

@keyframes timestamp-confirmation-modal-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 35rem) {
  .timestamp-confirmation-modal__details {
    grid-template-columns: minmax(0, 1fr);
  }

  .timestamp-confirmation-modal__actions {
    display: grid;
  }

  .timestamp-confirmation-modal__actions button:last-child {
    grid-row: 1;
  }
}
</style>
