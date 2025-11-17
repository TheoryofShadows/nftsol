/**
 * Frontend Logger Utility
 * Provides styled, categorized console output for better developer experience
 * Inspired by professional NFT marketplaces like Magic Eden and Tensor
 */

type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug' | 'api' | 'perf' | 'user';

interface LogStyle {
  emoji: string;
  color: string;
  bgColor: string;
  label: string;
}

const LOG_STYLES: Record<LogLevel, LogStyle> = {
  info: {
    emoji: '📘',
    color: '#00d4ff',
    bgColor: '#002633',
    label: 'INFO',
  },
  success: {
    emoji: '✅',
    color: '#14f195',
    bgColor: '#002614',
    label: 'SUCCESS',
  },
  warning: {
    emoji: '⚠️',
    color: '#ffa500',
    bgColor: '#332100',
    label: 'WARNING',
  },
  error: {
    emoji: '❌',
    color: '#ff4444',
    bgColor: '#330000',
    label: 'ERROR',
  },
  debug: {
    emoji: '🔍',
    color: '#9945ff',
    bgColor: '#1a0033',
    label: 'DEBUG',
  },
  api: {
    emoji: '🌐',
    color: '#61dafb',
    bgColor: '#002233',
    label: 'API',
  },
  perf: {
    emoji: '⚡',
    color: '#ffeb3b',
    bgColor: '#332e00',
    label: 'PERF',
  },
  user: {
    emoji: '👤',
    color: '#ff6b9d',
    bgColor: '#330019',
    label: 'USER',
  },
};

class Logger {
  private isDev: boolean;
  private timers: Map<string, number> = new Map();
  private groupDepth: number = 0;

  constructor() {
    this.isDev = import.meta.env.DEV;
  }

  /**
   * Styled console output with emoji and colors
   */
  private log(level: LogLevel, message: string, ...args: any[]) {
    if (!this.isDev) return;

    const style = LOG_STYLES[level];
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });

    console.log(
      `%c${style.emoji} ${style.label}%c ${timestamp} %c${message}`,
      `background: ${style.bgColor}; color: ${style.color}; font-weight: bold; padding: 2px 6px; border-radius: 3px;`,
      `color: #666; font-size: 0.9em;`,
      `color: ${style.color}; font-weight: normal;`,
      ...args
    );
  }

  /**
   * Info logs - general information
   */
  info(message: string, ...args: any[]) {
    this.log('info', message, ...args);
  }

  /**
   * Success logs - completed operations
   */
  success(message: string, ...args: any[]) {
    this.log('success', message, ...args);
  }

  /**
   * Warning logs - potential issues
   */
  warn(message: string, ...args: any[]) {
    this.log('warning', message, ...args);
  }

  /**
   * Error logs - failures and exceptions
   */
  error(message: string, error?: any, ...args: any[]) {
    this.log('error', message, error, ...args);

    // Enhanced error details
    if (error && this.isDev) {
      console.group('📋 Error Details');
      console.error('Stack:', error.stack || 'No stack trace');
      if (error.response) {
        console.error('Response:', error.response);
      }
      console.groupEnd();
    }
  }

  /**
   * Debug logs - development debugging
   */
  debug(message: string, ...args: any[]) {
    this.log('debug', message, ...args);
  }

  /**
   * API logs - HTTP requests and responses
   */
  api(method: string, endpoint: string, data?: any) {
    if (!this.isDev) return;

    const style = LOG_STYLES.api;
    console.groupCollapsed(
      `%c🌐 API%c ${method.toUpperCase()} %c${endpoint}`,
      `background: ${style.bgColor}; color: ${style.color}; font-weight: bold; padding: 2px 6px; border-radius: 3px;`,
      `color: ${style.color}; font-weight: bold;`,
      `color: #999;`
    );

    if (data) {
      console.log('📤 Request Data:', data);
    }
    console.log('🕐 Time:', new Date().toLocaleTimeString());
    console.groupEnd();
  }

  /**
   * API response logger
   */
  apiResponse(endpoint: string, status: number, duration: number, data?: any) {
    if (!this.isDev) return;

    const isSuccess = status >= 200 && status < 300;
    const emoji = isSuccess ? '✅' : '❌';
    const color = isSuccess ? '#14f195' : '#ff4444';

    console.groupCollapsed(
      `%c${emoji} ${status}%c ${endpoint} %c${duration}ms`,
      `color: ${color}; font-weight: bold;`,
      `color: #999;`,
      `color: #ffeb3b; font-weight: bold;`
    );

    if (data) {
      console.log('📥 Response:', data);
    }
    console.groupEnd();
  }

  /**
   * User action logger
   */
  userAction(action: string, details?: any) {
    if (!this.isDev) return;

    const style = LOG_STYLES.user;
    console.log(
      `%c👤 USER%c ${action}`,
      `background: ${style.bgColor}; color: ${style.color}; font-weight: bold; padding: 2px 6px; border-radius: 3px;`,
      `color: ${style.color};`
    );

    if (details) {
      console.log('Details:', details);
    }
  }

  /**
   * Performance timing - start
   */
  timeStart(label: string) {
    if (!this.isDev) return;
    this.timers.set(label, performance.now());
    this.log('perf', `⏱️  Started: ${label}`);
  }

  /**
   * Performance timing - end
   */
  timeEnd(label: string) {
    if (!this.isDev) return;

    const startTime = this.timers.get(label);
    if (!startTime) {
      this.warn(`No timer found for: ${label}`);
      return;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(label);

    const color = duration < 100 ? '#14f195' : duration < 500 ? '#ffa500' : '#ff4444';

    console.log(
      `%c⚡ PERF%c ${label} %c${duration.toFixed(2)}ms`,
      `background: #332e00; color: #ffeb3b; font-weight: bold; padding: 2px 6px; border-radius: 3px;`,
      `color: #999;`,
      `color: ${color}; font-weight: bold;`
    );
  }

  /**
   * Grouped logs for related operations
   */
  group(title: string, level: LogLevel = 'info') {
    if (!this.isDev) return;

    const style = LOG_STYLES[level];
    console.group(
      `%c${style.emoji} ${title}`,
      `color: ${style.color}; font-weight: bold; font-size: 1.1em;`
    );
    this.groupDepth++;
  }

  /**
   * Collapsed group
   */
  groupCollapsed(title: string, level: LogLevel = 'info') {
    if (!this.isDev) return;

    const style = LOG_STYLES[level];
    console.groupCollapsed(
      `%c${style.emoji} ${title}`,
      `color: ${style.color}; font-weight: bold;`
    );
    this.groupDepth++;
  }

  /**
   * End group
   */
  groupEnd() {
    if (!this.isDev) return;
    if (this.groupDepth > 0) {
      console.groupEnd();
      this.groupDepth--;
    }
  }

  /**
   * Table output for structured data
   */
  table(data: any[], label?: string) {
    if (!this.isDev) return;

    if (label) {
      this.info(label);
    }
    console.table(data);
  }

  /**
   * Clear console
   */
  clear() {
    if (!this.isDev) return;
    console.clear();
    this.info('Console cleared');
  }

  /**
   * Welcome banner
   */
  banner() {
    if (!this.isDev) return;

    const styles = {
      title: 'font-size: 24px; font-weight: bold; color: #9945ff; text-shadow: 2px 2px 4px rgba(153, 69, 255, 0.3);',
      subtitle: 'font-size: 14px; color: #14f195; font-weight: normal;',
      version: 'font-size: 12px; color: #666;',
    };

    console.log(
      '%c🎨 NFTSol Platform\n%cSolana NFT Marketplace with AI-Powered Features\n%cv1.0.0',
      styles.title,
      styles.subtitle,
      styles.version
    );

    console.log('\n');
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience exports
export const {
  info,
  success,
  warn,
  error,
  debug,
  api,
  apiResponse,
  userAction,
  timeStart,
  timeEnd,
  group,
  groupCollapsed,
  groupEnd,
  table,
  clear,
  banner,
} = logger;
