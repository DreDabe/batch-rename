import { useState, useEffect, useMemo } from 'react'
import type { FileItem } from '../types'
import { getFileIcon, getFileCategory } from '../utils/fileIcons'
import { useFileListStore } from '../stores/fileListStore'

interface PreviewProps {
  file: FileItem | null
}

function TextPreview({ content }: { content: string }) {
  return (
    <pre className="p-4 text-sm font-mono text-gray-700 whitespace-pre-wrap overflow-auto h-full bg-gray-50">
      {content}
    </pre>
  )
}

function ImagePreview({ src }: { src: string }) {
  return (
    <div className="flex items-center justify-center h-full p-4 bg-gray-50">
      <img
        src={src}
        alt="Preview"
        className="max-w-full max-h-full object-contain rounded shadow-lg"
      />
    </div>
  )
}

function VideoPreview({ path }: { path: string }) {
  return (
    <div className="flex items-center justify-center h-full p-4 bg-gray-900">
      <video
        src={`file://${path}`}
        controls
        className="max-w-full max-h-full rounded"
      />
    </div>
  )
}

function AudioPreview({ path }: { path: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 bg-gray-50">
      <span className="text-6xl mb-4">🎵</span>
      <audio src={`file://${path}`} controls className="w-full max-w-md" />
    </div>
  )
}

function UnsupportedPreview({ file }: { file: FileItem }) {
  const icon = getFileIcon(file.name, false)
  const category = getFileCategory(file.name, false)

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 bg-gray-50 text-gray-400">
      <span className="text-6xl mb-4">{icon}</span>
      <p className="text-lg font-medium">{file.name}</p>
      <p className="text-sm mt-2">不支持预览此类型文件</p>
      <p className="text-xs mt-1 text-gray-300">类型: {category}</p>
    </div>
  )
}

function FolderPreview({ file }: { file: FileItem }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 bg-gray-50 text-gray-400">
      <span className="text-6xl mb-4">📁</span>
      <p className="text-lg font-medium">{file.name}</p>
      <p className="text-sm mt-2">文件夹</p>
    </div>
  )
}

function LoadingPreview() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 bg-gray-50 text-gray-400">
      <div className="animate-spin text-4xl mb-4">⏳</div>
      <p className="text-sm">加载中...</p>
    </div>
  )
}

function ErrorPreview({ error }: { error: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 bg-gray-50 text-red-400">
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

  const category = useMemo(() => {
    if (!file) return null
    return getFileCategory(file.name, file.isDirectory)
  }, [file])

  useEffect(() => {
    if (!file || file.isDirectory) {
      setContent(null)
      setImageSrc(null)
      return
    }

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
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-gray-400">
        <span className="text-4xl mb-2">📄</span>
        <span className="text-sm">选择文件以预览</span>
      </div>
    )
  }

  if (file.isDirectory) {
    return <FolderPreview file={file} />
  }

  if (loading) {
    return <LoadingPreview />
  }

  if (error) {
    return <ErrorPreview error={error} />
  }

  switch (category) {
    case 'image':
      return imageSrc ? <ImagePreview src={imageSrc} /> : <LoadingPreview />

    case 'video':
      return <VideoPreview path={file.path} />

    case 'audio':
      return <AudioPreview path={file.path} />

    case 'document':
    case 'code':
      return content ? <TextPreview content={content} /> : <LoadingPreview />

    case 'pdf':
      return content ? (
        <div className="flex flex-col items-center justify-center h-full p-4 bg-gray-50 text-gray-400">
          <span className="text-6xl mb-4">📕</span>
          <p className="text-lg font-medium">{file.name}</p>
          <p className="text-sm mt-2">PDF 文件暂不支持预览</p>
        </div>
      ) : (
        <LoadingPreview />
      )

    default:
      return <UnsupportedPreview file={file} />
  }
}

export function PreviewPanel() {
  const selectedFiles = useFileListStore((state) => state.getSelectedFiles())
  const selectedFile = selectedFiles.length === 1 ? selectedFiles[0] : null

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-1 overflow-hidden">
        <FilePreview file={selectedFile} />
      </div>
      {selectedFile && (
        <div className="px-3 py-2 text-xs text-gray-500 border-t bg-gray-50">
          <div className="flex justify-between">
            <span className="truncate">{selectedFile.name}</span>
            <span className="ml-2 flex-shrink-0">
              {selectedFile.isDirectory ? '文件夹' : `${selectedFile.size} 字节`}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
