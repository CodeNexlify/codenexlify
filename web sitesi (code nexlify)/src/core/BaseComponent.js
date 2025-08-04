/**
 * Base Component Class
 * Foundation class for all application components
 * Provides lifecycle management, event handling, and state management
 */

import { EventBus } from './EventBus.js';
import { Logger } from '../utils/Logger.js';

export class BaseComponent {
  constructor(options = {}) {
    // Component identification
    this.id = options.id || this.generateId();
    this.name = options.name || this.constructor.name;
    
    // Logger instance
    this.logger = new Logger(this.name);
    
    // Component state
    this.state = {
      initialized: false,
      mounted: false,
      destroyed: false,
      loading: false,
      error: null,
      ...options.initialState
    };
    
    // Configuration
    this.config = {
      autoMount: true,
      enableEvents: true,
      enableStateTracking: true,
      debugMode: process.env.NODE_ENV === 'development',
      ...options.config
    };
    
    // DOM references
    this.element = null;
    this.container = options.container || null;
    
    // Event listeners registry
    this.eventListeners = new Map();
    this.domEventListeners = new Map();
    
    // Child components
    this.children = new Map();
    
    // Parent component reference
    this.parent = options.parent || null;
    
    // Dependencies
    this.dependencies = options.dependencies || [];
    
    // Lifecycle hooks
    this.hooks = {
      beforeInit: [],
      afterInit: [],
      beforeMount: [],
      afterMount: [],
      beforeUpdate: [],
      afterUpdate: [],
      beforeDestroy: [],
      afterDestroy: []
    };
    
    // Performance tracking
    this.performance = {
      initTime: 0,
      mountTime: 0,
      renderTime: 0,
      updateCount: 0
    };
    
    this.logger.debug(`🏗️ Component created: ${this.name} (ID: ${this.id})`);
  }

  /**
   * Generate unique component ID
   */
  generateId() {
    return `component_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize component
   */
  async init() {
    if (this.state.initialized) {
      this.logger.warn('⚠️ Component already initialized');
      return this;
    }

    try {
      const startTime = performance.now();
      
      this.logger.info(`🚀 Initializing component: ${this.name}`);
      
      // Run before init hooks
      await this.runHooks('beforeInit');
      
      // Check dependencies
      await this.checkDependencies();
      
      // Initialize component-specific logic
      await this.onInit();
      
      // Setup event listeners if enabled
      if (this.config.enableEvents) {
        this.setupEventListeners();
      }
      
      // Mark as initialized
      this.setState({ initialized: true });
      
      // Track performance
      this.performance.initTime = performance.now() - startTime;
      
      // Run after init hooks
      await this.runHooks('afterInit');
      
      // Auto-mount if enabled
      if (this.config.autoMount && this.container) {
        await this.mount();
      }
      
      this.logger.success(`✅ Component initialized: ${this.name} (${this.performance.initTime.toFixed(2)}ms)`);
      
      // Emit initialization event
      this.emit('component:initialized', { component: this });
      
      return this;
      
    } catch (error) {
      this.setState({ error });
      this.logger.error(`❌ Failed to initialize component: ${this.name}`, error);
      this.emit('component:error', { component: this, error });
      throw error;
    }
  }

  /**
   * Component-specific initialization logic (override in subclasses)
   */
  async onInit() {
    // Override in subclasses
  }

  /**
   * Mount component to DOM
   */
  async mount(container = null) {
    if (this.state.mounted) {
      this.logger.warn('⚠️ Component already mounted');
      return this;
    }

    if (!this.state.initialized) {
      await this.init();
    }

    try {
      const startTime = performance.now();
      
      this.logger.info(`📌 Mounting component: ${this.name}`);
      
      // Set container
      if (container) {
        this.container = container;
      }
      
      if (!this.container) {
        throw new Error('No container specified for mounting');
      }
      
      // Run before mount hooks
      await this.runHooks('beforeMount');
      
      // Create DOM element
      await this.createElement();
      
      // Mount component-specific logic
      await this.onMount();
      
      // Append to container
      if (this.element && this.container) {
        if (typeof this.container === 'string') {
          this.container = document.querySelector(this.container);
        }
        
        if (this.container) {
          this.container.appendChild(this.element);
        }
      }
      
      // Setup DOM event listeners
      this.setupDOMEventListeners();
      
      // Mark as mounted
      this.setState({ mounted: true });
      
      // Track performance
      this.performance.mountTime = performance.now() - startTime;
      
      // Run after mount hooks
      await this.runHooks('afterMount');
      
      this.logger.success(`✅ Component mounted: ${this.name} (${this.performance.mountTime.toFixed(2)}ms)`);
      
      // Emit mount event
      this.emit('component:mounted', { component: this });
      
      return this;
      
    } catch (error) {
      this.setState({ error });
      this.logger.error(`❌ Failed to mount component: ${this.name}`, error);
      this.emit('component:error', { component: this, error });
      throw error;
    }
  }

  /**
   * Component-specific mount logic (override in subclasses)
   */
  async onMount() {
    // Override in subclasses
  }

  /**
   * Create DOM element (override in subclasses)
   */
  async createElement() {
    if (!this.element) {
      this.element = document.createElement('div');
      this.element.className = `component component--${this.name.toLowerCase()}`;
      this.element.setAttribute('data-component-id', this.id);
    }
  }

  /**
   * Update component
   */
  async update(newState = {}) {
    if (!this.state.initialized) {
      this.logger.warn('⚠️ Cannot update uninitialized component');
      return this;
    }

    try {
      const startTime = performance.now();
      
      this.logger.debug(`🔄 Updating component: ${this.name}`);
      
      // Run before update hooks
      await this.runHooks('beforeUpdate', { newState });
      
      // Update state
      const oldState = { ...this.state };
      this.setState(newState);
      
      // Component-specific update logic
      await this.onUpdate(oldState, this.state);
      
      // Re-render if mounted
      if (this.state.mounted) {
        await this.render();
      }
      
      // Track performance
      this.performance.renderTime = performance.now() - startTime;
      this.performance.updateCount++;
      
      // Run after update hooks
      await this.runHooks('afterUpdate', { oldState, newState: this.state });
      
      this.logger.debug(`✅ Component updated: ${this.name} (${this.performance.renderTime.toFixed(2)}ms)`);
      
      // Emit update event
      this.emit('component:updated', { 
        component: this, 
        oldState, 
        newState: this.state 
      });
      
      return this;
      
    } catch (error) {
      this.setState({ error });
      this.logger.error(`❌ Failed to update component: ${this.name}`, error);
      this.emit('component:error', { component: this, error });
      throw error;
    }
  }

  /**
   * Component-specific update logic (override in subclasses)
   */
  async onUpdate(oldState, newState) {
    // Override in subclasses
  }

  /**
   * Render component (override in subclasses)
   */
  async render() {
    if (!this.element) {
      await this.createElement();
    }
    
    // Override in subclasses for custom rendering
    return this.element;
  }

  /**
   * Destroy component
   */
  async destroy() {
    if (this.state.destroyed) {
      this.logger.warn('⚠️ Component already destroyed');
      return;
    }

    try {
      this.logger.info(`🗑️ Destroying component: ${this.name}`);
      
      // Run before destroy hooks
      await this.runHooks('beforeDestroy');
      
      // Destroy child components
      for (const [childId, child] of this.children) {
        if (child.destroy && typeof child.destroy === 'function') {
          await child.destroy();
        }
      }
      this.children.clear();
      
      // Component-specific cleanup
      await this.onDestroy();
      
      // Remove from DOM
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      
      // Remove event listeners
      this.removeAllEventListeners();
      this.removeAllDOMEventListeners();
      
      // Mark as destroyed
      this.setState({ 
        destroyed: true, 
        mounted: false, 
        initialized: false 
      });
      
      // Run after destroy hooks
      await this.runHooks('afterDestroy');
      
      this.logger.success(`✅ Component destroyed: ${this.name}`);
      
      // Emit destroy event
      this.emit('component:destroyed', { component: this });
      
    } catch (error) {
      this.logger.error(`❌ Failed to destroy component: ${this.name}`, error);
      this.emit('component:error', { component: this, error });
    }
  }

  /**
   * Component-specific cleanup logic (override in subclasses)
   */
  async onDestroy() {
    // Override in subclasses
  }

  /**
   * Set component state
   */
  setState(newState) {
    if (!this.config.enableStateTracking) {
      return;
    }
    
    const oldState = { ...this.state };
    this.state = { ...this.state, ...newState };
    
    if (this.config.debugMode) {
      this.logger.debug(`🔄 State updated:`, {
        component: this.name,
        oldState,
        newState: this.state,
        changes: newState
      });
    }
    
    // Emit state change event
    this.emit('state:changed', {
      component: this,
      oldState,
      newState: this.state,
      changes: newState
    });
  }

  /**
   * Get component state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Check if component has specific state
   */
  hasState(stateName) {
    return this.state.hasOwnProperty(stateName);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Override in subclasses to add specific event listeners
  }

  /**
   * Setup DOM event listeners
   */
  setupDOMEventListeners() {
    // Override in subclasses to add DOM event listeners
  }

  /**
   * Add event listener
   */
  on(eventName, callback, options = {}) {
    const listenerId = EventBus.on(eventName, callback, {
      ...options,
      context: this
    });
    
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    
    this.eventListeners.get(eventName).push(listenerId);
    
    return listenerId;
  }

  /**
   * Remove event listener
   */
  off(eventName, listenerId) {
    const success = EventBus.off(eventName, listenerId);
    
    if (this.eventListeners.has(eventName)) {
      const listeners = this.eventListeners.get(eventName);
      const index = listeners.indexOf(listenerId);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
    
    return success;
  }

  /**
   * Emit event
   */
  emit(eventName, data = {}) {
    return EventBus.emit(eventName, {
      ...data,
      source: this
    });
  }

  /**
   * Add DOM event listener
   */
  addDOMEventListener(element, eventType, callback, options = {}) {
    if (!element) return;
    
    const wrappedCallback = (event) => {
      try {
        callback.call(this, event);
      } catch (error) {
        this.logger.error(`❌ Error in DOM event handler (${eventType}):`, error);
        this.emit('component:error', { component: this, error });
      }
    };
    
    element.addEventListener(eventType, wrappedCallback, options);
    
    const key = `${element.tagName || 'unknown'}_${eventType}`;
    if (!this.domEventListeners.has(key)) {
      this.domEventListeners.set(key, []);
    }
    
    this.domEventListeners.get(key).push({
      element,
      eventType,
      callback: wrappedCallback,
      options
    });
  }

  /**
   * Remove all event listeners
   */
  removeAllEventListeners() {
    for (const [eventName, listeners] of this.eventListeners) {
      listeners.forEach(listenerId => {
        EventBus.off(eventName, listenerId);
      });
    }
    this.eventListeners.clear();
  }

  /**
   * Remove all DOM event listeners
   */
  removeAllDOMEventListeners() {
    for (const [key, listeners] of this.domEventListeners) {
      listeners.forEach(({ element, eventType, callback, options }) => {
        if (element && element.removeEventListener) {
          element.removeEventListener(eventType, callback, options);
        }
      });
    }
    this.domEventListeners.clear();
  }

  /**
   * Add child component
   */
  addChild(child, id = null) {
    if (!child || typeof child !== 'object') {
      this.logger.warn('⚠️ Invalid child component');
      return false;
    }
    
    const childId = id || child.id || this.generateId();
    child.parent = this;
    this.children.set(childId, child);
    
    this.logger.debug(`👶 Child component added: ${childId}`);
    this.emit('child:added', { parent: this, child, childId });
    
    return childId;
  }

  /**
   * Remove child component
   */
  removeChild(childId) {
    if (!this.children.has(childId)) {
      return false;
    }
    
    const child = this.children.get(childId);
    if (child.destroy && typeof child.destroy === 'function') {
      child.destroy();
    }
    
    this.children.delete(childId);
    
    this.logger.debug(`🗑️ Child component removed: ${childId}`);
    this.emit('child:removed', { parent: this, child, childId });
    
    return true;
  }

  /**
   * Get child component
   */
  getChild(childId) {
    return this.children.get(childId);
  }

  /**
   * Get all children
   */
  getChildren() {
    return new Map(this.children);
  }

  /**
   * Check dependencies
   */
  async checkDependencies() {
    if (this.dependencies.length === 0) {
      return true;
    }
    
    this.logger.debug(`🔍 Checking dependencies: ${this.dependencies.join(', ')}`);
    
    for (const dependency of this.dependencies) {
      // Check if dependency is available
      // This could be extended to check for specific components, APIs, etc.
      if (typeof dependency === 'string' && !window[dependency]) {
        throw new Error(`Missing dependency: ${dependency}`);
      }
    }
    
    return true;
  }

  /**
   * Add lifecycle hook
   */
  addHook(hookName, callback) {
    if (!this.hooks[hookName]) {
      this.hooks[hookName] = [];
    }
    
    this.hooks[hookName].push(callback);
  }

  /**
   * Run lifecycle hooks
   */
  async runHooks(hookName, data = {}) {
    if (!this.hooks[hookName]) {
      return;
    }
    
    for (const hook of this.hooks[hookName]) {
      try {
        if (typeof hook === 'function') {
          await hook.call(this, data);
        }
      } catch (error) {
        this.logger.error(`❌ Error in ${hookName} hook:`, error);
      }
    }
  }

  /**
   * Get component info
   */
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      state: this.getState(),
      config: this.config,
      performance: this.performance,
      childrenCount: this.children.size,
      hasParent: !!this.parent,
      dependencies: this.dependencies,
      element: !!this.element,
      container: !!this.container
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      ...this.performance,
      averageRenderTime: this.performance.updateCount > 0 
        ? this.performance.renderTime / this.performance.updateCount 
        : 0
    };
  }

  /**
   * Clone component (shallow clone)
   */
  clone(options = {}) {
    const CloneClass = this.constructor;
    return new CloneClass({
      ...this.config,
      ...options,
      initialState: { ...this.state, ...options.initialState }
    });
  }

  /**
   * Serialize component state
   */
  serialize() {
    return {
      id: this.id,
      name: this.name,
      state: this.getState(),
      config: this.config,
      performance: this.performance
    };
  }

  /**
   * Check if component is ready
   */
  isReady() {
    return this.state.initialized && !this.state.destroyed && !this.state.error;
  }

  /**
   * Check if component is mounted
   */
  isMounted() {
    return this.state.mounted && !this.state.destroyed;
  }

  /**
   * Check if component has error
   */
  hasError() {
    return !!this.state.error;
  }

  /**
   * Clear error state
   */
  clearError() {
    this.setState({ error: null });
  }

  /**
   * Cleanup alias for destroy
   */
  cleanup() {
    return this.destroy();
  }
}