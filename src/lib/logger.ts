/**
 * ロギングユーティリティ
 * 開発環境と本番環境で適切にログを出力
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug'

interface LogContext {
  [key: string]: unknown
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  error(message: string, error?: unknown, context?: LogContext): void {
    const errorContext = error instanceof Error 
      ? { ...context, error: error.message, stack: error.stack }
      : { ...context, error }
    
    if (this.isDevelopment) {
      console.error(this.formatMessage('error', message, errorContext))
    } else {
      // 本番環境では適切なロギングサービス（Sentry、LogRocketなど）を使用
      // 例: Sentry.captureException(error, { extra: context })
      console.error(this.formatMessage('error', message, errorContext))
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.warn(this.formatMessage('warn', message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(this.formatMessage('info', message, context))
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context))
    }
  }
}

export const logger = new Logger()

