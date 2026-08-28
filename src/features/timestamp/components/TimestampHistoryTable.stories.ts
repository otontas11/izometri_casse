import type { Meta, StoryObj } from '@storybook/vue3-vite'

import type { TimestampJob } from '../types/timestamp.types'

import TimestampHistoryTable from './TimestampHistoryTable.vue'

const exampleTimestampJobs: TimestampJob[] = [
  {
    completedAt: '2026-08-25T20:42:03.000Z',
    createdAt: '2026-08-25T20:42:00.000Z',
    creditCost: 1,
    fileName: 'tedarik-sozlesmesi-2026.pdf',
    fileSize: 842752,
    id: 1,
    mimeType: 'application/pdf',
    status: 'completed',
  },
  {
    completedAt: null,
    createdAt: '2026-08-26T09:12:00.000Z',
    creditCost: 1,
    fileName: 'teklif-dosyasi.pdf',
    fileSize: 318400,
    id: 2,
    mimeType: 'application/pdf',
    status: 'processing',
  },
]

const timestampHistoryTableMeta = {
  args: {
    errorMessage: '',
    isLoading: false,
    timestampJobs: exampleTimestampJobs,
  },
  component: TimestampHistoryTable,
  tags: ['autodocs'],
  title: 'Bileşenler/Zaman Damgası/İşlem Geçmişi',
} satisfies Meta<typeof TimestampHistoryTable>

export default timestampHistoryTableMeta

type TimestampHistoryTableStory = StoryObj<typeof timestampHistoryTableMeta>

export const WithRecords: TimestampHistoryTableStory = {
  name: 'Kayıtlı',
}

export const Loading: TimestampHistoryTableStory = {
  args: {
    isLoading: true,
    timestampJobs: [],
  },
  name: 'Yükleniyor',
}

export const Empty: TimestampHistoryTableStory = {
  args: {
    timestampJobs: [],
  },
  name: 'Boş',
}

export const ErrorState: TimestampHistoryTableStory = {
  args: {
    errorMessage: 'İşlem geçmişi şu anda yüklenemiyor.',
    timestampJobs: [],
  },
  name: 'Hata',
}
