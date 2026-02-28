import { FileList, FileListToolbar, FavoritesPanel, PreviewPanel } from './components'

function App() {
  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <header className="bg-white shadow-sm border-b px-4 py-3">
        <h1 className="text-lg font-semibold text-gray-800">批量重命名工具</h1>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 bg-white border-r flex flex-col overflow-hidden">
          <FavoritesPanel />
          <div className="flex-1 overflow-auto">
            <div className="p-3 text-xs text-gray-400">
              提示: 使用 Shift 连续选择，Ctrl 多选
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          <FileListToolbar />
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-hidden border-r">
              <FileList />
            </div>
            <div className="w-80 overflow-hidden">
              <PreviewPanel />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
