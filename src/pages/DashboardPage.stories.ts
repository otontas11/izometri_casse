import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { delay, http, HttpResponse } from 'msw'

import { useDashboardStore } from '@/features/dashboard/stores/dashboard.store'
import {
  storybookArchivedDocuments,
  storybookDashboardSummary,
} from '@/mocks/storybookApiHandlers'
import { pinia } from '@/stores'

import DashboardPage from './DashboardPage.vue'

const resetDashboardStoryState = () => {
  const dashboardStore = useDashboardStore(pinia)

  dashboardStore.$patch({
    dashboardErrorMessage: '',
    dashboardRequestStatus: 'idle',
    dashboardSummary: null,
    documentDownloadErrorMessage: '',
    downloadingDocumentId: null,
    recentDocuments: [],
  })
}

const dashboardPageMeta = {
  beforeEach: resetDashboardStoryState,
  component: DashboardPage,
  decorators: [
    () => ({
      template:
        '<main style="min-height: 100vh; padding: 2rem; background: var(--color-surface-canvas);"><story /></main>',
    }),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Pages/DashboardPage',
} satisfies Meta<typeof DashboardPage>

export default dashboardPageMeta

type DashboardPageStory = StoryObj<typeof dashboardPageMeta>

export const Loaded: DashboardPageStory = {}

export const EmptyAccount: DashboardPageStory = {
  parameters: {
    msw: [
      http.get('*/dashboard', () =>
        HttpResponse.json({
          ...storybookDashboardSummary,
          archivedDocumentCount: 0,
          storageUsedMb: 0,
          totalSignedDocuments: 0,
        }),
      ),
      http.get('*/documents', () => HttpResponse.json([])),
    ],
  },
}

export const Loading: DashboardPageStory = {
  parameters: {
    msw: [
      http.get('*/dashboard', async () => {
        await delay(60_000)
        return HttpResponse.json(storybookDashboardSummary)
      }),
      http.get('*/documents', async () => {
        await delay(60_000)
        return HttpResponse.json(storybookArchivedDocuments)
      }),
    ],
  },
}

export const ServerError: DashboardPageStory = {
  parameters: {
    msw: [
      http.get('*/dashboard', () =>
        HttpResponse.json(
          { message: 'Dashboard servisine şu anda ulaşılamıyor.' },
          { status: 500 },
        ),
      ),
      http.get('*/documents', () =>
        HttpResponse.json(
          { message: 'Belge servisine şu anda ulaşılamıyor.' },
          { status: 500 },
        ),
      ),
    ],
  },
}
