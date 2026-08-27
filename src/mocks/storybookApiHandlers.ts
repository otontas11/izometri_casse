import { http, HttpResponse } from 'msw'

import type {
  ArchivedDocument,
  DashboardSummary,
} from '@/features/dashboard/types/dashboard.types'
import type { UserProfile } from '@/features/profile/types/profile.types'
import type {
  TimestampJob,
  TimestampTransactionResponse,
} from '@/features/timestamp/types/timestamp.types'

export const storybookDashboardSummary: DashboardSummary = {
  archivedDocumentCount: 13,
  remainingCredits: 18,
  storageLimitMb: 1024,
  storageUsedMb: 18.6,
  totalSignedDocuments: 8,
}

export const storybookArchivedDocuments: ArchivedDocument[] = [
  {
    canPreview: true,
    createdAt: '2026-08-25T20:42:00.000Z',
    id: 1,
    name: 'tedarik-sozlesmesi-2026.pdf',
    operation: 'timestamp',
    sizeBytes: 842752,
  },
  {
    canPreview: false,
    createdAt: '2026-08-25T20:21:00.000Z',
    id: 2,
    name: 'fatura-arsivi-agustos.zip',
    operation: 'timestamp',
    sizeBytes: 1456128,
  },
  {
    canPreview: true,
    createdAt: '2026-08-24T12:16:00.000Z',
    id: 3,
    name: 'teklif-formu.pdf',
    operation: 'signature',
    sizeBytes: 524288,
  },
]

export const storybookTimestampJobs: TimestampJob[] = [
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

export const storybookUserProfile: UserProfile = {
  avatarUrl: null,
  email: 'oktay.tontas@example.com',
  firstName: 'Oktay',
  id: 'auth0|storybook-user',
  lastName: 'Tontaş',
  phone: '+90 555 123 45 67',
}

export const storybookApiHandlers = [
  http.get('*/dashboard', () =>
    HttpResponse.json(storybookDashboardSummary),
  ),
  http.get('*/documents', () =>
    HttpResponse.json(storybookArchivedDocuments),
  ),
  http.get('*/documents/:documentId/download', ({ params }) =>
    HttpResponse.text(`Storybook belge içeriği: ${params.documentId}`, {
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    }),
  ),
  http.get('*/timestampJobs', () =>
    HttpResponse.json(storybookTimestampJobs),
  ),
  http.get('*/profile', () => HttpResponse.json(storybookUserProfile)),
  http.patch('*/profile', async ({ request }) => {
    const profileUpdates = (await request.json()) as Partial<UserProfile>

    return HttpResponse.json({
      ...storybookUserProfile,
      ...profileUpdates,
    })
  }),
  http.post('*/timestamp-transactions', async ({ request }) => {
    const timestampFormData = await request.formData()
    const timestampFile = timestampFormData.get('file')

    if (!(timestampFile instanceof File)) {
      return HttpResponse.json(
        {
          error: 'INVALID_TIMESTAMP_TRANSACTION',
          message: 'Zaman damgalama için geçerli bir dosya gönderin.',
        },
        { status: 400 },
      )
    }

    const transactionDate = '2026-08-26T10:30:00.000Z'
    const timestampJob: TimestampJob = {
      completedAt: transactionDate,
      createdAt: transactionDate,
      creditCost: 1,
      fileName: timestampFile.name,
      fileSize: timestampFile.size,
      id: 3,
      mimeType: timestampFile.type || 'application/octet-stream',
      status: 'completed',
    }
    const archivedTimestampDocument: ArchivedDocument = {
      canPreview: timestampJob.mimeType === 'application/pdf',
      createdAt: transactionDate,
      id: timestampJob.id,
      name: timestampJob.fileName,
      operation: 'timestamp',
      sizeBytes: timestampJob.fileSize,
    }
    const timestampTransactionResponse: TimestampTransactionResponse = {
      dashboardSummary: {
        ...storybookDashboardSummary,
        archivedDocumentCount:
          storybookDashboardSummary.archivedDocumentCount + 1,
        remainingCredits: storybookDashboardSummary.remainingCredits - 1,
      },
      recentDocuments: [
        archivedTimestampDocument,
        ...storybookArchivedDocuments,
      ].slice(0, 5),
      timestampJob,
    }

    return HttpResponse.json(timestampTransactionResponse, { status: 201 })
  }),
]
