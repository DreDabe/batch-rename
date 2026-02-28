const ICON_MAP: Record<string, string> = {
  folder: '📁',
  default: '📄',
  image: '🖼️',
  video: '🎬',
  audio: '🎵',
  document: '📝',
  archive: '📦',
  code: '💻',
  pdf: '📕',
  excel: '📊',
  word: '📘',
  powerpoint: '📙',
}

const EXTENSION_CATEGORIES: Record<string, string[]> = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico', 'tiff', 'tif', 'heic', 'heif'],
  video: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v', '3gp', 'ogv'],
  audio: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a', 'opus', 'aiff'],
  document: ['txt', 'rtf', 'md', 'markdown', 'doc', 'docx', 'pdf', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp'],
  archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'tgz'],
  code: ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'cs', 'go', 'rs', 'rb', 'php', 'swift', 'kt', 'vue', 'svelte', 'html', 'css', 'scss', 'sass', 'less', 'json', 'xml', 'yaml', 'yml', 'toml', 'ini', 'conf', 'sh', 'bat', 'ps1'],
  pdf: ['pdf'],
  excel: ['xls', 'xlsx', 'csv', 'ods'],
  word: ['doc', 'docx', 'rtf', 'odt'],
  powerpoint: ['ppt', 'pptx', 'odp'],
}

export function getFileIcon(filename: string, isDirectory: boolean): string {
  if (isDirectory) {
    return ICON_MAP.folder
  }

  const ext = getFileExtension(filename).toLowerCase()

  if (ext === 'pdf') return ICON_MAP.pdf
  if (EXTENSION_CATEGORIES.excel.includes(ext)) return ICON_MAP.excel
  if (EXTENSION_CATEGORIES.word.includes(ext)) return ICON_MAP.word
  if (EXTENSION_CATEGORIES.powerpoint.includes(ext)) return ICON_MAP.powerpoint
  if (EXTENSION_CATEGORIES.image.includes(ext)) return ICON_MAP.image
  if (EXTENSION_CATEGORIES.video.includes(ext)) return ICON_MAP.video
  if (EXTENSION_CATEGORIES.audio.includes(ext)) return ICON_MAP.audio
  if (EXTENSION_CATEGORIES.archive.includes(ext)) return ICON_MAP.archive
  if (EXTENSION_CATEGORIES.code.includes(ext)) return ICON_MAP.code
  if (EXTENSION_CATEGORIES.document.includes(ext)) return ICON_MAP.document

  return ICON_MAP.default
}

function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  return lastDot === -1 ? '' : filename.substring(lastDot + 1)
}

export function getFileCategory(filename: string, isDirectory: boolean): string {
  if (isDirectory) return 'folder'

  const ext = getFileExtension(filename).toLowerCase()

  for (const [category, extensions] of Object.entries(EXTENSION_CATEGORIES)) {
    if (extensions.includes(ext)) {
      return category
    }
  }

  return 'file'
}

export function getFileTypeLabel(filename: string, isDirectory: boolean): string {
  if (isDirectory) return '文件夹'

  const ext = getFileExtension(filename).toLowerCase()

  const typeLabels: Record<string, string> = {
    image: '图片',
    video: '视频',
    audio: '音频',
    archive: '压缩包',
    code: '代码文件',
    pdf: 'PDF 文档',
    excel: 'Excel 表格',
    word: 'Word 文档',
    powerpoint: 'PowerPoint 演示文稿',
  }

  for (const [category, extensions] of Object.entries(EXTENSION_CATEGORIES)) {
    if (extensions.includes(ext)) {
      return typeLabels[category] || '文件'
    }
  }

  return ext ? `${ext.toUpperCase()} 文件` : '文件'
}
