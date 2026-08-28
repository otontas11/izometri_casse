<template>
  <RouterLink
    class="pending-transaction-card"
    :aria-label="pendingTransactionAriaLabel"
    :to="{ name: draftFile.intendedOperation }"
  >
    <span class="pending-transaction-card__icon" aria-hidden="true">
      <AppIcon :name="draftFile.intendedOperation" :size="20" />
    </span>

    <span class="pending-transaction-card__content">
      <small>{{ t('dashboard.pendingTransaction.title') }}</small>
      <strong :title="draftFile.fileName">{{ draftFile.fileName }}</strong>
      <span class="pending-transaction-card__details">
        <span>{{ operationLabel }}</span>
        <time :datetime="draftFile.createdAt">
          {{ formatDateTime(draftFile.createdAt) }}
        </time>
      </span>
    </span>

    <span class="pending-transaction-card__continue" aria-hidden="true">
      <small>{{ t('dashboard.pendingTransaction.continue') }}</small>
      <AppIcon name="arrow-right" :size="16" />
    </span>
  </RouterLink>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

import AppIcon from '@/components/common/AppIcon.vue'
import type { DraftFile } from '@/features/draft-files/types/draftFile.types'
import { formatDateTime } from '@/utils/formatters'

const props = defineProps<{
  draftFile: DraftFile
}>()

const { t } = useI18n({ useScope: 'global' })
const operationLabel = computed(() =>
  t(
    props.draftFile.intendedOperation === 'signature'
      ? 'dashboard.pendingTransaction.signature'
      : 'dashboard.pendingTransaction.timestamp',
  ),
)
const pendingTransactionAriaLabel = computed(() =>
  t('dashboard.pendingTransaction.openAriaLabel', {
    fileName: props.draftFile.fileName,
    operation: operationLabel.value,
  }),
)
</script>

<style scoped src="./PendingTransactionCard.css"></style>
