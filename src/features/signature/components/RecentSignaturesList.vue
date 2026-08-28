<template>
  <section class="recent-signatures-list"
           aria-labelledby="recent-signatures-list-title"
  >
    <header class="recent-signatures-list__header">
      <div>
        <span>{{ t('signature.recentSignatures.eyebrow') }}</span>
        <h2 id="recent-signatures-list-title">
          {{ t('signature.recentSignatures.title') }}
        </h2>
      </div>
      <div class="recent-signatures-list__header-actions">
        <strong>
          {{
            t('signature.recentSignatures.recordCount', {
              count: signedDocuments.length,
            })
          }}
        </strong>
        <RouterLink :to="{
          name: 'document-history',
          query: { operations: 'signature' },
        }"
        >
          {{ t('common.viewAll') }}
          <AppIcon name="arrow-right" :size="16" />
        </RouterLink>
      </div>
    </header>

    <p v-if="errorMessage && signedDocuments.length > 0"
       class="recent-signatures-list__warning-message"
       role="alert"
    >
      <span aria-hidden="true">!</span>
      {{ errorMessage }}
      <button type="button" @click="emit('retry')">
        {{ t('common.retry') }}
      </button>
    </p>

    <div v-if="isLoading && signedDocuments.length === 0"
         class="recent-signatures-list__loading-state"
         role="status"
         aria-busy="true"
    >
      <span aria-hidden="true"></span>
      <p>{{ t('signature.recentSignatures.loading') }}</p>
    </div>

    <div v-else-if="errorMessage && signedDocuments.length === 0"
         class="recent-signatures-list__error-state"
         role="alert"
    >
      <span aria-hidden="true">!</span>
      <h3>{{ t('signature.recentSignatures.errorTitle') }}</h3>
      <p>{{ errorMessage }}</p>
      <button type="button" @click="emit('retry')">
        <AppIcon name="refresh" :size="17" />
        {{ t('common.retry') }}
      </button>
    </div>

    <div v-else-if="signedDocuments.length === 0"
         class="recent-signatures-list__empty-state"
    >
      <span aria-hidden="true">
        <AppIcon name="signature" :size="25" />
      </span>
      <h3>{{ t('signature.recentSignatures.emptyTitle') }}</h3>
      <p>{{ t('signature.recentSignatures.emptyDescription') }}</p>
    </div>

    <ul v-else class="recent-signatures-list__documents">
      <li v-for="signedDocument in signedDocuments"
          :key="signedDocument.id"
          class="recent-signatures-list__document"
      >
        <span class="recent-signatures-list__document-icon" aria-hidden="true">
          <AppIcon name="document" :size="20" />
        </span>

        <div class="recent-signatures-list__document-information">
          <strong :title="signedDocument.name">
            {{ signedDocument.name }}
          </strong>
          <small>#IZ-{{ String(signedDocument.id).padStart(4, '0') }}</small>
        </div>

        <div class="recent-signatures-list__document-detail">
          <small>{{ t('signature.recentSignatures.signedAt') }}</small>
          <time :datetime="signedDocument.createdAt">
            {{ formatDateTime(signedDocument.createdAt) }}
          </time>
        </div>

        <div class="recent-signatures-list__document-detail">
          <small>{{ t('signature.recentSignatures.fileSize') }}</small>
          <strong>{{ formatFileSize(signedDocument.sizeBytes) }}</strong>
        </div>

        <span class="recent-signatures-list__status">
          <span aria-hidden="true">✓</span>
          {{ t('signature.recentSignatures.signedStatus') }}
        </span>
      </li>
    </ul>
  </section>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

import AppIcon from '@/components/common/AppIcon.vue'
import type { ArchivedDocument } from '@/features/dashboard/types/dashboard.types'
import { formatDateTime, formatFileSize } from '@/utils/formatters'

defineProps<{
  errorMessage: string
  isLoading: boolean
  signedDocuments: ArchivedDocument[]
}>()

const emit = defineEmits<{
  retry: []
}>()

const { t } = useI18n({ useScope: 'global' })
</script>

<style scoped src="./RecentSignaturesList.css"></style>
