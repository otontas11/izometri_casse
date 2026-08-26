const path = require('node:path')

const jsonServer = require('json-server')

const DEFAULT_JSON_SERVER_PORT = 3001
const TIMESTAMP_CREDIT_COST = 1
const BYTES_PER_MEGABYTE = 1024 * 1024
const RECENT_DOCUMENT_LIMIT = 5

const jsonServerApplication = jsonServer.create()
const defaultDatabasePath = path.join(__dirname, 'db.json')
const configuredDatabasePath = process.env.JSON_SERVER_DATABASE_PATH
const databasePath = configuredDatabasePath
  ? path.resolve(configuredDatabasePath)
  : defaultDatabasePath
const jsonServerRouter = jsonServer.router(databasePath)
const database = jsonServerRouter.db
const serverPort = Number.parseInt(
  process.env.PORT || String(DEFAULT_JSON_SERVER_PORT),
  10,
)

const getNextNumericRecordId = (records) =>
  records.reduce((largestRecordId, record) => {
    const numericRecordId = Number(record.id)

    return Number.isFinite(numericRecordId)
      ? Math.max(largestRecordId, numericRecordId)
      : largestRecordId
  }, 0) + 1

const isNonEmptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0

const isValidTimestampTransactionPayload = (requestPayload) =>
  requestPayload &&
  isNonEmptyString(requestPayload.fileName) &&
  Number.isSafeInteger(requestPayload.fileSize) &&
  requestPayload.fileSize > 0 &&
  (requestPayload.mimeType === undefined ||
    isNonEmptyString(requestPayload.mimeType))

const createTimestampTransaction = (requestPayload) => {
  const dashboardSummary = database.get('dashboard').value()
  const archivedDocuments = database.get('documents').value()
  const timestampJobs = database.get('timestampJobs').value()

  if (
    !dashboardSummary ||
    !Array.isArray(archivedDocuments) ||
    !Array.isArray(timestampJobs)
  ) {
    throw new Error('Fake API veritabanı zaman damgası işlemi için hazır değil.')
  }

  if (dashboardSummary.remainingCredits < TIMESTAMP_CREDIT_COST) {
    return {
      errorResponse: {
        error: 'INSUFFICIENT_CREDITS',
        message:
          'Zaman damgalama işlemi için yeterli kontörünüz bulunmuyor.',
        statusCode: 409,
      },
    }
  }

  const transactionDate = new Date().toISOString()
  const normalizedMimeType =
    requestPayload.mimeType?.trim() || 'application/octet-stream'
  const timestampJob = {
    id: getNextNumericRecordId(timestampJobs),
    completedAt: transactionDate,
    createdAt: transactionDate,
    creditCost: TIMESTAMP_CREDIT_COST,
    fileName: requestPayload.fileName.trim(),
    fileSize: requestPayload.fileSize,
    mimeType: normalizedMimeType,
    status: 'completed',
  }
  const archivedDocument = {
    id: getNextNumericRecordId(archivedDocuments),
    canPreview: normalizedMimeType === 'application/pdf',
    createdAt: transactionDate,
    name: timestampJob.fileName,
    operation: 'timestamp',
    sizeBytes: timestampJob.fileSize,
  }
  const updatedDashboardSummary = {
    ...dashboardSummary,
    archivedDocumentCount: dashboardSummary.archivedDocumentCount + 1,
    remainingCredits:
      dashboardSummary.remainingCredits - TIMESTAMP_CREDIT_COST,
    storageUsedMb: Number(
      (
        dashboardSummary.storageUsedMb +
        timestampJob.fileSize / BYTES_PER_MEGABYTE
      ).toFixed(2),
    ),
  }
  const updatedArchivedDocuments = [
    ...archivedDocuments,
    archivedDocument,
  ]
  const updatedTimestampJobs = [...timestampJobs, timestampJob]
  const recentDocuments = [...updatedArchivedDocuments]
    .sort(
      (firstDocument, secondDocument) =>
        new Date(secondDocument.createdAt).getTime() -
        new Date(firstDocument.createdAt).getTime(),
    )
    .slice(0, RECENT_DOCUMENT_LIMIT)

  database
    .assign({
      dashboard: updatedDashboardSummary,
      documents: updatedArchivedDocuments,
      timestampJobs: updatedTimestampJobs,
    })
    .write()

  return {
    transactionResponse: {
      dashboardSummary: updatedDashboardSummary,
      recentDocuments,
      timestampJob,
    },
  }
}

jsonServerApplication.use(jsonServer.defaults())
jsonServerApplication.use(jsonServer.bodyParser)

jsonServerApplication.post('/timestamp-transactions', (request, response) => {
  if (!isValidTimestampTransactionPayload(request.body)) {
    response.status(400).json({
      error: 'INVALID_TIMESTAMP_TRANSACTION',
      message: 'Zaman damgalama için gönderilen dosya bilgileri geçersiz.',
    })
    return
  }

  try {
    const { errorResponse, transactionResponse } = createTimestampTransaction(
      request.body,
    )

    if (errorResponse) {
      response.status(errorResponse.statusCode).json({
        error: errorResponse.error,
        message: errorResponse.message,
      })
      return
    }

    response.status(201).json(transactionResponse)
  } catch (transactionError) {
    response.status(500).json({
      error: 'TIMESTAMP_TRANSACTION_FAILED',
      message:
        transactionError instanceof Error
          ? transactionError.message
          : 'Zaman damgalama işlemi tamamlanamadı.',
    })
  }
})

jsonServerApplication.use(jsonServerRouter)

jsonServerApplication.listen(serverPort, () => {
  console.log(
    `İzİmza fake API ${serverPort} portunda ${databasePath} verisini kullanıyor.`,
  )
})
