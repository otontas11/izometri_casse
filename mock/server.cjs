const path = require('node:path')

const jsonServer = require('json-server')
const multer = require('multer')

const DEFAULT_JSON_SERVER_PORT = 3001
const DOCUMENT_TRANSACTION_CREDIT_COST = 1
const BYTES_PER_MEGABYTE = 1024 * 1024
const RECENT_DOCUMENT_LIMIT = 5
const MAX_DOCUMENT_FILE_SIZE_BYTES = 25 * BYTES_PER_MEGABYTE
const supportedDraftFileExtensions = new Set([
  '.avif',
  '.bmp',
  '.doc',
  '.docx',
  '.gif',
  '.heic',
  '.heif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.pdf',
  '.png',
  '.svg',
  '.tif',
  '.tiff',
  '.ubl',
  '.webp',
  '.xml',
])

const jsonServerApplication = jsonServer.create()
const defaultDatabasePath = path.join(__dirname, 'db.json')
const configuredDatabasePath = process.env.JSON_SERVER_DATABASE_PATH
const databasePath = configuredDatabasePath
  ? path.resolve(configuredDatabasePath)
  : defaultDatabasePath
const jsonServerRouter = jsonServer.router(databasePath)
const database = jsonServerRouter.db
const uploadedDraftFileContents = new Map()
const archivedDocumentContents = new Map()
const draftFileUpload = multer({
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

const getFileExtension = (fileName) => {
  const extensionSeparatorIndex = fileName.lastIndexOf('.')

  return extensionSeparatorIndex >= 0
    ? fileName.slice(extensionSeparatorIndex).toLowerCase()
    : ''
}

const isDocumentOperation = (operationCandidate) =>
  operationCandidate === 'signature' || operationCandidate === 'timestamp'

const isSupportedDraftFileName = (fileName) =>
  supportedDraftFileExtensions.has(getFileExtension(fileName))

const createInsufficientCreditsErrorResponse = () => ({
  error: 'INSUFFICIENT_CREDITS',
  message: 'Bu işlem için yeterli kontörünüz bulunmuyor.',
  statusCode: 409,
})

const getRequiredDatabaseCollections = () => {
  const dashboardSummary = database.get('dashboard').value()
  const archivedDocuments = database.get('documents').value()
  const draftFiles = database.get('draftFiles').value()
  const timestampJobs = database.get('timestampJobs').value()

  if (
    !dashboardSummary ||
    !Array.isArray(archivedDocuments) ||
    !Array.isArray(draftFiles) ||
    !Array.isArray(timestampJobs)
  ) {
    throw new Error('Fake API veritabanı işlem için hazır değil.')
  }

  return {
    archivedDocuments,
    dashboardSummary,
    draftFiles,
    timestampJobs,
  }
}

const getRecentDocuments = (archivedDocuments) =>
  [...archivedDocuments]
    .sort(
      (firstDocument, secondDocument) =>
        new Date(secondDocument.createdAt).getTime() -
        new Date(firstDocument.createdAt).getTime(),
    )
    .slice(0, RECENT_DOCUMENT_LIMIT)

const createDraftFile = (uploadedFile, intendedOperation) => {
  const { dashboardSummary, draftFiles } = getRequiredDatabaseCollections()
  const draftFile = {
    id: getNextNumericRecordId(draftFiles),
    createdAt: new Date().toISOString(),
    fileName: uploadedFile.originalname,
    fileSize: uploadedFile.size,
    intendedOperation,
    mimeType: uploadedFile.mimetype || 'application/octet-stream',
    status: 'uploaded',
  }
  const updatedDashboardSummary = {
    ...dashboardSummary,
    storageUsedMb: Number(
      (
        dashboardSummary.storageUsedMb +
        draftFile.fileSize / BYTES_PER_MEGABYTE
      ).toFixed(2),
    ),
  }

  database
    .assign({
      dashboard: updatedDashboardSummary,
      draftFiles: [...draftFiles, draftFile],
    })
    .write()
  uploadedDraftFileContents.set(draftFile.id, {
    content: uploadedFile.buffer,
    mimeType: draftFile.mimeType,
  })

  return draftFile
}

const createDocumentTransaction = (draftFileId, intendedOperation) => {
  const {
    archivedDocuments,
    dashboardSummary,
    draftFiles,
    timestampJobs,
  } = getRequiredDatabaseCollections()
  const draftFile = draftFiles.find(
    ({ id, intendedOperation: draftOperation, status }) =>
      id === draftFileId &&
      draftOperation === intendedOperation &&
      status === 'uploaded',
  )

  if (!draftFile) {
    return {
      errorResponse: {
        error: 'DRAFT_FILE_NOT_AVAILABLE',
        message: 'Taslak dosya bulunamadı veya daha önce işlenmiş.',
        statusCode: 409,
      },
    }
  }

  if (dashboardSummary.remainingCredits < DOCUMENT_TRANSACTION_CREDIT_COST) {
    return {
      errorResponse: createInsufficientCreditsErrorResponse(),
    }
  }

  const transactionDate = new Date().toISOString()
  const archivedDocument = {
    id: getNextNumericRecordId(archivedDocuments),
    createdAt: transactionDate,
    name: draftFile.fileName,
    operation: intendedOperation,
    sizeBytes: draftFile.fileSize,
  }
  const updatedDraftFiles = draftFiles.map((draftFileRecord) =>
    draftFileRecord.id === draftFileId
      ? {
          ...draftFileRecord,
          processedAt: transactionDate,
          status: 'processed',
        }
      : draftFileRecord,
  )
  const updatedArchivedDocuments = [
    ...archivedDocuments,
    archivedDocument,
  ]
  const updatedDashboardSummary = {
    ...dashboardSummary,
    archivedDocumentCount: dashboardSummary.archivedDocumentCount + 1,
    remainingCredits:
      dashboardSummary.remainingCredits - DOCUMENT_TRANSACTION_CREDIT_COST,
    totalSignedDocuments:
      dashboardSummary.totalSignedDocuments +
      (intendedOperation === 'signature' ? 1 : 0),
  }
  const uploadedDraftFileContent = uploadedDraftFileContents.get(draftFileId)

  if (uploadedDraftFileContent) {
    archivedDocumentContents.set(
      archivedDocument.id,
      uploadedDraftFileContent,
    )
  }

  const databaseUpdates = {
    dashboard: updatedDashboardSummary,
    documents: updatedArchivedDocuments,
    draftFiles: updatedDraftFiles,
  }

  if (intendedOperation === 'timestamp') {
    const timestampJob = {
      id: getNextNumericRecordId(timestampJobs),
      completedAt: transactionDate,
      createdAt: transactionDate,
      creditCost: DOCUMENT_TRANSACTION_CREDIT_COST,
      fileName: draftFile.fileName,
      fileSize: draftFile.fileSize,
      mimeType: draftFile.mimeType,
      status: 'completed',
    }
    databaseUpdates.timestampJobs = [...timestampJobs, timestampJob]
    database.assign(databaseUpdates).write()

    return {
      transactionResponse: {
        dashboardSummary: updatedDashboardSummary,
        recentDocuments: getRecentDocuments(updatedArchivedDocuments),
        timestampJob,
      },
    }
  }

  database.assign(databaseUpdates).write()

  return {
    transactionResponse: {
      dashboardSummary: updatedDashboardSummary,
      recentDocuments: getRecentDocuments(updatedArchivedDocuments),
      signedDocument: archivedDocument,
    },
  }
}

const deleteDraftFile = (draftFileId) => {
  const { dashboardSummary, draftFiles } = getRequiredDatabaseCollections()
  const draftFile = draftFiles.find(
    ({ id, status }) => id === draftFileId && status === 'uploaded',
  )

  if (!draftFile) {
    return false
  }

  database
    .assign({
      dashboard: {
        ...dashboardSummary,
        storageUsedMb: Math.max(
          0,
          Number(
            (
              dashboardSummary.storageUsedMb -
              draftFile.fileSize / BYTES_PER_MEGABYTE
            ).toFixed(2),
          ),
        ),
      },
      draftFiles: draftFiles.filter(({ id }) => id !== draftFileId),
    })
    .write()
  uploadedDraftFileContents.delete(draftFileId)
  return true
}

jsonServerApplication.use(jsonServer.defaults())
jsonServerApplication.use(jsonServer.bodyParser)

jsonServerApplication.get('/draft-files', (request, response) => {
  const intendedOperation = request.query.operation

  if (!isDocumentOperation(intendedOperation)) {
    response.status(422).json({
      error: 'INVALID_DRAFT_FILE_OPERATION',
      message: 'Taslak dosyalar için geçerli bir işlem seçin.',
    })
    return
  }

  const draftFiles = database
    .get('draftFiles')
    .filter({ intendedOperation, status: 'uploaded' })
    .orderBy(['createdAt'], ['desc'])
    .value()

  response.json(draftFiles)
})

jsonServerApplication.post('/draft-files', (request, response) => {
  draftFileUpload(request, response, (fileUploadError) => {
    if (fileUploadError) {
      const isFileTooLarge = fileUploadError.code === 'LIMIT_FILE_SIZE'

      response.status(isFileTooLarge ? 413 : 400).json({
        error: isFileTooLarge
          ? 'DRAFT_FILE_TOO_LARGE'
          : 'INVALID_DRAFT_FILE_UPLOAD',
        message: isFileTooLarge
          ? 'Dosya boyutu 25 MB sınırını aşamaz.'
          : 'Yüklenecek dosya okunamadı.',
      })
      return
    }

    const uploadedFile = request.file
    const intendedOperation = request.body?.intendedOperation

    if (!uploadedFile || uploadedFile.size === 0) {
      response.status(400).json({
        error: 'INVALID_DRAFT_FILE_UPLOAD',
        message: 'Yüklemek için geçerli bir dosya gönderin.',
      })
      return
    }

    if (!isDocumentOperation(intendedOperation)) {
      response.status(422).json({
        error: 'INVALID_DRAFT_FILE_OPERATION',
        message: 'Dosyanın kullanılacağı işlem geçersiz.',
      })
      return
    }

    if (!isSupportedDraftFileName(uploadedFile.originalname)) {
      response.status(415).json({
        error: 'UNSUPPORTED_DRAFT_FILE_TYPE',
        message:
          'Yalnızca PDF, Word, XML, UBL ve görsel dosyalarına izin verilir.',
      })
      return
    }

    try {
      response.status(201).json(createDraftFile(uploadedFile, intendedOperation))
    } catch (draftFileCreationError) {
      response.status(500).json({
        error: 'DRAFT_FILE_UPLOAD_FAILED',
        message:
          draftFileCreationError instanceof Error
            ? draftFileCreationError.message
            : 'Dosya yükleme işlemi tamamlanamadı.',
      })
    }
  })
})

jsonServerApplication.delete('/draft-files/:draftFileId', (request, response) => {
  const draftFileId = Number.parseInt(request.params.draftFileId, 10)

  if (!Number.isSafeInteger(draftFileId) || !deleteDraftFile(draftFileId)) {
    response.status(404).json({
      error: 'DRAFT_FILE_NOT_FOUND',
      message: 'Silinecek taslak dosya bulunamadı.',
    })
    return
  }

  response.status(204).send()
})

jsonServerApplication.post('/signature-transactions', (request, response) => {
  const draftFileId = request.body?.draftFileId

  if (!Number.isSafeInteger(draftFileId) || draftFileId < 1) {
    response.status(422).json({
      error: 'INVALID_SIGNATURE_TRANSACTION',
      message: 'İmzalama için geçerli bir taslak dosya seçin.',
    })
    return
  }

  try {
    const { errorResponse, transactionResponse } =
      createDocumentTransaction(draftFileId, 'signature')

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
      error: 'SIGNATURE_TRANSACTION_FAILED',
      message:
        transactionError instanceof Error
          ? transactionError.message
          : 'İmzalama işlemi tamamlanamadı.',
    })
  }
})

jsonServerApplication.post('/timestamp-transactions', (request, response) => {
  const draftFileId = request.body?.draftFileId

  if (!Number.isSafeInteger(draftFileId) || draftFileId < 1) {
    response.status(422).json({
      error: 'INVALID_TIMESTAMP_TRANSACTION',
      message: 'Zaman damgalama için geçerli bir taslak dosya seçin.',
    })
    return
  }

  try {
    const { errorResponse, transactionResponse } =
      createDocumentTransaction(draftFileId, 'timestamp')

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

  const archivedDocumentContent = archivedDocumentContents.get(documentId)
  const documentContent =
    archivedDocumentContent?.content ??
    Buffer.from(`İzİmza fake arşiv kaydı: ${archivedDocument.name}`, 'utf8')

  response.set({
    'Cache-Control': 'private, no-store',
    'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(archivedDocument.name)}`,
    'Content-Type':
      archivedDocumentContent?.mimeType || 'application/octet-stream',
  })
  response.send(documentContent)
})

jsonServerApplication.use(jsonServerRouter)

jsonServerApplication.listen(serverPort, () => {
  console.log(
    `İzİmza fake API ${serverPort} portunda ${databasePath} verisini kullanıyor.`,
  )
})
