/**
 * Logger Utility
 * Centralized logging system with different levels and formatting
 */

export class Logger {
  constructor(context = 'App') {
    this.context = context;
    this.levels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3,
      SUCCESS: 4
    };
    
    this.currentLevel = process.env.NODE_ENV === 'development' 
      ? this.levels.DEBUG 
      : this.levels.INFO;
    
    this.colors = {
      ERROR: '#ff4757',
      WARN: '#ffa502',
      INFO: '#3742fa',
      DEBUG: '#747d8c',
      SUCCESS: '#2ed573'
    };
    
    this.icons = {
      ERROR: '❌',
      WARN: '⚠️',
      INFO: 'ℹ️',
      DEBUG: '🐛',
      SUCCESS: '✅'
    };
  }

  /**
   * Set logging level
   */
  setLevel(level) {
    if (typeof level === 'string') {
      level = this.levels[level.toUpperCase()];
    }
    
    if (level !== undefined) {
      this.currentLevel = level;
    }
  }

  /**
   * Check if level should be logged
   */
  shouldLog(level) {
    return level <= this.currentLevel;
  }

  /**
   * Format log message
   */
  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const levelName = Object.keys(this.levels)[level];
    const icon = this.icons[levelName];
    const color = this.colors[levelName];
    
    return {
      timestamp,
      level: levelName,
      context: this.context,
      icon,
      color,
      message,
      args
    };
  }

  /**
   * Log message to console
   */
  logToConsole(logData) {
    const { timestamp, level, context, icon, color, message, args } = logData;
    
    const prefix = `${icon} [${timestamp}] [${context}] [${level}]`;
    
    if (typeof message === 'string') {
      console.log(
        `%c${prefix} ${message}`,
        `color: ${color}; font-weight: bold;`,
        ...args
      );
    } else {
      console.log(
        `%c${prefix}`,
        `color: ${color}; font-weight: bold;`,
        message,
        ...args
      );
    }
  }

  /**
   * Log message to external service (if configured)
   */
  logToService(logData) {
    // This could send logs to external services like LogRocket, Sentry, etc.
    if (window.gtag && logData.level === 'ERROR') {
      window.gtag('event', 'exception', {
        description: logData.message,
        fatal: false
      });
    }
  }

  /**
   * Store log in memory for debugging
   */
  storeLog(logData) {
    if (!window.CodeNexlifyLogs) {
      window.CodeNexlifyLogs = [];
    }
    
    window.CodeNexlifyLogs.push(logData);
    
    // Keep only last 100 logs
    if (window.CodeNexlifyLogs.length > 100) {
      window.CodeNexlifyLogs.shift();
    }
  }

  /**
   * Generic log method
   */
  log(level, message, ...args) {
    if (!this.shouldLog(level)) {
      return;
    }
    
    const logData = this.formatMessage(level, message, ...args);
    
    // Log to console
    this.logToConsole(logData);
    
    // Store in memory
    this.storeLog(logData);
    
    // Log to external service
    this.logToService(logData);
  }

  /**
   * Error logging
   */
  error(message, ...args) {
    this.log(this.levels.ERROR, message, ...args);
    
    // Also log stack trace if error object is provided
    if (args.length > 0 && args[0] instanceof Error) {
      console.trace(args[0]);
    }
  }

  /**
   * Warning logging
   */
  warn(message, ...args) {
    this.log(this.levels.WARN, message, ...args);
  }

  /**
   * Info logging
   */
  info(message, ...args) {
    this.log(this.levels.INFO, message, ...args);
  }

  /**
   * Debug logging
   */
  debug(message, ...args) {
    this.log(this.levels.DEBUG, message, ...args);
  }

  /**
   * Success logging
   */
  success(message, ...args) {
    this.log(this.levels.SUCCESS, message, ...args);
  }

  /**
   * Group logging
   */
  group(title, callback) {
    if (!this.shouldLog(this.levels.INFO)) {
      return;
    }
    
    console.group(`🔍 ${title}`);
    
    try {
      if (typeof callback === 'function') {
        callback();
      }
    } finally {
      console.groupEnd();
    }
  }

  /**
   * Table logging
   */
  table(data, columns) {
    if (!this.shouldLog(this.levels.INFO)) {
      return;
    }
    
    console.table(data, columns);
  }

  /**
   * Time logging
   */
  time(label) {
    if (!this.shouldLog(this.levels.DEBUG)) {
      return;
    }
    
    console.time(`⏱️ ${this.context}: ${label}`);
  }

  /**
   * End time logging
   */
  timeEnd(label) {
    if (!this.shouldLog(this.levels.DEBUG)) {
      return;
    }
    
    console.timeEnd(`⏱️ ${this.context}: ${label}`);
  }

  /**
   * Performance mark
   */
  mark(name) {
    if ('performance' in window && performance.mark) {
      performance.mark(`${this.context}-${name}`);
      this.debug(`Performance mark: ${name}`);
    }
  }

  /**
   * Performance measure
   */
  measure(name, startMark, endMark) {
    if ('performance' in window && performance.measure) {
      const start = `${this.context}-${startMark}`;
      const end = `${this.context}-${endMark}`;
      
      try {
        performance.measure(`${this.context}-${name}`, start, end);
        const measure = performance.getEntriesByName(`${this.context}-${name}`)[0];
        this.info(`Performance measure: ${name} = ${measure.duration.toFixed(2)}ms`);
      } catch (error) {
        this.warn(`Failed to measure performance: ${name}`, error);
      }
    }
  }

  /**
   * Assert logging
   */
  assert(condition, message, ...args) {
    if (!condition) {
      this.error(`Assertion failed: ${message}`, ...args);
      console.assert(condition, message, ...args);
    }
  }

  /**
   * Count logging
   */
  count(label = 'default') {
    if (!this.shouldLog(this.levels.DEBUG)) {
      return;
    }
    
    console.count(`🔢 ${this.context}: ${label}`);
  }

  /**
   * Reset count
   */
  countReset(label = 'default') {
    if (!this.shouldLog(this.levels.DEBUG)) {
      return;
    }
    
    console.countReset(`🔢 ${this.context}: ${label}`);
  }

  /**
   * Clear console
   */
  clear() {
    if (this.shouldLog(this.levels.DEBUG)) {
      console.clear();
      this.info('Console cleared');
    }
  }

  /**
   * Create child logger with extended context
   */
  child(childContext) {
    const fullContext = `${this.context}:${childContext}`;
    const childLogger = new Logger(fullContext);
    childLogger.setLevel(this.currentLevel);
    return childLogger;
  }

  /**
   * Get stored logs
   */
  getLogs(filter = {}) {
    if (!window.CodeNexlifyLogs) {
      return [];
    }
    
    let logs = window.CodeNexlifyLogs;
    
    // Filter by context
    if (filter.context) {
      logs = logs.filter(log => log.context === filter.context);
    }
    
    // Filter by level
    if (filter.level) {
      logs = logs.filter(log => log.level === filter.level.toUpperCase());
    }
    
    // Filter by time range
    if (filter.since) {
      const since = new Date(filter.since);
      logs = logs.filter(log => new Date(log.timestamp) >= since);
    }
    
    return logs;
  }

  /**
   * Export logs as JSON
   */
  exportLogs(filter = {}) {
    const logs = this.getLogs(filter);
    const exportData = {
      exported: new Date().toISOString(),
      filter,
      count: logs.length,
      logs
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Download logs as file
   */
  downloadLogs(filename = 'codenexlify-logs.json', filter = {}) {
    const data = this.exportLogs(filter);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.info(`Logs downloaded: ${filename}`);
  }

  /**
   * Clear stored logs
   */
  clearLogs() {
    if (window.CodeNexlifyLogs) {
      window.CodeNexlifyLogs = [];
      this.info('Stored logs cleared');
    }
  }

  /**
   * Get logger statistics
   */
  getStats() {
    const logs = this.getLogs();
    const stats = {
      total: logs.length,
      byLevel: {},
      byContext: {},
      timeRange: {
        oldest: null,
        newest: null
      }
    };
    
    logs.forEach(log => {
      // Count by level
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      
      // Count by context
      stats.byContext[log.context] = (stats.byContext[log.context] || 0) + 1;
      
      // Track time range
      const timestamp = new Date(log.timestamp);
      if (!stats.timeRange.oldest || timestamp < new Date(stats.timeRange.oldest)) {
        stats.timeRange.oldest = log.timestamp;
      }
      if (!stats.timeRange.newest || timestamp > new Date(stats.timeRange.newest)) {
        stats.timeRange.newest = log.timestamp;
      }
    });
    
    return stats;
  }
}

// Create default logger instance
export const logger = new Logger('CodeNexlify');

// Export logger levels for external use
export const LogLevels = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  SUCCESS: 4
};