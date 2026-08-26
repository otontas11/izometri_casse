<script setup lang="ts">
import { RouterLink } from 'vue-router'

import AppIcon from '@/components/common/AppIcon.vue'
import { useToast } from '@/composables/useToast'
import type {
  ArchivedDocument,
  DocumentOperation,
} from '@/features/dashboard/types/dashboard.types'
import { formatDateTime, formatFileSize } from '@/utils/formatters'

defineProps<{
  archivedDocuments: ArchivedDocument[]
}>()

const { showInfoToast } = useToast()

const documentOperationLabels: Record<DocumentOperation, string> = {
  signature: 'E-imza',
  timestamp: 'Zaman damgası',
}

const handleDocumentPreview = (archivedDocument: ArchivedDocument) => {
  if (!archivedDocument.canPreview) {
    return
  }

  showInfoToast(
    `${archivedDocument.name} için güvenli önizleme hazırlanıyor.`,
  )
}

const handleDocumentDownload = (archivedDocument: ArchivedDocument) => {
  showInfoToast(`${archivedDocument.name} için indirme isteği oluşturuldu.`)
}
</script>

<template>
  <section
    class="recent-documents-table"
    aria-labelledby="recent-documents-title"
  >
    <header class="recent-documents-table__heading">
      <div>
        <p>Yakın geçmiş</p>
        <h2 id="recent-documents-title">Son arşivlenen belgeler</h2>
      </div>
      <span>{{ archivedDocuments.length }} kayıt gösteriliyor</span>
    </header>

    <div v-if="archivedDocuments.length" class="recent-documents-table__content">
      <div class="recent-documents-table__column-headings" aria-hidden="true">
        <span>Belge</span>
        <span>İşlem</span>
        <span>Tarih</span>
        <span>Boyut</span>
        <span>İşlemler</span>
      </div>

      <article
        v-for="archivedDocument in archivedDocuments"
        :key="archivedDocument.id"
        class="recent-documents-table__row"
      >
        <div class="recent-documents-table__file" data-label="Belge">
          <span aria-hidden="true">
            <AppIcon name="document" :size="20" />
          </span>
          <div>
            <strong>{{ archivedDocument.name }}</strong>
            <small>
              #IZ-{{ String(archivedDocument.id).padStart(4, '0') }}
            </small>
          </div>
        </div>
        <div data-label="İşlem">
          <span
            :class="[
              'recent-documents-table__operation',
              `recent-documents-table__operation--${archivedDocument.operation}`,
            ]"
          >
            {{ documentOperationLabels[archivedDocument.operation] }}
          </span>
        </div>
        <time :datetime="archivedDocument.createdAt" data-label="Tarih">
          {{ formatDateTime(archivedDocument.createdAt) }}
        </time>
        <span data-label="Boyut">
          {{ formatFileSize(archivedDocument.sizeBytes) }}
        </span>
        <div class="recent-documents-table__actions" data-label="İşlemler">
          <button
            type="button"
            :disabled="!archivedDocument.canPreview"
            :aria-label="`${archivedDocument.name} belgesini önizle`"
            :title="
              archivedDocument.canPreview
                ? 'Belgeyi önizle'
                : 'Bu dosya türü önizlenemiyor'
            "
            @click="handleDocumentPreview(archivedDocument)"
          >
            <AppIcon name="eye" :size="18" />
          </button>
          <button
            type="button"
            :aria-label="`${archivedDocument.name} belgesini indir`"
            title="Belgeyi indir"
            @click="handleDocumentDownload(archivedDocument)"
          >
            <AppIcon name="download" :size="18" />
          </button>
        </div>
      </article>
    </div>

    <div v-else class="recent-documents-table__empty-state">
      <span aria-hidden="true">
        <AppIcon name="archive" :size="26" />
      </span>
      <h3>Arşiviniz henüz boş</h3>
      <p>İlk zaman damgası işleminiz tamamlandığında belgeniz burada görünür.</p>
      <RouterLink :to="{ name: 'timestamp' }">İlk işlemi oluştur</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.recent-documents-table {
  overflow: hidden;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.recent-documents-table__heading {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  justify-content: space-between;
  padding: 1.4rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.recent-documents-table__heading p,
.recent-documents-table__heading h2,
.recent-documents-table__empty-state h3,
.recent-documents-table__empty-state p {
  margin: 0;
}

.recent-documents-table__heading p {
  color: var(--color-accent-600);
  font-size: var(--font-size-small);
  font-weight: 800;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.recent-documents-table__heading h2 {
  margin-top: 0.35rem;
  color: var(--color-brand-950);
  font-size: 1.2rem;
  letter-spacing: -0.025em;
}

.recent-documents-table__heading > span {
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  font-weight: 700;
}

.recent-documents-table__column-headings,
.recent-documents-table__row {
  display: grid;
  grid-template-columns: minmax(15rem, 2fr) minmax(8rem, 0.8fr) minmax(10rem, 1fr) minmax(5rem, 0.55fr) 5rem;
  gap: 1rem;
  align-items: center;
  padding-inline: 1.5rem;
}

.recent-documents-table__column-headings {
  min-height: 2.8rem;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background: var(--color-surface-canvas);
}

.recent-documents-table__row {
  min-height: 5.25rem;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
}

.recent-documents-table__row + .recent-documents-table__row {
  border-top: 1px solid var(--color-border);
}

.recent-documents-table__file {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  min-width: 0;
}

.recent-documents-table__file > span {
  display: grid;
  flex: 0 0 auto;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  color: var(--color-primary-600);
  background: var(--color-primary-100);
  border-radius: 0.75rem;
}

.recent-documents-table__file > div {
  display: grid;
  min-width: 0;
  gap: 0.2rem;
}

.recent-documents-table__file strong {
  overflow: hidden;
  color: var(--color-brand-950);
  font-size: 0.76rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-documents-table__file small {
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  font-weight: 600;
}

.recent-documents-table__operation {
  display: inline-flex;
  width: fit-content;
  padding: 0.38rem 0.55rem;
  font-size: var(--font-size-small);
  font-weight: 800;
  border-radius: 999px;
}

.recent-documents-table__operation--timestamp {
  color: var(--color-success);
  background: var(--color-accent-100);
}

.recent-documents-table__operation--signature {
  color: #6141c0;
  background: #f0ebff;
}

.recent-documents-table__actions {
  display: flex;
  gap: 0.35rem;
  justify-content: flex-end;
}

.recent-documents-table__actions button {
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  color: var(--color-text-secondary);
  cursor: pointer;
  background: transparent;
  border-radius: 0.5rem;
}

.recent-documents-table__actions button:hover:not(:disabled) {
  color: var(--color-brand-950);
  background: var(--color-surface-subtle);
}

.recent-documents-table__actions button:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}

.recent-documents-table__empty-state {
  display: grid;
  justify-items: center;
  padding: 3rem 1.5rem;
  text-align: center;
}

.recent-documents-table__empty-state > span {
  display: grid;
  width: 3.5rem;
  height: 3.5rem;
  place-items: center;
  color: var(--color-accent-600);
  background: var(--color-accent-100);
  border-radius: 1rem;
}

.recent-documents-table__empty-state h3 {
  margin-top: 1rem;
  color: var(--color-brand-950);
  font-size: 1rem;
}

.recent-documents-table__empty-state p {
  max-width: 28rem;
  margin-top: 0.5rem;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  line-height: 1.6;
}

.recent-documents-table__empty-state a {
  margin-top: 1.25rem;
  padding: 0.65rem 0.85rem;
  color: var(--color-text-inverse);
  font-size: var(--font-size-small);
  font-weight: 800;
  text-decoration: none;
  background: var(--color-brand-950);
  border-radius: var(--radius-sm);
}

@media (max-width: 79.99rem) {
  .recent-documents-table__column-headings,
  .recent-documents-table__row {
    grid-template-columns: minmax(13rem, 1.7fr) minmax(7rem, 0.8fr) minmax(9rem, 1fr) 5rem;
  }

  .recent-documents-table__column-headings > span:nth-child(4),
  .recent-documents-table__row > [data-label='Boyut'] {
    display: none;
  }
}

@media (max-width: 47.99rem) {
  .recent-documents-table__heading {
    align-items: start;
  }

  .recent-documents-table__heading > span,
  .recent-documents-table__column-headings {
    display: none;
  }

  .recent-documents-table__row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.85rem 1rem;
    padding-block: 1.1rem;
  }

  .recent-documents-table__file {
    grid-column: 1 / -1;
  }

  .recent-documents-table__row > time,
  .recent-documents-table__row > [data-label='Boyut'] {
    display: block;
    grid-column: 1;
    font-size: var(--font-size-small);
  }

  .recent-documents-table__row > time::before,
  .recent-documents-table__row > [data-label='Boyut']::before {
    margin-right: 0.35rem;
    color: var(--color-brand-950);
    content: attr(data-label) ':';
    font-weight: 800;
  }

  .recent-documents-table__row > [data-label='İşlem'] {
    grid-column: 1;
  }

  .recent-documents-table__actions {
    grid-row: 2 / span 3;
    grid-column: 2;
    align-self: center;
  }
}
</style>
