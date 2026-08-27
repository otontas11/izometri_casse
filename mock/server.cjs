const path = require('node:path')

const jsonServer = require('json-server')
const multer = require('multer')

const DEFAULT_JSON_SERVER_PORT = 3001
const TIMESTAMP_CREDIT_COST = 1
const BYTES_PER_MEGABYTE = 1024 * 1024
const RECENT_DOCUMENT_LIMIT = 5
const MAX_DOCUMENT_FILE_SIZE_BYTES = 25 * BYTES_PER_MEGABYTE
const supportedSignatureFileExtensions = new Set([
  '.avif',
  '.bmp',
  '.gif',
  '.heic',
  '.heif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.mp3',
  '.pdf',
  '.png',
  '.svg',
  '.tif',
  '.tiff',
  '.udf',
  '.webp',
])

const jsonServerApplication = jsonServer.create()
const defaultDatabasePath = path.join(__dirname, 'db.json')
const configuredDatabasePath = process.env.JSON_SERVER_DATABASE_PATH
const databasePath = configuredDatabasePath
  ? path.resolve(configuredDatabasePath)
  : defaultDatabasePath
const jsonServerRouter = jsonServer.router(databasePath)
const database = jsonServerRouter.db
const uploadedDocumentContents = new Map()
const documentFileUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_DOCUMENT_FILE_SIZE_BYTES,
    files: 1,
  },
}).single('file')
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

const isNonEmptyString = (stringCandidate) =>
  typeof stringCandidate === 'string' && stringCandidate.trim().length > 0

const getFileExtension = (fileName) => {
  const extensionSeparatorIndex = fileName.lastIndexOf('.')

  return extensionSeparatorIndex >= 0
    ? fileName.slice(extensionSeparatorIndex).toLowerCase()
    : ''
}

const isSupportedSignatureFileName = (fileName) =>
  supportedSignatureFileExtensions.has(getFileExtension(fileName))

const isValidDocumentTransactionPayload = (requestPayload) =>
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
    archivedDocumentId: archivedDocument.id,
    transactionResponse: {
      dashboardSummary: updatedDashboardSummary,
      recentDocuments,
      timestampJob,
    },
  }
}

const createSignatureTransaction = (requestPayload) => {
  const dashboardSummary = database.get('dashboard').value()
  const archivedDocuments = database.get('documents').value()

  if (!dashboardSummary || !Array.isArray(archivedDocuments)) {
    throw new Error('Fake API veritabanı imzalama işlemi için hazır değil.')
  }

  const transactionDate = new Date().toISOString()
  const signedDocument = {
    id: getNextNumericRecordId(archivedDocuments),
    createdAt: transactionDate,
    name: requestPayload.fileName.trim(),
    operation: 'signature',
    sizeBytes: requestPayload.fileSize,
  }
  const updatedDashboardSummary = {
    ...dashboardSummary,
    archivedDocumentCount: dashboardSummary.archivedDocumentCount + 1,
    storageUsedMb: Number(
      (
        dashboardSummary.storageUsedMb +
        signedDocument.sizeBytes / BYTES_PER_MEGABYTE
      ).toFixed(2),
    ),
    totalSignedDocuments: dashboardSummary.totalSignedDocuments + 1,
  }
  const updatedArchivedDocuments = [...archivedDocuments, signedDocument]
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
    })
    .write()

  return {
    archivedDocumentId: signedDocument.id,
    transactionResponse: {
      dashboardSummary: updatedDashboardSummary,
      recentDocuments,
      signedDocument,
    },
  }
}

jsonServerApplication.use(jsonServer.defaults())
jsonServerApplication.use(jsonServer.bodyParser)

jsonServerApplication.post('/signature-transactions', (request, response) => {
  documentFileUpload(request, response, (fileUploadError) => {
    if (fileUploadError) {
      const isFileTooLarge = fileUploadError.code === 'LIMIT_FILE_SIZE'

      response.status(isFileTooLarge ? 413 : 400).json({
        error: isFileTooLarge
          ? 'SIGNATURE_FILE_TOO_LARGE'
          : 'INVALID_SIGNATURE_TRANSACTION',
        message: isFileTooLarge
          ? 'Dosya boyutu 25 MB sınırını aşamaz.'
          : 'İmzalama için gönderilen dosya okunamadı.',
      })
      return
    }

    const uploadedSignatureFile = request.file
    const signatureTransactionPayload = uploadedSignatureFile
      ? {
          fileName: uploadedSignatureFile.originalname,
          fileSize: uploadedSignatureFile.size,
          mimeType:
            uploadedSignatureFile.mimetype || 'application/octet-stream',
        }
      : null

    if (!isValidDocumentTransactionPayload(signatureTransactionPayload)) {
      response.status(400).json({
        error: 'INVALID_SIGNATURE_TRANSACTION',
        message: 'İmzalama için gönderilen dosya bilgileri geçersiz.',
      })
      return
    }

    if (
      !isSupportedSignatureFileName(signatureTransactionPayload.fileName)
    ) {
      response.status(415).json({
        error: 'UNSUPPORTED_SIGNATURE_FILE_TYPE',
        message:
          'Yalnızca görsel, MP3, UDF ve PDF dosyalarına izin verilir.',
      })
      return
    }

    try {
      const { archivedDocumentId, transactionResponse } =
        createSignatureTransaction(signatureTransactionPayload)

      uploadedDocumentContents.set(archivedDocumentId, {
        content: uploadedSignatureFile.buffer,
        mimeType: signatureTransactionPayload.mimeType,
      })
      response.status(201).json(transactionResponse)
    } catch (transactionError) {
      response.status(500).json({
        error: 'SIGNATURE_TRANSACTION_FAILED',
        message:
          transactionError instanceof Error
            ? transactionError.message
            : 'İmzalama işlemi tamamlanamadı.',
      })
    }
  })
})

jsonServerApplication.post('/timestamp-transactions', (request, response) => {
  documentFileUpload(request, response, (fileUploadError) => {
    if (fileUploadError) {
      const isFileTooLarge = fileUploadError.code === 'LIMIT_FILE_SIZE'

      response.status(isFileTooLarge ? 413 : 400).json({
        error: isFileTooLarge
          ? 'TIMESTAMP_FILE_TOO_LARGE'
          : 'INVALID_TIMESTAMP_TRANSACTION',
        message: isFileTooLarge
          ? 'Dosya boyutu 25 MB sınırını aşamaz.'
          : 'Zaman damgalama için gönderilen dosya okunamadı.',
      })
      return
    }

    const uploadedTimestampFile = request.file
    const timestampTransactionPayload = uploadedTimestampFile
      ? {
          fileName: uploadedTimestampFile.originalname,
          fileSize: uploadedTimestampFile.size,
          mimeType:
            uploadedTimestampFile.mimetype || 'application/octet-stream',
        }
      : null

    if (!isValidDocumentTransactionPayload(timestampTransactionPayload)) {
      response.status(400).json({
        error: 'INVALID_TIMESTAMP_TRANSACTION',
        message: 'Zaman damgalama için gönderilen dosya bilgileri geçersiz.',
      })
      return
    }

    try {
      const { archivedDocumentId, errorResponse, transactionResponse } =
        createTimestampTransaction(timestampTransactionPayload)

      if (errorResponse) {
        response.status(errorResponse.statusCode).json({
          error: errorResponse.error,
          message: errorResponse.message,
        })
        return
      }

      uploadedDocumentContents.set(archivedDocumentId, {
        content: uploadedTimestampFile.buffer,
        mimeType: timestampTransactionPayload.mimeType,
      })
      response.status(201).json(transactionResponse)
    } catch (transactionError) {
      response.status(500).json({
        error: 'SIGNATURE_TRANSACTION_FAILED',
        message:
          transactionError instanceof Error
            ? transactionError.message
            : 'İmzalama işlemi tamamlanamadı.',
      })
    }
  })
})

jsonServerApplication.get('/documents/:documentId/download', (request, response) => {
  const documentId = Number.parseInt(request.params.documentId, 10)
  const archivedDocument = database
    .get('documents')
    .find({ id: documentId })
    .value()

  if (!archivedDocument) {
    response.status(404).json({
      error: 'DOCUMENT_NOT_FOUND',
      message: 'İstenen belge bulunamadı.',
    })
    return
  }

  const uploadedDocumentContent = uploadedDocumentContents.get(documentId)
  const documentContent =
    uploadedDocumentContent?.content ??
    Buffer.from(`İzİmza fake arşiv kaydı: ${archivedDocument.name}`, 'utf8')

  response.set({
    'Cache-Control': 'private, no-store',
    'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(archivedDocument.name)}`,
    'Content-Type':
      uploadedDocumentContent?.mimeType || 'application/octet-stream',
  })
  response.send(documentContent)
})

jsonServerApplication.use(jsonServerRouter)

jsonServerApplication.listen(serverPort, () => {
  console.log(
    `İzİmza fake API ${serverPort} portunda ${databasePath} verisini kullanıyor.`,
  )
})
