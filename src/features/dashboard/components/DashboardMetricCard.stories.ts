import type { Meta, StoryObj } from '@storybook/vue3-vite'

import DashboardMetricCard from './DashboardMetricCard.vue'

const dashboardMetricCardMeta = {
  args: {
    detail: 'Tüm zamanlardaki işlemler',
    icon: 'signature',
    label: 'İmzalanan belge',
    tone: 'navy',
    value: '8',
  },
  component: DashboardMetricCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Dashboard/DashboardMetricCard',
} satisfies Meta<typeof DashboardMetricCard>

export default dashboardMetricCardMeta

type DashboardMetricCardStory = StoryObj<typeof dashboardMetricCardMeta>

export const SignedDocuments: DashboardMetricCardStory = {}

export const AvailableCredits: DashboardMetricCardStory = {
  args: {
    detail: 'Her zaman damgası 1 kontör',
    icon: 'wallet',
    label: 'Kullanılabilir kontör',
    tone: 'green',
    value: '18',
  },
}

export const ArchiveCapacity: DashboardMetricCardStory = {
  args: {
    detail: '1 GB toplam alan',
    icon: 'storage',
    label: 'Arşiv kapasitesi',
    progress: 42,
    tone: 'blue',
    value: '430 MB',
  },
}
