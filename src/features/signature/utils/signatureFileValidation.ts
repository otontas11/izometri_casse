import { translate } from '@/locales'
import { formatFileSize } from '@/utils/formatters'

export const MAX_SIGNATURE_FILE_SIZE_BYTES = 25 * 1024 * 1024
export const SIGNATURE_FILE_INPUT_ACCEPT = [
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
].join(',')

const supportedSignatureFileExtensions = new Set(
  SIGNATURE_FILE_INPUT_ACCEPT.split(','),
)

type SignatureFileValidationResult =
  | { isValid: true }
  | { errorMessage: string; isValid: false }

const getFileExtension = (fileName: string) => {
  const extensionSeparatorIndex = fileName.lastIndexOf('.')

  return extensionSeparatorIndex >= 0
    ? fileName.slice(extensionSeparatorIndex).toLowerCase()
    : ''
}

export const isSupportedSignatureFile = (signatureFile: File) =>
  supportedSignatureFileExtensions.has(
    getFileExtension(signatureFile.name),
  )

export const validateSignatureFile = (
  signatureFile: File,
): SignatureFileValidationResult => {
  if (signatureFile.size === 0) {
    return {
      errorMessage: translate('signature.validation.emptyFile'),
      isValid: false,
    }
  }

  if (signatureFile.size > MAX_SIGNATURE_FILE_SIZE_BYTES) {
    return {
      errorMessage: translate('signature.validation.fileTooLarge', {
        maximumSize: formatFileSize(MAX_SIGNATURE_FILE_SIZE_BYTES),
      }),
      isValid: false,
    }
  }

  if (!isSupportedSignatureFile(signatureFile)) {
    return {
      errorMessage: translate('signature.validation.unsupportedFileType'),
      isValid: false,
    }
  }

  return { isValid: true }
}
