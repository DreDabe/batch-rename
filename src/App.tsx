import { FileList, FileListToolbar, TreePanel, PreviewPanel, RulePanel, TopMenuBar, StatusBar, ResizablePanel } from './components'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.tsx'
import { useGlobalErrorHandler } from './hooks/useActionLogger'
import { useEffect, useState } from 'react'
import { logger } from './utils/logger'
import { useTreeStore } from './stores/treeStore'

function App() {
  useKeyboardShortcuts()
  useGlobalErrorHandler()
  
  const treePanelWidth = useTreeStore((state) => state.panelWidth)
  const setTreePanelWidth = useTreeStore((state) => state.setPanelWidth)
  const [fileListWidth, setFileListWidth] = useState(320)

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
        <TopMenuBar />
      </header>

      <div className="flex-1 flex overflow-hidden">
        <ResizablePanel
          width={treePanelWidth}
          onWidthChange={setTreePanelWidth}
          defaultWidth={200}
          minWidth={150}
          maxWidth={400}
          className="border-r"
        >
          <TreePanel />
        </ResizablePanel>

        <main className="flex-1 flex flex-col overflow-hidden bg-white min-w-0">
          <FileListToolbar />
          <div className="flex-1 flex overflow-hidden">
            <ResizablePanel
              width={fileListWidth}
              onWidthChange={setFileListWidth}
              defaultWidth={320}
              minWidth={200}
              maxWidth={500}
              className="border-r"
            >
              <FileList />
            </ResizablePanel>
            <div className="flex-1 overflow-hidden border-r min-w-0">
              <PreviewPanel />
            </div>
          </div>
        </main>

        <div className="w-80 overflow-hidden flex-shrink-0 border-l bg-white">
          <RulePanel />
        </div>
      </div>

      <StatusBar />
    </div>
  )
}

export default App
