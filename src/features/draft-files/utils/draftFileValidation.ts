import { translate } from '@/locales'
import { formatFileSize } from '@/utils/formatters'

export const MAX_DRAFT_FILE_SIZE_BYTES = 25 * 1024 * 1024
export const DRAFT_FILE_INPUT_ACCEPT = [
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
].join(',')

const supportedDraftFileExtensions = new Set(
  DRAFT_FILE_INPUT_ACCEPT.split(','),
)

type DraftFileValidationResult =
  | { isValid: true }
  | { errorMessage: string; isValid: false }

const getFileExtension = (fileName: string) => {
  const extensionSeparatorIndex = fileName.lastIndexOf('.')

  return extensionSeparatorIndex >= 0
    ? fileName.slice(extensionSeparatorIndex).toLowerCase()
    : ''
}

export const validateDraftFile = (
  draftFile: File,
): DraftFileValidationResult => {
  if (draftFile.size === 0) {
    return {
      errorMessage: translate('draftFiles.validation.emptyFile'),
      isValid: false,
    }
  }

  if (draftFile.size > MAX_DRAFT_FILE_SIZE_BYTES) {
    return {
      errorMessage: translate('draftFiles.validation.fileTooLarge', {
        maximumSize: formatFileSize(MAX_DRAFT_FILE_SIZE_BYTES),
      }),
      isValid: false,
    }
  }

  if (!supportedDraftFileExtensions.has(getFileExtension(draftFile.name))) {
    return {
      errorMessage: translate('draftFiles.validation.unsupportedFileType'),
      isValid: false,
    }
  }

  return { isValid: true }
}
