<template>
  <section aria-labelledby="dashboard-page-title" class="dashboard-page">
    <header class="dashboard-page__header">
      <div>
        <h1 id="dashboard-page-title">
          {{ t('dashboard.page.greeting', {name: authenticatedUserFirstName}) }}
        </h1>
        <p class="dashboard-page__introduction">
          {{ t('dashboard.page.introduction') }}
        </p>
      </div>

      <button :disabled="isDashboardLoading"
              class="dashboard-page__refresh-button"
              type="button"
              @click="handleDashboardRefresh"
      >
        <AppIcon :size="18" name="refresh"/>
        {{
          isDashboardLoading
              ? t('dashboard.page.refreshing')
              : t('dashboard.page.refreshData')
        }}
      </button>
    </header>

    <div v-if="dashboardErrorMessage && dashboardSummary"
         class="dashboard-page__warning-notice"
         role="alert"
    >
      <span>{{ dashboardErrorMessage }}</span>
      <button type="button" @click="handleDashboardRefresh">
        {{ t('common.retry') }}
      </button>
    </div>

    <div v-if="isInitialDashboardLoading"
         :aria-label="t('dashboard.page.loadingAriaLabel')"
         aria-busy="true"
         class="dashboard-page__loading-state"
    >
      <div class="dashboard-page__metric-skeletons">
        <span v-for="skeletonIndex in 4" :key="skeletonIndex"></span>
      </div>
      <span class="dashboard-page__feature-skeleton"></span>
      <span class="dashboard-page__table-skeleton"></span>
    </div>

    <div v-else-if="hasInitialDashboardError"
         class="dashboard-page__error-state"
         role="alert"
    >
      <span aria-hidden="true" class="dashboard-page__error-icon">!</span>
      <div>
        <h2>{{ t('dashboard.page.loadErrorTitle') }}</h2>
        <p>{{ dashboardErrorMessage }}</p>
      </div>
      <button type="button" @click="handleDashboardRefresh">
        {{ t('dashboard.page.retry') }}
      </button>
    </div>

    <template v-else-if="dashboardSummary">
      <section :aria-label="t('dashboard.page.accountSummaryAriaLabel')"
               class="dashboard-page__metrics"
      >
        <DashboardMetricCard :label="t('dashboard.metrics.signedDocuments')"
                             :metric-value="
            formatDashboardNumber(dashboardSummary.totalSignedDocuments)
          "
                             icon="signature"
                             tone="navy"
        />
        <DashboardMetricCard :label="t('dashboard.metrics.archivedDocuments')"
                             :metric-value="
            formatDashboardNumber(dashboardSummary.archivedDocumentCount)
          "
                             icon="archive"
                             tone="violet"
        />
        <DashboardMetricCard :label="t('dashboard.metrics.availableCredits')"
                             :metric-value="
            formatDashboardNumber(dashboardSummary.remainingCredits)
          "
                             icon="wallet"
                             tone="green"
        />
        <DashboardMetricCard :label="t('dashboard.metrics.archiveCapacity')"
                             :metric-value="formatArchiveStorageSummary(
            dashboardSummary.storageUsedMb,
            dashboardSummary.storageLimitMb,
          )"
                             :progress="archiveStorageUsagePercentage"
                             icon="storage"
                             tone="blue"
        />
      </section>

      <DashboardQuickActionsPanel/>

      <RecentDocumentsTable :archived-documents="recentDocuments"
                            :downloading-document-id="downloadingDocumentId"
                            @download="handleDocumentDownload"
      />
    </template>
  </section>
</template>

<script lang="ts" setup>
import {computed, onMounted} from 'vue'
import {useAuth0} from '@auth0/auth0-vue'
import {storeToRefs} from 'pinia'
import {useI18n} from 'vue-i18n'

import AppIcon from '@/components/common/AppIcon.vue'
import {useToast} from '@/composables/useToast'
import DashboardMetricCard from '@/features/dashboard/components/DashboardMetricCard.vue'
import DashboardQuickActionsPanel from '@/features/dashboard/components/DashboardQuickActionsPanel.vue'
import RecentDocumentsTable from '@/features/dashboard/components/RecentDocumentsTable.vue'
import {useDashboardStore} from '@/features/dashboard/stores/dashboard.store'
import type {ArchivedDocument} from '@/features/dashboard/types/dashboard.types'
import {getApplicationLocaleCode} from '@/locales'

const dashboardStore = useDashboardStore()
const {
  dashboardErrorMessage,
  dashboardRequestStatus,
  dashboardSummary,
  documentDownloadErrorMessage,
  downloadingDocumentId,
  isDashboardLoading,
  recentDocuments,
} = storeToRefs(dashboardStore)
const {user: authenticatedUser} = useAuth0()
const {showErrorToast, showSuccessToast} = useToast()
const {t} = useI18n({useScope: 'global'})

const formatDashboardNumber = (dashboardNumber: number) =>
    new Intl.NumberFormat(getApplicationLocaleCode(), {
      maximumFractionDigits: 1,
    }).format(dashboardNumber)
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
      t('dashboard.page.userFallback')
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

const formatArchiveStorageSummary = (
    usedStorageInMegabytes: number,
    storageLimitInMegabytes: number,
) =>
    `${usedStorageInMegabytes.toFixed(1)} Mb / ${storageLimitInMegabytes.toFixed(0)} Mb`

const handleDashboardRefresh = () => {
  void dashboardStore.fetchDashboardData()
}

const saveDocumentContent = (
    documentContent: Blob,
    documentFileName: string,
) => {
  const documentObjectUrl = URL.createObjectURL(documentContent)
  const documentDownloadLink = document.createElement('a')
  documentDownloadLink.href = documentObjectUrl
  documentDownloadLink.download = documentFileName
  document.body.append(documentDownloadLink)
  documentDownloadLink.click()
  documentDownloadLink.remove()
  window.setTimeout(() => URL.revokeObjectURL(documentObjectUrl), 0)
}

const handleDocumentDownload = async (archivedDocument: ArchivedDocument) => {
  const documentContent = await dashboardStore.downloadArchivedDocument(
      archivedDocument.id,
  )

  if (!documentContent) {
    showErrorToast(
        documentDownloadErrorMessage.value ||
        t('dashboard.recentDocuments.downloadFailed'),
    )
    return
  }

  saveDocumentContent(documentContent, archivedDocument.name)
  showSuccessToast(
      t('dashboard.recentDocuments.downloadRequested', {
        fileName: archivedDocument.name,
      }),
  )
}

onMounted(() => {
  if (dashboardRequestStatus.value === 'idle') {
    void dashboardStore.fetchDashboardData()
  }
})
</script>

<style scoped src="./DashboardPage.css"></style>
