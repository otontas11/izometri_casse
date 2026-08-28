import { readFileSync } from 'node:fs'

const allowedCommitTypes = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert']
const maximumCommitTitleLength = 50
const commitMessageFilePath = process.argv[2]

if (!commitMessageFilePath) {
  console.error('Commit mesajı dosyası bulunamadı.')
  process.exit(1)
}

const commitMessage = readFileSync(commitMessageFilePath, 'utf8')
const commitTitle = commitMessage.split(/\r?\n/, 1)[0] ?? ''
const allowedCommitTypesPattern = allowedCommitTypes.join('|')
const commitTitlePattern = new RegExp(`^(${allowedCommitTypesPattern}): \\S(?:.*\\S)?$`)
const commitTitleLength = Array.from(commitTitle).length
const validationErrors = []

if (!commitTitlePattern.test(commitTitle)) {
  validationErrors.push(`Başlık "<tür>: <açıklama>" formatında olmalıdır. İzin verilen türler: ${allowedCommitTypes.join(', ')}.`)
}

if (commitTitleLength > maximumCommitTitleLength) {
  validationErrors.push(`Başlık en fazla ${maximumCommitTitleLength} karakter olabilir. Mevcut uzunluk: ${commitTitleLength}.`)
}

if (validationErrors.length > 0) {
  console.error('\nCommit başlığı geçersiz:\n')
  validationErrors.forEach(validationError => {
    console.error(`- ${validationError}`)
  })
  console.error('\nÖrnek: feat: code format ver-4\n')
  process.exit(1)
}
