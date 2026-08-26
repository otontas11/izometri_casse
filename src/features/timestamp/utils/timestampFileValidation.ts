import { formatFileSize } from '@/utils/formatters'

export const MAX_TIMESTAMP_FILE_SIZE_BYTES = 25 * 1024 * 1024

export type TimestampFileValidationResult =
  | { isValid: true }
  | { errorMessage: string; isValid: false }

export const validateTimestampFile = (
  timestampFile: File,
): TimestampFileValidationResult => {
  if (timestampFile.size === 0) {
    return {
      errorMessage: 'Boş dosyalar zaman damgalama işlemine alınamaz.',
      isValid: false,
    }
  }

  if (timestampFile.size > MAX_TIMESTAMP_FILE_SIZE_BYTES) {
    return {
      errorMessage: `Dosya boyutu ${formatFileSize(MAX_TIMESTAMP_FILE_SIZE_BYTES)} sınırını aşamaz.`,
      isValid: false,
    }
  }

  return { isValid: true }
}
