import { useCallback, useRef, useEffect } from 'react'
import { logger, type ActionType, type LogLevel } from '../utils/logger'

interface UseActionLoggerOptions {
  module: string
  componentName: string
  componentId?: string
}

interface LogInteractionParams {
  actionType: 'click' | 'input' | 'select' | 'submit'
  message: string
  data?: unknown
}

interface LogStateChangeParams {
  message: string
  previousState?: unknown
  newState?: unknown
}

interface LogErrorParams {
  message: string
  error?: Error | unknown
  data?: unknown
}

interface LogActionParams {
  actionType: ActionType
  message: string
  data?: unknown
  previousState?: unknown
  newState?: unknown
  level?: LogLevel
}

export function useActionLogger(options: UseActionLoggerOptions) {
  const { module, componentName, componentId } = options
  const idRef = useRef(componentId || `${componentName}-${Date.now()}`)

  useEffect(() => {
    const currentId = idRef.current
    logger.logAction({
      module,
      componentId: currentId,
      componentName,
      actionType: 'load',
      message: `组件加载: ${componentName}`,
      level: 'debug',
    })

    return () => {
      logger.logAction({
        module,
        componentId: currentId,
        componentName,
        actionType: 'navigate',
        message: `组件卸载: ${componentName}`,
        level: 'debug',
      })
    }
  }, [module, componentName])

  const logInteraction = useCallback(
    (params: LogInteractionParams) => {
      logger.logUserInteraction({
        module,
        componentId: idRef.current,
        componentName,
        ...params,
      })
    },
    [module, componentName]
  )

  const logClick = useCallback(
    (elementName: string, data?: unknown) => {
      logInteraction({
        actionType: 'click',
        message: `点击: ${elementName}`,
        data,
      })
    },
    [logInteraction]
  )

  const logInput = useCallback(
    (fieldName: string, value?: unknown) => {
      logInteraction({
        actionType: 'input',
        message: `输入: ${fieldName}`,
        data: { field: fieldName, value: typeof value === 'string' && value.length > 50 ? `${value.substring(0, 50)}...` : value },
      })
    },
    [logInteraction]
  )

  const logSelect = useCallback(
    (selectName: string, selectedValue?: unknown) => {
      logInteraction({
        actionType: 'select',
        message: `选择: ${selectName}`,
        data: { field: selectName, value: selectedValue },
      })
    },
    [logInteraction]
  )

  const logSubmit = useCallback(
    (formName: string, data?: unknown) => {
      logInteraction({
        actionType: 'submit',
        message: `提交: ${formName}`,
        data,
      })
    },
    [logInteraction]
  )

  const logStateChange = useCallback(
    (params: LogStateChangeParams) => {
      logger.logStateChange({
        module,
        ...params,
      })
    },
    [module]
  )

  const logError = useCallback(
    (params: LogErrorParams) => {
      logger.logError({
        module,
        componentName,
        ...params,
      })
    },
    [module, componentName]
  )

  const logAction = useCallback(
    (params: LogActionParams) => {
      logger.logAction({
        module,
        componentId: idRef.current,
        componentName,
        ...params,
      })
    },
    [module, componentName]
  )

  const startTimer = useCallback(() => {
    return logger.startTimer()
  }, [])

  return {
    logInteraction,
    logClick,
    logInput,
    logSelect,
    logSubmit,
    logStateChange,
    logError,
    logAction,
    startTimer,
    componentId: idRef.current,
  }
}

export function useClickLogger(module: string, componentName: string) {
  const { logClick, componentId } = useActionLogger({ module, componentName })

  const createClickHandler = useCallback(
    (elementName: string, originalHandler?: (e: React.MouseEvent) => void, data?: unknown) => {
      return (e: React.MouseEvent) => {
        logClick(elementName, data)
        originalHandler?.(e)
      }
    },
    [logClick]
  )

  return { createClickHandler, logClick, componentId }
}

export function useInputLogger(module: string, componentName: string) {
  const { logInput, componentId } = useActionLogger({ module, componentName })

  const createInputHandler = useCallback(
    (fieldName: string, originalHandler?: (value: string) => void) => {
      return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        logInput(fieldName, e.target.value)
        originalHandler?.(e.target.value)
      }
    },
    [logInput]
  )

  return { createInputHandler, logInput, componentId }
}

export function useGlobalErrorHandler() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      logger.logError({
        module: 'Global',
        message: `未捕获的错误: ${event.message}`,
        error: event.error,
        data: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      })
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logger.logError({
        module: 'Global',
        message: '未处理的Promise拒绝',
        error: event.reason,
        data: {
          type: 'unhandledrejection',
        },
      })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])
}

export function useLogOnMount(module: string, message: string, data?: unknown) {
  useEffect(() => {
    logger.info(module, message, data)
  }, [module, message, data])
}

export function useLogOnDismount(module: string, message: string, data?: unknown) {
  useEffect(() => {
    return () => {
      logger.info(module, message, data)
    }
  }, [module, message, data])
}
