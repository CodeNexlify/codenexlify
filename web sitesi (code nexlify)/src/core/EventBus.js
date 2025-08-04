/**
 * Event Bus
 * Global event system for component communication
 */

import { Logger } from '../utils/Logger.js';

class EventBusClass {
  constructor() {
    this.logger = new Logger('EventBus');
    this.events = new Map();
    this.maxListeners = 50;
    this.debugMode = process.env.NODE_ENV === 'development';
  }

  /**
   * Add event listener
   */
  on(eventName, callback, options = {}) {
    if (typeof callback !== 'function') {
      this.logger.error(`❌ Callback for event '${eventName}' must be a function`);
      return this;
    }

    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }

    const listeners = this.events.get(eventName);
    
    // Check max listeners limit
    if (listeners.length >= this.maxListeners) {
      this.logger.warn(`⚠️ Maximum listeners (${this.maxListeners}) reached for event '${eventName}'`);
    }

    const listener = {
      callback,
      once: options.once || false,
      priority: options.priority || 0,
      context: options.context || null,
      id: this.generateListenerId(),
      added: Date.now()
    };

    listeners.push(listener);
    
    // Sort by priority (higher priority first)
    listeners.sort((a, b) => b.priority - a.priority);

    if (this.debugMode) {
      this.logger.info(`📡 Event listener added: '${eventName}' (ID: ${listener.id})`);
    }

    return listener.id;
  }

  /**
   * Add one-time event listener
   */
  once(eventName, callback, options = {}) {
    return this.on(eventName, callback, { ...options, once: true });
  }

  /**
   * Remove event listener
   */
  off(eventName, callbackOrId) {
    if (!this.events.has(eventName)) {
      return false;
    }

    const listeners = this.events.get(eventName);
    let removed = false;

    if (typeof callbackOrId === 'string') {
      // Remove by ID
      const index = listeners.findIndex(listener => listener.id === callbackOrId);
      if (index !== -1) {
        listeners.splice(index, 1);
        removed = true;
      }
    } else if (typeof callbackOrId === 'function') {
      // Remove by callback function
      const index = listeners.findIndex(listener => listener.callback === callbackOrId);
      if (index !== -1) {
        listeners.splice(index, 1);
        removed = true;
      }
    } else {
      // Remove all listeners for this event
      this.events.delete(eventName);
      removed = true;
    }

    if (removed && this.debugMode) {
      this.logger.info(`🗑️ Event listener removed: '${eventName}'`);
    }

    return removed;
  }

  /**
   * Emit event
   */
  emit(eventName, ...args) {
    if (!this.events.has(eventName)) {
      if (this.debugMode) {
        this.logger.info(`📡 No listeners for event: '${eventName}'`);
      }
      return false;
    }

    const listeners = this.events.get(eventName);
    const listenersToRemove = [];

    if (this.debugMode) {
      this.logger.info(`📡 Emitting event: '${eventName}' to ${listeners.length} listeners`);
    }

    let hasError = false;

    for (const listener of listeners) {
      try {
        // Call the callback with proper context
        if (listener.context) {
          listener.callback.call(listener.context, ...args);
        } else {
          listener.callback(...args);
        }

        // Mark for removal if it's a one-time listener
        if (listener.once) {
          listenersToRemove.push(listener);
        }
      } catch (error) {
        hasError = true;
        this.logger.error(`❌ Error in event listener for '${eventName}':`, error);
        
        // Emit error event
        this.emitError(eventName, error, listener);
      }
    }

    // Remove one-time listeners
    listenersToRemove.forEach(listener => {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    });

    return !hasError;
  }

  /**
   * Emit event asynchronously
   */
  async emitAsync(eventName, ...args) {
    if (!this.events.has(eventName)) {
      return false;
    }

    const listeners = this.events.get(eventName);
    const listenersToRemove = [];

    if (this.debugMode) {
      this.logger.info(`📡 Emitting async event: '${eventName}' to ${listeners.length} listeners`);
    }

    const promises = listeners.map(async (listener) => {
      try {
        let result;
        if (listener.context) {
          result = listener.callback.call(listener.context, ...args);
        } else {
          result = listener.callback(...args);
        }

        // Handle promise results
        if (result instanceof Promise) {
          await result;
        }

        // Mark for removal if it's a one-time listener
        if (listener.once) {
          listenersToRemove.push(listener);
        }

        return { success: true, listener };
      } catch (error) {
        this.logger.error(`❌ Error in async event listener for '${eventName}':`, error);
        this.emitError(eventName, error, listener);
        return { success: false, error, listener };
      }
    });

    const results = await Promise.allSettled(promises);

    // Remove one-time listeners
    listenersToRemove.forEach(listener => {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    });

    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;

    if (this.debugMode) {
      this.logger.info(`📡 Async event '${eventName}' completed: ${successful}/${results.length} successful`);
    }

    return successful === results.length;
  }

  /**
   * Emit error event
   */
  emitError(originalEvent, error, listener) {
    // Prevent infinite loops
    if (originalEvent === 'error') return;

    this.emit('error', {
      originalEvent,
      error,
      listener: {
        id: listener.id,
        added: listener.added
      },
      timestamp: Date.now()
    });
  }

  /**
   * Get all listeners for an event
   */
  listeners(eventName) {
    if (!this.events.has(eventName)) {
      return [];
    }

    return this.events.get(eventName).map(listener => ({
      id: listener.id,
      once: listener.once,
      priority: listener.priority,
      added: listener.added,
      context: listener.context ? listener.context.constructor.name : null
    }));
  }

  /**
   * Get all event names
   */
  eventNames() {
    return Array.from(this.events.keys());
  }

  /**
   * Get listener count for an event
   */
  listenerCount(eventName) {
    if (!this.events.has(eventName)) {
      return 0;
    }
    return this.events.get(eventName).length;
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(eventName) {
    if (eventName) {
      this.events.delete(eventName);
      if (this.debugMode) {
        this.logger.info(`🗑️ All listeners removed for event: '${eventName}'`);
      }
    } else {
      this.events.clear();
      if (this.debugMode) {
        this.logger.info('🗑️ All event listeners removed');
      }
    }
  }

  /**
   * Set maximum listeners per event
   */
  setMaxListeners(max) {
    this.maxListeners = max;
    this.logger.info(`⚙️ Maximum listeners set to: ${max}`);
  }

  /**
   * Get maximum listeners
   */
  getMaxListeners() {
    return this.maxListeners;
  }

  /**
   * Generate unique listener ID
   */
  generateListenerId() {
    return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get event bus statistics
   */
  getStats() {
    const stats = {
      totalEvents: this.events.size,
      totalListeners: 0,
      events: {}
    };

    for (const [eventName, listeners] of this.events) {
      stats.totalListeners += listeners.length;
      stats.events[eventName] = {
        listenerCount: listeners.length,
        priorities: listeners.map(l => l.priority),
        onceListeners: listeners.filter(l => l.once).length
      };
    }

    return stats;
  }

  /**
   * Debug: Log all events and listeners
   */
  debug() {
    if (!this.debugMode) {
      this.logger.warn('⚠️ Debug mode is disabled');
      return;
    }

    const stats = this.getStats();
    this.logger.info('🐛 EventBus Debug Info:', {
      stats,
      events: Object.fromEntries(this.events),
      maxListeners: this.maxListeners
    });
  }

  /**
   * Create namespaced event bus
   */
  namespace(prefix) {
    return {
      on: (eventName, callback, options) => 
        this.on(`${prefix}:${eventName}`, callback, options),
      
      once: (eventName, callback, options) => 
        this.once(`${prefix}:${eventName}`, callback, options),
      
      off: (eventName, callbackOrId) => 
        this.off(`${prefix}:${eventName}`, callbackOrId),
      
      emit: (eventName, ...args) => 
        this.emit(`${prefix}:${eventName}`, ...args),
      
      emitAsync: (eventName, ...args) => 
        this.emitAsync(`${prefix}:${eventName}`, ...args)
    };
  }

  /**
   * Create event middleware
   */
  use(middleware) {
    if (typeof middleware !== 'function') {
      this.logger.error('❌ Middleware must be a function');
      return;
    }

    const originalEmit = this.emit.bind(this);
    
    this.emit = (eventName, ...args) => {
      try {
        const result = middleware(eventName, args);
        if (result === false) {
          // Middleware blocked the event
          return false;
        }
        
        // Continue with original emit
        return originalEmit(eventName, ...args);
      } catch (error) {
        this.logger.error('❌ Error in event middleware:', error);
        return originalEmit(eventName, ...args);
      }
    };

    this.logger.info('🔧 Event middleware installed');
  }

  /**
   * Wait for event
   */
  waitFor(eventName, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.off(eventName, listenerId);
        reject(new Error(`Timeout waiting for event: ${eventName}`));
      }, timeout);

      const listenerId = this.once(eventName, (...args) => {
        clearTimeout(timeoutId);
        resolve(args);
      });
    });
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.removeAllListeners();
    this.logger.info('🧹 EventBus cleaned up');
  }
}

// Create singleton instance
export const EventBus = new EventBusClass();