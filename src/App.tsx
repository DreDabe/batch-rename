import { FileList, FileListToolbar, TreePanel, PreviewPanel, RulePanel, TopMenuBar, StatusBar } from './components'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.tsx'
import { useGlobalErrorHandler } from './hooks/useActionLogger'
import { useEffect } from 'react'
import { logger } from './utils/logger'

function App() {
  useKeyboardShortcuts()
  useGlobalErrorHandler()

  useEffect(() => {
    logger.logAction({
      module: 'App',
      actionType: 'load',
      message: '应用启动',
      level: 'info',
    })

    const handleBeforeUnload = () => {
      logger.logAction({
        module: 'App',
        actionType: 'navigate',
        message: '应用关闭',
        level: 'info',
        data: {
          sessionDuration: logger.getSessionDuration(),
          userPathLength: logger.getUserPath().length,
        },
      })
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-800">批量重命名工具</h1>
        </div>
        <TopMenuBar />
      </header>

      <div className="flex-1 flex overflow-hidden">
        <TreePanel />

        <main className="flex-1 flex flex-col overflow-hidden bg-white min-w-0">
          <FileListToolbar />
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-hidden border-r min-w-0">
              <FileList />
            </div>
            <div className="w-80 overflow-hidden border-r flex-shrink-0">
              <PreviewPanel />
            </div>
            <div className="w-80 overflow-hidden flex-shrink-0">
              <RulePanel />
            </div>
          </div>
        </main>
      </div>

      <StatusBar />
    </div>
  )
}

export default App
