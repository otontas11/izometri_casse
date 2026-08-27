import type { Meta, StoryObj } from '@storybook/vue3-vite'

import { storybookTimestampJobs } from '@/mocks/storybookApiHandlers'

import TimestampHistoryTable from './TimestampHistoryTable.vue'

const timestampHistoryTableMeta = {
  args: {
    errorMessage: '',
    isLoading: false,
    timestampJobs: storybookTimestampJobs,
  },
  component: TimestampHistoryTable,
  tags: ['autodocs'],
  title: 'Timestamp/TimestampHistoryTable',
} satisfies Meta<typeof TimestampHistoryTable>

export default timestampHistoryTableMeta

type TimestampHistoryTableStory = StoryObj<
  typeof timestampHistoryTableMeta
>

export const WithRecords: TimestampHistoryTableStory = {}

export const Loading: TimestampHistoryTableStory = {
  args: {
    isLoading: true,
    timestampJobs: [],
  },
}

export const Empty: TimestampHistoryTableStory = {
  args: {
    timestampJobs: [],
  },
}

export const ErrorState: TimestampHistoryTableStory = {
  args: {
    errorMessage: 'İşlem geçmişi şu anda yüklenemiyor.',
    timestampJobs: [],
  },
}
