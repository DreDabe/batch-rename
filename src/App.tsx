import { useState } from 'react'

function App() {
  const [message, setMessage] = useState<string>('')
  const [version, setVersion] = useState<string>('')

  const handleOpenDirectory = async () => {
    if (window.electronAPI) {
      const path = await window.electronAPI.dialog.openDirectory()
      if (path) {
        setMessage(`Selected: ${path}`)
      }
    }
  }

  const handleCheckVersion = async () => {
    if (window.electronAPI) {
      const currentVersion = await window.electronAPI.version.current()
      setVersion(currentVersion)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">批量重命名工具</h1>
      <p className="text-gray-600 mb-2">Electron + React + TypeScript + Vite</p>

      <div className="mt-6 space-y-4">
        <button
          onClick={handleOpenDirectory}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          打开目录
        </button>

        <button
          onClick={handleCheckVersion}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors ml-2"
        >
          检查版本
        </button>
      </div>

      {message && <p className="text-green-600 mt-4">{message}</p>}
      {version && <p className="text-blue-600 mt-2">当前版本: {version}</p>}
    </div>
  )
}

export default App
