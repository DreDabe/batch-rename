import { FileList, FileListToolbar, TreePanel, PreviewPanel, RulePanel, TopMenuBar, StatusBar, ResizablePanel } from './components'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.tsx'
import { useGlobalErrorHandler } from './hooks/useActionLogger'
import { useEffect, useState, useRef } from 'react'
import { logger } from './utils/logger'
import { useTreeStore } from './stores/treeStore'
import { useSettingsStore } from './stores/settingsStore'
import { useFileListStore } from './stores/fileListStore'



function App() {
  useKeyboardShortcuts()
  useGlobalErrorHandler()
  
  const treePanelWidth = useTreeStore((state) => state.panelWidth)
  const setTreePanelWidth = useTreeStore((state) => state.setPanelWidth)
  const isPanelCollapsed = useTreeStore((state) => state.isPanelCollapsed)
  const rootNode = useTreeStore((state) => state.rootNode)
    const [fileListWidth, setFileListWidth] = useState(320)
    const hasInitialized = useRef(false)
    
    const { loadSettings, settings, hasLoaded } = useSettingsStore()
    const { theme } = settings
    
    // 加载设置
    useEffect(() => {
        const initApp = async () => {
            await loadSettings()
        }
        
        initApp()
    }, [loadSettings])

    // 处理上次目录打开
    useEffect(() => {
        if (hasInitialized.current) return
        if (!hasLoaded || !rootNode) return
        
        hasInitialized.current = true
        
        const openLastPath = async () => {
            const { setCurrentPath } = useFileListStore.getState()
            const { expandToPath, selectNode } = useTreeStore.getState()
            const { updateSettings } = useSettingsStore.getState()
            
            if (settings.openLastPath && settings.lastOpenedPath) {
                try {
                    const pathExists = await window.electronAPI.fs.exists(settings.lastOpenedPath)
                    
                    if (pathExists) {
                        await expandToPath(settings.lastOpenedPath)
                        setCurrentPath(settings.lastOpenedPath)
                        return
                    }
                } catch (error) {
                }
            }
            
            // 如果没有开启功能、路径为空或路径不存在，打开第一个驱动器
            const firstDrive = rootNode.children?.[0]
            if (firstDrive) {
                await expandToPath(firstDrive.path)
                selectNode(firstDrive.path)
                setCurrentPath(firstDrive.path)
                updateSettings('lastOpenedPath', firstDrive.path)
            }
        }
        
        openLastPath()
    }, [settings.openLastPath, settings.lastOpenedPath, hasLoaded, rootNode])

  useEffect(() => {
    logger.logAction({
      module: 'App',
      actionType: 'load',
      message: '应用启动',
      level: 'info',
    })

    // 菜单事件处理
    const handleNewFile = async () => {
      logger.logAction({
        module: 'App',
        actionType: 'create',
        message: '新建文件',
      })

      const currentPath = useFileListStore.getState().currentPath
      if (!currentPath) {
        alert('请先打开一个目录')
        return
      }

      const name = prompt('请输入文件名称')
      if (!name) return

      try {
        const result = await window.electronAPI.fs.createFile(currentPath, name, '')
        if (result.success) {
          // 刷新文件列表
          const refreshResult = await window.electronAPI.fs.readDirectory(currentPath)
          if (refreshResult.success && refreshResult.data) {
            useFileListStore.getState().setFiles(refreshResult.data.files)
          }
        } else {
          alert(result.error || '创建失败')
        }
      } catch (error) {
        alert('创建文件失败：' + (error instanceof Error ? error.message : '未知错误'))
      }
    }

    const handleNewFolder = () => {
      logger.logAction({
        module: 'App',
        actionType: 'create',
        message: '新建文件夹',
      })
      // 触发 TopMenuBar 中的新建文件夹功能
      const topMenuBar = document.querySelector('[data-testid="top-menu-bar"]')
      if (topMenuBar) {
        const newFolderButton = topMenuBar.querySelector('[id="newFolder"]')
        if (newFolderButton instanceof HTMLElement) {
          newFolderButton.click()
        }
      }
    }

    const handleOpenFile = (_event: any, path: string) => {
      logger.logAction({
        module: 'App',
        actionType: 'navigate',
        message: '打开文件',
        data: { path },
      })
      // 这里可以添加打开文件的逻辑，比如显示文件内容
      console.log('打开文件:', path)
    }

    const handleOpenDirectory = (_event: any, path: string) => {
      logger.logAction({
        module: 'App',
        actionType: 'navigate',
        message: '打开目录',
        data: { path },
      })
      const fileListStore = useFileListStore.getState()
      const treeStore = useTreeStore.getState()
      const settingsStore = useSettingsStore.getState()
      
      fileListStore.setCurrentPath(path)
      treeStore.selectNode(path)
      settingsStore.updateSettings('lastOpenedPath', path)
      
      if (!treeStore.rootNode) {
        treeStore.initializeTree()
      }
      
      treeStore.expandToPath(path)
    }

    const handleSave = () => {
      logger.logAction({
        module: 'App',
        actionType: 'save',
        message: '保存文件',
      })
      // 这里可以添加保存文件的逻辑
      alert('保存功能待实现')
    }

    const handleSaveAs = async () => {
      logger.logAction({
        module: 'App',
        actionType: 'save',
        message: '另存为文件',
      })
      
      try {
        const result = await window.electronAPI.dialog.saveFile({
          title: '另存为',
          defaultPath: useFileListStore.getState().currentPath,
        })
        if (!result.canceled && result.filePath) {
          // 这里可以添加保存文件的逻辑
          console.log('另存为:', result.filePath)
        }
      } catch (error) {
        alert('另存为失败：' + (error instanceof Error ? error.message : '未知错误'))
      }
    }

    const handleUndo = () => {
      logger.logAction({
        module: 'App',
        actionType: 'undo',
        message: '执行撤销操作',
      })
      // 触发 FileListToolbar 中的撤销功能
      const fileListToolbar = document.querySelector('[data-testid="file-list-toolbar"]')
      if (fileListToolbar) {
        const undoButton = fileListToolbar.querySelector('[title="撤销 (Ctrl+Z)"]')
        if (undoButton instanceof HTMLElement) {
          undoButton.click()
        }
      }
    }

    const handleAbout = () => {
      logger.logAction({
        module: 'App',
        actionType: 'navigate',
        message: '打开关于对话框',
      })
      alert('批量重命名工具 v1.0.0\n一个强大的文件批量重命名工具')
    }

    // 注册菜单事件监听器
    window.electronAPI.menu.onNewFile(handleNewFile)
    window.electronAPI.menu.onNewFolder(handleNewFolder)
    window.electronAPI.menu.onOpenFile(handleOpenFile)
    window.electronAPI.menu.onOpenDirectory(handleOpenDirectory)
    window.electronAPI.menu.onSave(handleSave)
    window.electronAPI.menu.onSaveAs(handleSaveAs)
    window.electronAPI.menu.onUndo(handleUndo)
    window.electronAPI.menu.onAbout(handleAbout)

    const handleBeforeUnload = async () => {
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
      
      // 清除操作历史记录
      try {
        await window.electronAPI.history.clear()
      } catch (error) {
        console.error('清除历史记录失败:', error)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  return (
    <div className={`h-screen flex flex-col ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <header className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border-b`}>
        <TopMenuBar />
      </header>

      <div className="flex-1 flex overflow-hidden">
        <ResizablePanel
          width={isPanelCollapsed ? 40 : treePanelWidth}
          onWidthChange={setTreePanelWidth}
          defaultWidth={200}
          minWidth={40}
          maxWidth={400}
          className={`${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} border-r`}
        >
          <TreePanel />
        </ResizablePanel>

        <main className={`flex-1 flex flex-col overflow-hidden ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} min-w-0`}>
          <FileListToolbar />
          <div className="flex-1 flex overflow-hidden">
            <ResizablePanel
              width={fileListWidth}
              onWidthChange={setFileListWidth}
              defaultWidth={320}
              minWidth={200}
              maxWidth={500}
              className={`${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} border-r`}
            >
              <FileList />
            </ResizablePanel>
            <div className={`flex-1 overflow-hidden ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} border-r min-w-0`}>
              <PreviewPanel />
            </div>
          </div>
        </main>

        <div className={`w-80 overflow-hidden flex-shrink-0 ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} border-l`}>
          <RulePanel />
        </div>
      </div>

      <StatusBar />
    </div>
  )
}

export default App
