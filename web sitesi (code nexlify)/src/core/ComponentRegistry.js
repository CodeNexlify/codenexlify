/**
 * Component Registry
 * Manages component registration and instantiation
 */

import { Logger } from '../utils/Logger.js';

export class ComponentRegistry {
  constructor() {
    this.logger = new Logger('ComponentRegistry');
    this.components = new Map();
    this.instances = new Map();
  }

  /**
   * Get singleton instance
   */
  static getInstance() {
    if (!ComponentRegistry.instance) {
      ComponentRegistry.instance = new ComponentRegistry();
    }
    return ComponentRegistry.instance;
  }

  /**
   * Register a component
   */
  register(name, ComponentClass, options = {}) {
    if (this.components.has(name)) {
      this.logger.warn(`⚠️ Component '${name}' is already registered. Overwriting...`);
    }

    this.components.set(name, {
      ComponentClass,
      options,
      registered: Date.now()
    });

    this.logger.info(`📦 Component '${name}' registered successfully`);
  }

  /**
   * Unregister a component
   */
  unregister(name) {
    if (!this.components.has(name)) {
      this.logger.warn(`⚠️ Component '${name}' is not registered`);
      return false;
    }

    // Cleanup instance if exists
    if (this.instances.has(name)) {
      const instance = this.instances.get(name);
      if (instance.cleanup && typeof instance.cleanup === 'function') {
        instance.cleanup();
      }
      this.instances.delete(name);
    }

    this.components.delete(name);
    this.logger.info(`🗑️ Component '${name}' unregistered successfully`);
    return true;
  }

  /**
   * Get component class
   */
  get(name) {
    const component = this.components.get(name);
    return component ? component.ComponentClass : null;
  }

  /**
   * Get component instance (create if not exists)
   */
  getInstance(name, ...args) {
    if (!this.components.has(name)) {
      this.logger.error(`❌ Component '${name}' is not registered`);
      return null;
    }

    // Return existing instance if available
    if (this.instances.has(name)) {
      return this.instances.get(name);
    }

    // Create new instance
    try {
      const { ComponentClass, options } = this.components.get(name);
      const instance = new ComponentClass(options, ...args);
      
      this.instances.set(name, instance);
      this.logger.info(`🏗️ Component '${name}' instance created`);
      
      return instance;
    } catch (error) {
      this.logger.error(`❌ Failed to create instance of '${name}':`, error);
      return null;
    }
  }

  /**
   * Check if component is registered
   */
  has(name) {
    return this.components.has(name);
  }

  /**
   * Get all registered components
   */
  getAll() {
    const result = new Map();
    for (const [name, { ComponentClass }] of this.components) {
      result.set(name, ComponentClass);
    }
    return result;
  }

  /**
   * Get all component instances
   */
  getAllInstances() {
    return new Map(this.instances);
  }

  /**
   * Get component metadata
   */
  getMetadata(name) {
    const component = this.components.get(name);
    if (!component) {
      return null;
    }

    return {
      name,
      registered: component.registered,
      options: component.options,
      hasInstance: this.instances.has(name),
      instanceCreated: this.instances.has(name) ? Date.now() : null
    };
  }

  /**
   * Get all components metadata
   */
  getAllMetadata() {
    const metadata = [];
    for (const [name] of this.components) {
      metadata.push(this.getMetadata(name));
    }
    return metadata;
  }

  /**
   * Initialize all registered components
   */
  async initializeAll() {
    this.logger.info('🚀 Initializing all registered components...');
    
    const results = [];
    for (const [name] of this.components) {
      try {
        const instance = this.getInstance(name);
        if (instance && instance.init && typeof instance.init === 'function') {
          await instance.init();
          results.push({ name, success: true });
          this.logger.success(`✅ Component '${name}' initialized`);
        } else {
          results.push({ name, success: true, note: 'No init method' });
        }
      } catch (error) {
        results.push({ name, success: false, error });
        this.logger.error(`❌ Failed to initialize component '${name}':`, error);
      }
    }

    const successful = results.filter(r => r.success).length;
    const total = results.length;
    
    this.logger.info(`📊 Component initialization complete: ${successful}/${total} successful`);
    return results;
  }

  /**
   * Cleanup all component instances
   */
  cleanupAll() {
    this.logger.info('🧹 Cleaning up all component instances...');
    
    for (const [name, instance] of this.instances) {
      try {
        if (instance.cleanup && typeof instance.cleanup === 'function') {
          instance.cleanup();
          this.logger.info(`🧹 Component '${name}' cleaned up`);
        }
      } catch (error) {
        this.logger.error(`❌ Error cleaning up component '${name}':`, error);
      }
    }

    this.instances.clear();
    this.logger.info('✅ All component instances cleaned up');
  }

  /**
   * Get component dependency graph
   */
  getDependencyGraph() {
    const graph = {};
    
    for (const [name, instance] of this.instances) {
      graph[name] = {
        dependencies: instance.dependencies || [],
        dependents: []
      };
    }

    // Calculate dependents
    for (const [name, data] of Object.entries(graph)) {
      data.dependencies.forEach(dep => {
        if (graph[dep]) {
          graph[dep].dependents.push(name);
        }
      });
    }

    return graph;
  }

  /**
   * Validate component dependencies
   */
  validateDependencies() {
    const graph = this.getDependencyGraph();
    const issues = [];

    for (const [name, data] of Object.entries(graph)) {
      // Check for missing dependencies
      data.dependencies.forEach(dep => {
        if (!this.has(dep)) {
          issues.push({
            type: 'missing_dependency',
            component: name,
            dependency: dep
          });
        }
      });

      // Check for circular dependencies (simple check)
      if (this.hasCircularDependency(name, graph)) {
        issues.push({
          type: 'circular_dependency',
          component: name
        });
      }
    }

    if (issues.length > 0) {
      this.logger.warn('⚠️ Dependency validation issues found:', issues);
    } else {
      this.logger.info('✅ All component dependencies are valid');
    }

    return issues;
  }

  /**
   * Check for circular dependencies
   */
  hasCircularDependency(componentName, graph, visited = new Set(), recursionStack = new Set()) {
    if (recursionStack.has(componentName)) {
      return true; // Circular dependency found
    }

    if (visited.has(componentName)) {
      return false; // Already processed
    }

    visited.add(componentName);
    recursionStack.add(componentName);

    const component = graph[componentName];
    if (component) {
      for (const dep of component.dependencies) {
        if (this.hasCircularDependency(dep, graph, visited, recursionStack)) {
          return true;
        }
      }
    }

    recursionStack.delete(componentName);
    return false;
  }

  /**
   * Get component load order based on dependencies
   */
  getLoadOrder() {
    const graph = this.getDependencyGraph();
    const visited = new Set();
    const loadOrder = [];

    const visit = (name) => {
      if (visited.has(name)) return;
      
      visited.add(name);
      
      const component = graph[name];
      if (component) {
        // Visit dependencies first
        component.dependencies.forEach(dep => {
          if (graph[dep]) {
            visit(dep);
          }
        });
      }
      
      loadOrder.push(name);
    };

    // Visit all components
    for (const name of Object.keys(graph)) {
      visit(name);
    }

    return loadOrder;
  }

  /**
   * Get registry statistics
   */
  getStats() {
    return {
      totalRegistered: this.components.size,
      totalInstances: this.instances.size,
      registeredComponents: Array.from(this.components.keys()),
      instantiatedComponents: Array.from(this.instances.keys()),
      memoryUsage: this.getMemoryUsage()
    };
  }

  /**
   * Get approximate memory usage
   */
  getMemoryUsage() {
    if (typeof performance !== 'undefined' && performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  /**
   * Export registry state for debugging
   */
  exportState() {
    return {
      components: Array.from(this.components.entries()).map(([name, data]) => ({
        name,
        registered: data.registered,
        options: data.options,
        hasInstance: this.instances.has(name)
      })),
      dependencyGraph: this.getDependencyGraph(),
      loadOrder: this.getLoadOrder(),
      stats: this.getStats()
    };
  }

  /**
   * Clear all components and instances
   */
  clear() {
    this.cleanupAll();
    this.components.clear();
    this.logger.info('🗑️ Component registry cleared');
  }
}