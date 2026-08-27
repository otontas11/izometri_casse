import type { Meta, StoryObj } from '@storybook/vue3-vite'

import DashboardMetricCard from './DashboardMetricCard.vue'

const dashboardMetricCardMeta = {
  args: {
    detail: 'Tüm zamanlardaki işlemler',
    icon: 'signature',
    label: 'İmzalanan belge',
    metricValue: '8',
    tone: 'navy',
  },
  component: DashboardMetricCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Bileşenler/Dashboard/Özet Kartı',
} satisfies Meta<typeof DashboardMetricCard>

export default dashboardMetricCardMeta

type DashboardMetricCardStory = StoryObj<typeof dashboardMetricCardMeta>

export const SignedDocuments: DashboardMetricCardStory = {
  name: 'İmzalanan Belgeler',
}

export const AvailableCredits: DashboardMetricCardStory = {
  args: {
    detail: 'Her zaman damgası 1 kontör',
    icon: 'wallet',
    label: 'Kullanılabilir kontör',
    metricValue: '18',
    tone: 'green',
  },
  name: 'Kullanılabilir Kontör',
}

export const ArchiveCapacity: DashboardMetricCardStory = {
  args: {
    detail: '1 GB toplam alan',
    icon: 'storage',
    label: 'Arşiv kapasitesi',
    metricValue: '430 MB',
    progress: 42,
    tone: 'blue',
  },
  name: 'Arşiv Kapasitesi',
}
