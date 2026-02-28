import { useState, useEffect } from 'react'

function App() {
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.ping().then((result: string) => {
        setMessage(result)
      })
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">批量重命名工具</h1>
      <p className="text-gray-600 mb-2">Electron + React + TypeScript + Vite</p>
      {message && (
        <p className="text-green-600 mt-4">
          IPC 通信测试: {message}
        </p>
      )}
    </div>
  )
}

export default App
