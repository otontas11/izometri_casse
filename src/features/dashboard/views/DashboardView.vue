<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'

import AppIcon from '@/components/ui/AppIcon.vue'
import DashboardMetricCard from '@/features/dashboard/components/DashboardMetricCard.vue'
import { useDashboardStore } from '@/features/dashboard/stores/dashboard.store'
import type {
  ArchivedDocument,
  DocumentOperation,
} from '@/features/dashboard/types/dashboard.types'

const dashboardStore = useDashboardStore()
const { errorMessage, isLoading, recentDocuments, status, summary } =
  storeToRefs(dashboardStore)
const { user } = useAuth0()

const actionMessage = ref('')
let feedbackTimer: ReturnType<typeof setTimeout> | undefined

const numberFormatter = new Intl.NumberFormat('tr-TR')
const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  month: 'short',
  year: 'numeric',
})
const todayFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  weekday: 'long',
})

const todayLabel = todayFormatter.format(new Date())
const greetingName = computed(() => {
  const candidates = [
    user.value?.given_name,
    user.value?.name,
    user.value?.nickname,
    user.value?.email,
  ]
  const displayName = candidates.find(
    (candidate): candidate is string =>
      typeof candidate === 'string' && candidate.trim().length > 0,
  )

  return displayName?.trim().split(/\s+/)[0] ?? 'İzİmza kullanıcısı'
})
const isInitialLoading = computed(
  () => !summary.value && (status.value === 'idle' || isLoading.value),
)
const hasInitialError = computed(
  () => !summary.value && status.value === 'error',
)
const storageProgress = computed(() => {
  if (!summary.value || summary.value.storageLimitMb <= 0) {
    return 0
  }

  return Math.min(
    100,
    (summary.value.storageUsedMb / summary.value.storageLimitMb) * 100,
  )
})

const formatMegabytes = (value: number) => {
  if (value >= 1024) {
    return `${numberFormatter.format(value / 1024)} GB`
  }

  return `${numberFormatter.format(value)} MB`
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${numberFormatter.format(bytes / 1024)} KB`
  }

  return `${numberFormatter.format(bytes / (1024 * 1024))} MB`
}

const operationLabels: Record<DocumentOperation, string> = {
  signature: 'E-imza',
  timestamp: 'Zaman damgası',
}

const showFeedback = (message: string) => {
  actionMessage.value = message

  if (feedbackTimer) {
    clearTimeout(feedbackTimer)
  }

  feedbackTimer = setTimeout(() => {
    actionMessage.value = ''
  }, 4_000)
}

const previewDocument = (document: ArchivedDocument) => {
  if (!document.canPreview) {
    return
  }

  showFeedback(`${document.name} için güvenli önizleme hazırlanıyor.`)
}

const downloadDocument = (document: ArchivedDocument) => {
  showFeedback(`${document.name} için indirme isteği oluşturuldu.`)
}

onMounted(() => {
  if (status.value === 'idle') {
    void dashboardStore.fetchDashboard()
  }
})

onBeforeUnmount(() => {
  if (feedbackTimer) {
    clearTimeout(feedbackTimer)
  }
})
</script>

<template>
  <section class="dashboard" aria-labelledby="dashboard-title">
    <header class="dashboard__header">
      <div>
        <p class="dashboard__date">{{ todayLabel }}</p>
        <h1 id="dashboard-title">Merhaba, {{ greetingName }}</h1>
        <p class="dashboard__intro">
          Dijital işlemlerinizin özeti ve güvenli işlem araçlarınız burada.
        </p>
      </div>

      <button
        class="dashboard__refresh"
        type="button"
        :disabled="isLoading"
        @click="dashboardStore.fetchDashboard"
      >
        <AppIcon name="refresh" :size="18" />
        {{ isLoading ? 'Yenileniyor…' : 'Verileri yenile' }}
      </button>
    </header>

    <div
      v-if="errorMessage && summary"
      class="dashboard__notice"
      role="alert"
    >
      <span>{{ errorMessage }}</span>
      <button type="button" @click="dashboardStore.fetchDashboard">
        Tekrar dene
      </button>
    </div>

    <div
      v-if="isInitialLoading"
      class="dashboard__loading"
      aria-label="Dashboard verileri yükleniyor"
      aria-busy="true"
    >
      <div class="dashboard__metric-skeletons">
        <span v-for="index in 4" :key="index"></span>
      </div>
      <span class="dashboard__feature-skeleton"></span>
      <span class="dashboard__table-skeleton"></span>
    </div>

    <div v-else-if="hasInitialError" class="dashboard__recovery" role="alert">
      <span class="dashboard__recovery-icon" aria-hidden="true">!</span>
      <div>
        <h2>İşlem merkezi yüklenemedi</h2>
        <p>{{ errorMessage }}</p>
      </div>
      <button type="button" @click="dashboardStore.fetchDashboard">
        Yeniden dene
      </button>
    </div>

    <template v-else-if="summary">
      <section class="dashboard__metrics" aria-label="Hesap özeti">
        <DashboardMetricCard
          label="İmzalanan belge"
          :value="numberFormatter.format(summary.totalSignedDocuments)"
          detail="Tüm zamanlardaki işlemler"
          icon="signature"
          tone="navy"
        />
        <DashboardMetricCard
          label="Arşivdeki kayıt"
          :value="numberFormatter.format(summary.archivedDocumentCount)"
          detail="Güvenle saklanan doküman"
          icon="archive"
          tone="violet"
        />
        <DashboardMetricCard
          label="Kullanılabilir kontör"
          :value="numberFormatter.format(summary.remainingCredits)"
          detail="Her zaman damgası 1 kontör"
          icon="wallet"
          tone="green"
        />
        <DashboardMetricCard
          label="Arşiv kapasitesi"
          :value="formatMegabytes(summary.storageUsedMb)"
          :detail="`${formatMegabytes(summary.storageLimitMb)} toplam alan`"
          :progress="storageProgress"
          icon="storage"
          tone="blue"
        />
      </section>

      <section class="dashboard__feature-grid" aria-label="Hızlı işlemler">
        <article class="dashboard__quick-action">
          <div class="dashboard__quick-copy">
            <span class="dashboard__quick-badge">
              <span aria-hidden="true"></span>
              En hızlı işlem
            </span>
            <h2>Belgenizin zamanını şimdi kanıtlayın.</h2>
            <p>
              Dosyanızı yükleyin; bütünlük kontrolü, zaman damgası ve arşiv
              kaydını tek bir güvenli akışta tamamlayın.
            </p>
          </div>

          <RouterLink
            class="dashboard__upload-link"
            :to="{ name: 'timestamp' }"
          >
            <span class="dashboard__upload-icon" aria-hidden="true">
              <AppIcon name="upload" :size="24" />
            </span>
            <span>
              <strong>Dosya seçmeye başla</strong>
              <small>Zaman Damgala ekranına ilerle</small>
            </span>
            <AppIcon name="arrow-right" :size="20" />
          </RouterLink>
        </article>

        <aside class="dashboard__trust-chain" aria-labelledby="trust-chain-title">
          <div class="dashboard__trust-heading">
            <span class="dashboard__trust-icon" aria-hidden="true">
              <AppIcon name="timestamp" :size="21" />
            </span>
            <div>
              <small>İzİmza güvencesi</small>
              <h2 id="trust-chain-title">Güven zinciri</h2>
            </div>
          </div>

          <ol>
            <li>
              <span>01</span>
              <div>
                <strong>Dosya bütünlüğü</strong>
                <small>Belgenin dijital özeti hazırlanır.</small>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>Zaman kanıtı</strong>
                <small>İşlem zamanı güvenle kayıt altına alınır.</small>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>Güvenli arşiv</strong>
                <small>Sonuç belgeniz hesabınızda saklanır.</small>
              </div>
            </li>
          </ol>
        </aside>
      </section>

      <section class="dashboard__documents" aria-labelledby="documents-title">
        <header class="dashboard__section-heading">
          <div>
            <p>Yakın geçmiş</p>
            <h2 id="documents-title">Son arşivlenen belgeler</h2>
          </div>
          <span>{{ recentDocuments.length }} kayıt gösteriliyor</span>
        </header>

        <div v-if="recentDocuments.length" class="document-table">
          <div class="document-table__head" aria-hidden="true">
            <span>Belge</span>
            <span>İşlem</span>
            <span>Tarih</span>
            <span>Boyut</span>
            <span>İşlemler</span>
          </div>

          <article
            v-for="document in recentDocuments"
            :key="document.id"
            class="document-table__row"
          >
            <div class="document-table__file" data-label="Belge">
              <span aria-hidden="true">
                <AppIcon name="document" :size="20" />
              </span>
              <div>
                <strong>{{ document.name }}</strong>
                <small>#IZ-{{ String(document.id).padStart(4, '0') }}</small>
              </div>
            </div>
            <div data-label="İşlem">
              <span
                :class="[
                  'document-table__operation',
                  `document-table__operation--${document.operation}`,
                ]"
              >
                {{ operationLabels[document.operation] }}
              </span>
            </div>
            <time :datetime="document.createdAt" data-label="Tarih">
              {{ dateFormatter.format(new Date(document.createdAt)) }}
            </time>
            <span data-label="Boyut">{{ formatFileSize(document.sizeBytes) }}</span>
            <div class="document-table__actions" data-label="İşlemler">
              <button
                type="button"
                :disabled="!document.canPreview"
                :aria-label="`${document.name} belgesini önizle`"
                :title="
                  document.canPreview
                    ? 'Belgeyi önizle'
                    : 'Bu dosya türü önizlenemiyor'
                "
                @click="previewDocument(document)"
              >
                <AppIcon name="eye" :size="18" />
              </button>
              <button
                type="button"
                :aria-label="`${document.name} belgesini indir`"
                title="Belgeyi indir"
                @click="downloadDocument(document)"
              >
                <AppIcon name="download" :size="18" />
              </button>
            </div>
          </article>
        </div>

        <div v-else class="dashboard__empty">
          <span aria-hidden="true">
            <AppIcon name="archive" :size="26" />
          </span>
          <h3>Arşiviniz henüz boş</h3>
          <p>İlk zaman damgası işleminiz tamamlandığında belgeniz burada görünür.</p>
          <RouterLink :to="{ name: 'timestamp' }">İlk işlemi oluştur</RouterLink>
        </div>
      </section>
    </template>

    <Transition name="dashboard-toast">
      <div v-if="actionMessage" class="dashboard__toast" role="status">
        <span aria-hidden="true">✓</span>
        {{ actionMessage }}
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.dashboard {
  display: grid;
  gap: 1.75rem;
  width: min(100%, 90rem);
  margin-inline: auto;
}

.dashboard__header {
  display: flex;
  gap: 2rem;
  align-items: flex-end;
  justify-content: space-between;
}

.dashboard__header p,
.dashboard__header h1,
.dashboard__quick-action h2,
.dashboard__quick-action p,
.dashboard__trust-chain h2,
.dashboard__trust-chain ol,
.dashboard__section-heading p,
.dashboard__section-heading h2,
.dashboard__recovery h2,
.dashboard__recovery p,
.dashboard__empty h3,
.dashboard__empty p {
  margin: 0;
}

.dashboard__date,
.dashboard__section-heading p {
  color: var(--color-accent-600);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.dashboard__date::first-letter {
  text-transform: uppercase;
}

.dashboard__header h1 {
  margin-top: 0.45rem;
  color: var(--color-brand-950);
  font-size: clamp(2rem, 4vw, 3.25rem);
  line-height: 1;
  letter-spacing: -0.055em;
}

.dashboard__intro {
  margin-top: 0.75rem !important;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  line-height: 1.6;
}

.dashboard__refresh,
.dashboard__notice button,
.dashboard__recovery button {
  display: inline-flex;
  gap: 0.55rem;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.7rem 0.9rem;
  color: var(--color-brand-950);
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  transition:
    border-color var(--transition-fast),
    transform var(--transition-fast);
}

.dashboard__refresh:hover:not(:disabled),
.dashboard__notice button:hover,
.dashboard__recovery button:hover {
  border-color: var(--color-accent-600);
  transform: translateY(-1px);
}

.dashboard__refresh:disabled {
  cursor: wait;
  opacity: 0.65;
}

.dashboard__notice {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  color: #8a4b00;
  font-size: 0.78rem;
  font-weight: 700;
  background: #fff8e8;
  border: 1px solid #f6d991;
  border-radius: var(--radius-md);
}

.dashboard__notice button {
  min-height: 2.25rem;
  color: #8a4b00;
  background: #fff;
  border-color: #f6d991;
}

.dashboard__metrics,
.dashboard__metric-skeletons {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.dashboard__feature-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(18rem, 0.65fr);
  gap: 1rem;
}

.dashboard__quick-action {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(16rem, 0.75fr);
  gap: clamp(1.5rem, 4vw, 3rem);
  align-items: center;
  min-height: 20rem;
  padding: clamp(1.5rem, 3vw, 2.5rem);
  overflow: hidden;
  color: var(--color-text-inverse);
  background:
    radial-gradient(circle at 8% 10%, rgb(37 99 235 / 42%), transparent 34%),
    radial-gradient(circle at 95% 90%, rgb(15 159 132 / 32%), transparent 35%),
    var(--color-brand-950);
  border-radius: var(--radius-lg);
  box-shadow: 0 20px 45px rgb(16 42 67 / 16%);
}

.dashboard__quick-action::before,
.dashboard__quick-action::after {
  position: absolute;
  content: '';
  border: 1px solid rgb(255 255 255 / 9%);
  border-radius: 50%;
}

.dashboard__quick-action::before {
  top: -8rem;
  right: 16%;
  width: 20rem;
  height: 20rem;
}

.dashboard__quick-action::after {
  right: -5rem;
  bottom: -8rem;
  width: 18rem;
  height: 18rem;
}

.dashboard__quick-copy,
.dashboard__upload-link {
  position: relative;
  z-index: 1;
}

.dashboard__quick-badge {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
  width: fit-content;
  padding: 0.45rem 0.65rem;
  color: #bff4e9;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background: rgb(15 159 132 / 16%);
  border: 1px solid rgb(82 224 197 / 18%);
  border-radius: 999px;
}

.dashboard__quick-badge span {
  width: 0.45rem;
  height: 0.45rem;
  background: #52e0c5;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgb(82 224 197 / 12%);
}

.dashboard__quick-action h2 {
  max-width: 34rem;
  margin-top: 1.25rem;
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  line-height: 1.14;
  letter-spacing: -0.05em;
}

.dashboard__quick-action p {
  max-width: 34rem;
  margin-top: 1rem;
  color: rgb(255 255 255 / 68%);
  font-size: 0.83rem;
  line-height: 1.75;
}

.dashboard__upload-link {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.875rem;
  align-items: center;
  min-height: 8.5rem;
  padding: 1.25rem;
  color: var(--color-brand-950);
  text-decoration: none;
  background: rgb(255 255 255 / 94%);
  border: 1px solid rgb(255 255 255 / 55%);
  border-radius: var(--radius-lg);
  box-shadow: 0 16px 35px rgb(0 0 0 / 15%);
  transition:
    background-color var(--transition-fast),
    transform var(--transition-fast);
}

.dashboard__upload-link:hover {
  background: #fff;
  transform: translateY(-3px);
}

.dashboard__upload-icon {
  display: grid;
  width: 3.25rem;
  height: 3.25rem;
  place-items: center;
  color: var(--color-accent-600);
  background: var(--color-accent-100);
  border-radius: 1rem;
}

.dashboard__upload-link > span:nth-child(2) {
  display: grid;
  gap: 0.35rem;
}

.dashboard__upload-link strong {
  font-size: 0.86rem;
}

.dashboard__upload-link small {
  color: var(--color-text-secondary);
  font-size: 0.68rem;
  font-weight: 600;
}

.dashboard__trust-chain {
  display: grid;
  align-content: start;
  padding: 1.5rem;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.dashboard__trust-heading {
  display: flex;
  gap: 0.875rem;
  align-items: center;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--color-border);
}

.dashboard__trust-icon {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  color: var(--color-accent-600);
  background: var(--color-accent-100);
  border-radius: 0.875rem;
}

.dashboard__trust-heading small {
  color: var(--color-text-secondary);
  font-size: 0.65rem;
  font-weight: 700;
}

.dashboard__trust-heading h2 {
  margin-top: 0.2rem;
  color: var(--color-brand-950);
  font-size: 1rem;
}

.dashboard__trust-chain ol {
  display: grid;
  padding: 0;
  list-style: none;
}

.dashboard__trust-chain li {
  position: relative;
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr);
  gap: 0.75rem;
  padding-top: 1.25rem;
}

.dashboard__trust-chain li:not(:last-child)::after {
  position: absolute;
  top: 3.2rem;
  bottom: -0.85rem;
  left: 0.95rem;
  width: 1px;
  content: '';
  background: var(--color-border);
}

.dashboard__trust-chain li > span {
  display: grid;
  z-index: 1;
  width: 2rem;
  height: 2rem;
  place-items: center;
  color: var(--color-accent-600);
  font-size: 0.62rem;
  font-weight: 800;
  background: var(--color-accent-100);
  border: 3px solid var(--color-surface-raised);
  border-radius: 50%;
}

.dashboard__trust-chain li div {
  display: grid;
  gap: 0.2rem;
  padding-top: 0.25rem;
}

.dashboard__trust-chain li strong {
  color: var(--color-brand-950);
  font-size: 0.76rem;
}

.dashboard__trust-chain li small {
  color: var(--color-text-secondary);
  font-size: 0.66rem;
  line-height: 1.5;
}

.dashboard__documents {
  overflow: hidden;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.dashboard__section-heading {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  justify-content: space-between;
  padding: 1.4rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.dashboard__section-heading h2 {
  margin-top: 0.35rem;
  color: var(--color-brand-950);
  font-size: 1.2rem;
  letter-spacing: -0.025em;
}

.dashboard__section-heading > span {
  color: var(--color-text-secondary);
  font-size: 0.68rem;
  font-weight: 700;
}

.document-table__head,
.document-table__row {
  display: grid;
  grid-template-columns: minmax(15rem, 2fr) minmax(8rem, 0.8fr) minmax(10rem, 1fr) minmax(5rem, 0.55fr) 5rem;
  gap: 1rem;
  align-items: center;
  padding-inline: 1.5rem;
}

.document-table__head {
  min-height: 2.8rem;
  color: var(--color-text-secondary);
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background: var(--color-surface-canvas);
}

.document-table__row {
  min-height: 5.25rem;
  color: var(--color-text-secondary);
  font-size: 0.74rem;
}

.document-table__row + .document-table__row {
  border-top: 1px solid var(--color-border);
}

.document-table__file {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  min-width: 0;
}

.document-table__file > span {
  display: grid;
  flex: 0 0 auto;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  color: var(--color-primary-600);
  background: var(--color-primary-100);
  border-radius: 0.75rem;
}

.document-table__file > div {
  display: grid;
  min-width: 0;
  gap: 0.2rem;
}

.document-table__file strong {
  overflow: hidden;
  color: var(--color-brand-950);
  font-size: 0.76rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.document-table__file small {
  color: var(--color-text-secondary);
  font-size: 0.63rem;
  font-weight: 600;
}

.document-table__operation {
  display: inline-flex;
  width: fit-content;
  padding: 0.38rem 0.55rem;
  font-size: 0.65rem;
  font-weight: 800;
  border-radius: 999px;
}

.document-table__operation--timestamp {
  color: var(--color-success);
  background: var(--color-accent-100);
}

.document-table__operation--signature {
  color: #6141c0;
  background: #f0ebff;
}

.document-table__actions {
  display: flex;
  gap: 0.35rem;
  justify-content: flex-end;
}

.document-table__actions button {
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  color: var(--color-text-secondary);
  cursor: pointer;
  background: transparent;
  border-radius: 0.5rem;
}

.document-table__actions button:hover:not(:disabled) {
  color: var(--color-brand-950);
  background: var(--color-surface-subtle);
}

.document-table__actions button:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}

.dashboard__empty {
  display: grid;
  justify-items: center;
  padding: 3rem 1.5rem;
  text-align: center;
}

.dashboard__empty > span {
  display: grid;
  width: 3.5rem;
  height: 3.5rem;
  place-items: center;
  color: var(--color-accent-600);
  background: var(--color-accent-100);
  border-radius: 1rem;
}

.dashboard__empty h3 {
  margin-top: 1rem;
  color: var(--color-brand-950);
  font-size: 1rem;
}

.dashboard__empty p {
  max-width: 28rem;
  margin-top: 0.5rem;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  line-height: 1.6;
}

.dashboard__empty a {
  margin-top: 1.25rem;
  padding: 0.65rem 0.85rem;
  color: var(--color-text-inverse);
  font-size: 0.72rem;
  font-weight: 800;
  text-decoration: none;
  background: var(--color-brand-950);
  border-radius: var(--radius-sm);
}

.dashboard__recovery {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: center;
  min-height: 13rem;
  padding: 2rem;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.dashboard__recovery-icon {
  display: grid;
  width: 3rem;
  height: 3rem;
  place-items: center;
  color: var(--color-danger);
  font-weight: 800;
  background: #fff0f1;
  border-radius: 50%;
}

.dashboard__recovery h2 {
  color: var(--color-brand-950);
  font-size: 1rem;
}

.dashboard__recovery p {
  margin-top: 0.4rem;
  color: var(--color-text-secondary);
  font-size: 0.76rem;
  line-height: 1.55;
}

.dashboard__loading {
  display: grid;
  gap: 1rem;
}

.dashboard__metric-skeletons span,
.dashboard__feature-skeleton,
.dashboard__table-skeleton {
  display: block;
  background: linear-gradient(
    100deg,
    var(--color-surface-subtle) 25%,
    #f8fafc 40%,
    var(--color-surface-subtle) 58%
  );
  background-size: 200% 100%;
  border-radius: var(--radius-lg);
  animation: dashboard-shimmer 1.3s infinite linear;
}

.dashboard__metric-skeletons span {
  height: 10.75rem;
}

.dashboard__feature-skeleton {
  height: 20rem;
}

.dashboard__table-skeleton {
  height: 17rem;
}

.dashboard__toast {
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  z-index: 50;
  display: flex;
  gap: 0.65rem;
  align-items: center;
  max-width: min(25rem, calc(100vw - 2rem));
  padding: 0.85rem 1rem;
  color: var(--color-brand-950);
  font-size: 0.73rem;
  font-weight: 700;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 18px 40px rgb(16 42 67 / 16%);
}

.dashboard__toast span {
  display: grid;
  width: 1.6rem;
  height: 1.6rem;
  place-items: center;
  color: var(--color-text-inverse);
  background: var(--color-accent-600);
  border-radius: 50%;
}

.dashboard-toast-enter-active,
.dashboard-toast-leave-active {
  transition:
    opacity var(--transition-fast),
    transform var(--transition-fast);
}

.dashboard-toast-enter-from,
.dashboard-toast-leave-to {
  opacity: 0;
  transform: translateY(0.75rem);
}

@keyframes dashboard-shimmer {
  to {
    background-position-x: -200%;
  }
}

@media (max-width: 79.99rem) {
  .dashboard__metrics,
  .dashboard__metric-skeletons {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard__feature-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .dashboard__trust-chain ol {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
  }

  .dashboard__trust-chain li:not(:last-child)::after {
    display: none;
  }

  .document-table__head,
  .document-table__row {
    grid-template-columns: minmax(13rem, 1.7fr) minmax(7rem, 0.8fr) minmax(9rem, 1fr) 5rem;
  }

  .document-table__head > span:nth-child(4),
  .document-table__row > [data-label='Boyut'] {
    display: none;
  }
}

@media (max-width: 47.99rem) {
  .dashboard {
    gap: 1.25rem;
  }

  .dashboard__header {
    display: grid;
    gap: 1.25rem;
    align-items: start;
  }

  .dashboard__refresh {
    width: fit-content;
  }

  .dashboard__metrics,
  .dashboard__metric-skeletons {
    grid-template-columns: minmax(0, 1fr);
  }

  .dashboard__quick-action {
    grid-template-columns: minmax(0, 1fr);
    min-height: auto;
  }

  .dashboard__trust-chain ol {
    grid-template-columns: minmax(0, 1fr);
  }

  .dashboard__trust-chain li:not(:last-child)::after {
    display: block;
  }

  .dashboard__section-heading {
    align-items: start;
  }

  .dashboard__section-heading > span {
    display: none;
  }

  .document-table__head {
    display: none;
  }

  .document-table__row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.85rem 1rem;
    padding-block: 1.1rem;
  }

  .document-table__file {
    grid-column: 1 / -1;
  }

  .document-table__row > time,
  .document-table__row > [data-label='Boyut'] {
    display: block;
    grid-column: 1;
    font-size: 0.68rem;
  }

  .document-table__row > time::before,
  .document-table__row > [data-label='Boyut']::before {
    margin-right: 0.35rem;
    color: var(--color-brand-950);
    content: attr(data-label) ':';
    font-weight: 800;
  }

  .document-table__row > [data-label='İşlem'] {
    grid-column: 1;
  }

  .document-table__actions {
    grid-row: 2 / span 3;
    grid-column: 2;
    align-self: center;
  }

  .dashboard__recovery {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .dashboard__recovery button {
    grid-column: 1 / -1;
    width: fit-content;
  }

  .dashboard__toast {
    right: 1rem;
    bottom: 1rem;
  }
}
</style>
