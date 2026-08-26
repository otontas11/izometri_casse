<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'
import { storeToRefs } from 'pinia'

import AppIcon from '@/components/common/AppIcon.vue'
import DashboardMetricCard from '@/features/dashboard/components/DashboardMetricCard.vue'
import DashboardQuickActionsPanel from '@/features/dashboard/components/DashboardQuickActionsPanel.vue'
import RecentDocumentsTable from '@/features/dashboard/components/RecentDocumentsTable.vue'
import { useDashboardStore } from '@/features/dashboard/stores/dashboard.store'

const dashboardStore = useDashboardStore()
const {
  dashboardErrorMessage,
  dashboardRequestStatus,
  dashboardSummary,
  isDashboardLoading,
  recentDocuments,
} = storeToRefs(dashboardStore)
const { user: authenticatedUser } = useAuth0()

const dashboardNumberFormatter = new Intl.NumberFormat('tr-TR', {
  maximumFractionDigits: 1,
})
const currentDateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  weekday: 'long',
})

const formattedCurrentDate = currentDateFormatter.format(new Date())
const authenticatedUserFirstName = computed(() => {
  const authProfileNameCandidates = [
    authenticatedUser.value?.given_name,
    authenticatedUser.value?.name,
    authenticatedUser.value?.nickname,
    authenticatedUser.value?.email,
  ]
  const authenticatedUserDisplayName = authProfileNameCandidates.find(
    (authProfileName): authProfileName is string =>
      typeof authProfileName === 'string' && authProfileName.trim().length > 0,
  )

  return (
    authenticatedUserDisplayName?.trim().split(/\s+/)[0] ??
    'İzİmza kullanıcısı'
  )
})
const isInitialDashboardLoading = computed(
  () =>
    !dashboardSummary.value &&
    (dashboardRequestStatus.value === 'idle' || isDashboardLoading.value),
)
const hasInitialDashboardError = computed(
  () =>
    !dashboardSummary.value && dashboardRequestStatus.value === 'error',
)
const archiveStorageUsagePercentage = computed(() => {
  if (
    !dashboardSummary.value ||
    dashboardSummary.value.storageLimitMb <= 0
  ) {
    return 0
  }

  return Math.min(
    100,
    (dashboardSummary.value.storageUsedMb /
      dashboardSummary.value.storageLimitMb) *
      100,
  )
})

const formatStorageSize = (storageSizeInMegabytes: number) => {
  if (storageSizeInMegabytes >= 1024) {
    return `${dashboardNumberFormatter.format(storageSizeInMegabytes / 1024)} GB`
  }

  return `${dashboardNumberFormatter.format(storageSizeInMegabytes)} MB`
}

const handleDashboardRefresh = () => {
  void dashboardStore.fetchDashboardData()
}

onMounted(() => {
  if (dashboardRequestStatus.value === 'idle') {
    void dashboardStore.fetchDashboardData()
  }
})
</script>

<template>
  <section class="dashboard-page" aria-labelledby="dashboard-page-title">
    <header class="dashboard-page__header">
      <div>
        <p class="dashboard-page__date">{{ formattedCurrentDate }}</p>
        <h1 id="dashboard-page-title">
          Merhaba, {{ authenticatedUserFirstName }}
        </h1>
        <p class="dashboard-page__introduction">
          Dijital işlemlerinizin özeti ve güvenli işlem araçlarınız burada.
        </p>
      </div>

      <button
        class="dashboard-page__refresh-button"
        type="button"
        :disabled="isDashboardLoading"
        @click="handleDashboardRefresh"
      >
        <AppIcon name="refresh" :size="18" />
        {{ isDashboardLoading ? 'Yenileniyor…' : 'Verileri yenile' }}
      </button>
    </header>

    <div
      v-if="dashboardErrorMessage && dashboardSummary"
      class="dashboard-page__warning-notice"
      role="alert"
    >
      <span>{{ dashboardErrorMessage }}</span>
      <button type="button" @click="handleDashboardRefresh">Tekrar dene</button>
    </div>

    <div
      v-if="isInitialDashboardLoading"
      class="dashboard-page__loading-state"
      aria-label="Dashboard verileri yükleniyor"
      aria-busy="true"
    >
      <div class="dashboard-page__metric-skeletons">
        <span v-for="skeletonIndex in 4" :key="skeletonIndex"></span>
      </div>
      <span class="dashboard-page__feature-skeleton"></span>
      <span class="dashboard-page__table-skeleton"></span>
    </div>

    <div
      v-else-if="hasInitialDashboardError"
      class="dashboard-page__error-state"
      role="alert"
    >
      <span class="dashboard-page__error-icon" aria-hidden="true">!</span>
      <div>
        <h2>İşlem merkezi yüklenemedi</h2>
        <p>{{ dashboardErrorMessage }}</p>
      </div>
      <button type="button" @click="handleDashboardRefresh">
        Yeniden dene
      </button>
    </div>

    <template v-else-if="dashboardSummary">
      <section class="dashboard-page__metrics" aria-label="Hesap özeti">
        <DashboardMetricCard
          label="İmzalanan belge"
          :value="
            dashboardNumberFormatter.format(
              dashboardSummary.totalSignedDocuments,
            )
          "
          detail="Tüm zamanlardaki işlemler"
          icon="signature"
          tone="navy"
        />
        <DashboardMetricCard
          label="Arşivdeki kayıt"
          :value="
            dashboardNumberFormatter.format(
              dashboardSummary.archivedDocumentCount,
            )
          "
          detail="Güvenle saklanan doküman"
          icon="archive"
          tone="violet"
        />
        <DashboardMetricCard
          label="Kullanılabilir kontör"
          :value="
            dashboardNumberFormatter.format(dashboardSummary.remainingCredits)
          "
          detail="Her zaman damgası 1 kontör"
          icon="wallet"
          tone="green"
        />
        <DashboardMetricCard
          label="Arşiv kapasitesi"
          :value="formatStorageSize(dashboardSummary.storageUsedMb)"
          :detail="`${formatStorageSize(
            dashboardSummary.storageLimitMb,
          )} toplam alan`"
          :progress="archiveStorageUsagePercentage"
          icon="storage"
          tone="blue"
        />
      </section>

      <DashboardQuickActionsPanel />

      <RecentDocumentsTable :archived-documents="recentDocuments" />
    </template>
  </section>
</template>

<style scoped>
.dashboard-page {
  display: grid;
  gap: 1.75rem;
  width: min(100%, 90rem);
  margin-inline: auto;
}

.dashboard-page__header {
  display: flex;
  gap: 2rem;
  align-items: flex-end;
  justify-content: space-between;
}

.dashboard-page__header p,
.dashboard-page__header h1,
.dashboard-page__error-state h2,
.dashboard-page__error-state p {
  margin: 0;
}

.dashboard-page__date {
  color: var(--color-accent-600);
  font-size: var(--font-size-small);
  font-weight: 800;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.dashboard-page__date::first-letter {
  text-transform: uppercase;
}

.dashboard-page__header h1 {
  margin-top: 0.45rem;
  color: var(--color-brand-950);
  font-size: clamp(2rem, 4vw, 3.25rem);
  line-height: 1;
  letter-spacing: -0.055em;
}

.dashboard-page__introduction {
  margin-top: 0.75rem !important;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  line-height: 1.6;
}

.dashboard-page__refresh-button,
.dashboard-page__warning-notice button,
.dashboard-page__error-state button {
  display: inline-flex;
  gap: 0.55rem;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.7rem 0.9rem;
  color: var(--color-brand-950);
  font-size: var(--font-size-small);
  font-weight: 800;
  cursor: pointer;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  transition:
    border-color var(--transition-fast),
    transform var(--transition-fast);
}

.dashboard-page__refresh-button:hover:not(:disabled),
.dashboard-page__warning-notice button:hover,
.dashboard-page__error-state button:hover {
  border-color: var(--color-accent-600);
  transform: translateY(-1px);
}

.dashboard-page__refresh-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.dashboard-page__warning-notice {
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

.dashboard-page__warning-notice button {
  min-height: 2.25rem;
  color: #8a4b00;
  background: #fff;
  border-color: #f6d991;
}

.dashboard-page__metrics,
.dashboard-page__metric-skeletons {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.dashboard-page__error-state {
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

.dashboard-page__error-icon {
  display: grid;
  width: 3rem;
  height: 3rem;
  place-items: center;
  color: var(--color-danger);
  font-weight: 800;
  background: #fff0f1;
  border-radius: 50%;
}

.dashboard-page__error-state h2 {
  color: var(--color-brand-950);
  font-size: 1rem;
}

.dashboard-page__error-state p {
  margin-top: 0.4rem;
  color: var(--color-text-secondary);
  font-size: 0.76rem;
  line-height: 1.55;
}

.dashboard-page__loading-state {
  display: grid;
  gap: 1rem;
}

.dashboard-page__metric-skeletons span,
.dashboard-page__feature-skeleton,
.dashboard-page__table-skeleton {
  display: block;
  background: linear-gradient(
    100deg,
    var(--color-surface-subtle) 25%,
    #f8fafc 40%,
    var(--color-surface-subtle) 58%
  );
  background-size: 200% 100%;
  border-radius: var(--radius-lg);
  animation: dashboard-page-shimmer 1.3s infinite linear;
}

.dashboard-page__metric-skeletons span {
  height: 10.75rem;
}

.dashboard-page__feature-skeleton {
  height: 20rem;
}

.dashboard-page__table-skeleton {
  height: 17rem;
}

@keyframes dashboard-page-shimmer {
  to {
    background-position-x: -200%;
  }
}

@media (max-width: 79.99rem) {
  .dashboard-page__metrics,
  .dashboard-page__metric-skeletons {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 47.99rem) {
  .dashboard-page {
    gap: 1.25rem;
  }

  .dashboard-page__header {
    display: grid;
    gap: 1.25rem;
    align-items: start;
  }

  .dashboard-page__refresh-button {
    width: fit-content;
  }

  .dashboard-page__metrics,
  .dashboard-page__metric-skeletons {
    grid-template-columns: minmax(0, 1fr);
  }

  .dashboard-page__error-state {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .dashboard-page__error-state button {
    grid-column: 1 / -1;
    width: fit-content;
  }
}
</style>
