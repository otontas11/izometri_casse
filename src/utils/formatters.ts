import { getApplicationLocaleCode } from '@/locales'

const FILE_SIZE_UNIT_BASE = 1024
const fileSizeUnits = ['B', 'KB', 'MB', 'GB'] as const

export const formatFileSize = (fileSizeInBytes: number) => {
  if (!Number.isFinite(fileSizeInBytes) || fileSizeInBytes <= 0) {
    return '0 B'
  }

  const fileSizeUnitIndex = Math.min(Math.floor(Math.log(fileSizeInBytes) / Math.log(FILE_SIZE_UNIT_BASE)), fileSizeUnits.length - 1)
  const normalizedFileSize = fileSizeInBytes / FILE_SIZE_UNIT_BASE ** fileSizeUnitIndex

  const localizedFileSize = new Intl.NumberFormat(getApplicationLocaleCode(), {
    maximumFractionDigits: 1,
  }).format(normalizedFileSize)

  return `${localizedFileSize} ${fileSizeUnits[fileSizeUnitIndex]}`
}

export const formatDateTime = (dateValue: Date | string) => {
  const parsedDate = dateValue instanceof Date ? dateValue : new Date(dateValue)

  if (Number.isNaN(parsedDate.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat(getApplicationLocaleCode(), {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsedDate)
}
