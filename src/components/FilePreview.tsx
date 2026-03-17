import { useState, useEffect, useMemo, useRef } from 'react'
import type { FileItem } from '../types'
import { getFileIcon, getFileCategory } from '../utils/fileIcons'
import { useFileListStore } from '../stores/fileListStore'
import { useSettingsStore } from '../stores/settingsStore'

interface PreviewProps {
  file: FileItem | null
}

function TextPreview({ content, theme }: { content: string; theme: 'light' | 'dark' }) {
  return (
    <pre className={`p-4 text-sm font-mono whitespace-pre-wrap overflow-auto h-full ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
      {content}
    </pre>
  )
}

function ImagePreview({ src, theme }: { src: string; theme: 'light' | 'dark' }) {
  return (
    <div className={`flex items-center justify-center h-full p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
      <img
        src={src}
        alt="Preview"
        className="max-w-full max-h-full object-contain rounded shadow-lg"
      />
    </div>
  )
}

function VideoPreview({ path, theme }: { path: string; theme: 'light' | 'dark' }) {
  return (
    <div className={`flex items-center justify-center h-full w-full p-4 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-800'}`}>
      <video
        src={`file:///${path.replace(/\\/g, '/')}`}
        controls
        autoPlay
        className="w-full h-full object-contain"
        style={{ maxWidth: '100%', maxHeight: '100%' }}
      />
    </div>
  )
}

function AudioPreview({ path, theme }: { path: string; theme: 'light' | 'dark' }) {
  return (
    <div className={`flex flex-col items-center justify-center h-full p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
      <span className="text-6xl mb-4">🎵</span>
      <audio src={`file:///${path.replace(/\\/g, '/')}`} controls className="w-full max-w-md" />
    </div>
  )
}

function UnsupportedPreview({ file, theme }: { file: FileItem; theme: 'light' | 'dark' }) {
  const icon = getFileIcon(file.name, false)
  const category = getFileCategory(file.name, false)

  return (
    <div className={`flex flex-col items-center justify-center h-full p-4 ${theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-400'}`}>
      <span className="text-6xl mb-4">{icon}</span>
      <p className="text-lg font-medium">{file.name}</p>
      <p className="text-sm mt-2">不支持预览此类型文件</p>
      <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-300'}`}>类型: {category}</p>
    </div>
  )
}

function FolderPreview({ file, theme }: { file: FileItem; theme: 'light' | 'dark' }) {
  return (
    <div className={`flex flex-col items-center justify-center h-full p-4 ${theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-400'}`}>
      <span className="text-6xl mb-4">📁</span>
      <p className="text-lg font-medium">{file.name}</p>
      <p className="text-sm mt-2">文件夹</p>
    </div>
  )
}

function LoadingPreview({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <div className={`flex flex-col items-center justify-center h-full p-4 ${theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-400'}`}>
      <div className="animate-spin text-4xl mb-4">⏳</div>
      <p className="text-sm">加载中...</p>
    </div>
  )
}

function ErrorPreview({ error, theme }: { error: string; theme: 'light' | 'dark' }) {
  return (
    <div className={`flex flex-col items-center justify-center h-full p-4 ${theme === 'dark' ? 'bg-gray-800 text-red-400' : 'bg-gray-50 text-red-400'}`}>
      <span className="text-4xl mb-4">⚠️</span>
      <p className="text-sm">{error}</p>
    </div>
  )
}

export function FilePreview({ file }: PreviewProps) {
  const [content, setContent] = useState<string | null>(null)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const currentFilePathRef = useRef<string | null>(null)
  
  const { settings } = useSettingsStore()
  const { theme } = settings

  const category = useMemo(() => {
    if (!file) return null
    return getFileCategory(file.name, file.isDirectory)
  }, [file?.name, file?.isDirectory])

  useEffect(() => {
    if (!file || file.isDirectory) {
      setContent(null)
      setImageSrc(null)
      currentFilePathRef.current = null
      return
    }

    if (currentFilePathRef.current === file.path) {
      return
    }

    currentFilePathRef.current = file.path
    setLoading(true)
    setError(null)
    setContent(null)
    setImageSrc(null)

    const loadContent = async () => {
      try {
        if (category === 'image') {
          const result = await window.electronAPI.fs.readImageBase64(file.path)
          if (result.success && result.data) {
            setImageSrc(result.data)
          } else {
            setError(result.error || '无法加载图片')
          }
        } else if (
          category === 'document' ||
          category === 'code' ||
          category === 'pdf'
        ) {
          const result = await window.electronAPI.fs.readFile(file.path)
          if (result.success && result.data) {
            setContent(result.data)
          } else {
            setError(result.error || '无法读取文件')
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '未知错误')
      } finally {
        setLoading(false)
      }
    }

    loadContent()
  }, [file, category])

  if (!file) {
    return (
      <div className={`flex flex-col items-center justify-center h-full ${theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-400'}`}>
        <span className="text-4xl mb-2">📄</span>
        <span className="text-sm">选择文件以预览</span>
      </div>
    )
  }

  if (file.isDirectory) {
    return <FolderPreview file={file} theme={theme} />
  }

  if (loading) {
    return <LoadingPreview theme={theme} />
  }

  if (error) {
    return <ErrorPreview error={error} theme={theme} />
  }

  switch (category) {
    case 'image':
      return imageSrc ? <ImagePreview src={imageSrc} theme={theme} /> : <LoadingPreview theme={theme} />

    case 'video':
      return <VideoPreview path={file.path} theme={theme} />

    case 'audio':
      return <AudioPreview path={file.path} theme={theme} />

    case 'document':
    case 'code':
      return content ? <TextPreview content={content} theme={theme} /> : <LoadingPreview theme={theme} />

    case 'pdf':
      return content ? (
        <div className={`flex flex-col items-center justify-center h-full p-4 ${theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-400'}`}>
          <span className="text-6xl mb-4">📕</span>
          <p className="text-lg font-medium">{file.name}</p>
          <p className="text-sm mt-2">PDF 文件暂不支持预览</p>
        </div>
      ) : (
        <LoadingPreview theme={theme} />
      )

    default:
      return <UnsupportedPreview file={file} theme={theme} />
  }
}

export function PreviewPanel() {
  const previewFile = useFileListStore((state) => state.previewFile)
  const { settings } = useSettingsStore()
  const { theme } = settings

  return (
    <div className={`h-full flex flex-col ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="flex-1 overflow-hidden">
        <FilePreview file={previewFile} />
      </div>
      {previewFile && (
        <div className={`px-3 py-2 text-xs border-t ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
          <div className="flex justify-between">
            <span className="truncate">{previewFile.name}</span>
            <span className="ml-2 flex-shrink-0">
              {previewFile.isDirectory ? '文件夹' : `${previewFile.size} 字节`}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
