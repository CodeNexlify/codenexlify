/**
 * BaseComponent Tests
 * Comprehensive test suite for the base component class
 */

import { BaseComponent } from '../BaseComponent.js';
import { EventBus } from '../EventBus.js';

// Mock Logger
jest.mock('../../utils/Logger.js', () => ({
  Logger: jest.fn().mockImplementation((context) => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    success: jest.fn()
  }))
}));

describe('BaseComponent', () => {
  let component;
  let container;

  beforeEach(() => {
    // Create a container element
    container = document.createElement('div');
    document.body.appendChild(container);
    
    // Create component instance
    component = new BaseComponent({
      name: 'TestComponent',
      container: container
    });
  });

  afterEach(() => {
    // Cleanup
    if (component && !component.state.destroyed) {
      component.destroy();
    }
    
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    
    // Clear event bus
    EventBus.removeAllListeners();
  });

  describe('Constructor', () => {
    test('should create component with default values', () => {
      const comp = new BaseComponent();
      
      expect(comp.name).toBe('BaseComponent');
      expect(comp.id).toBeDefined();
      expect(comp.state.initialized).toBe(false);
      expect(comp.state.mounted).toBe(false);
      expect(comp.state.destroyed).toBe(false);
    });

    test('should create component with custom options', () => {
      const options = {
        name: 'CustomComponent',
        id: 'custom-id',
        initialState: { customProp: 'value' },
        config: { autoMount: false }
      };
      
      const comp = new BaseComponent(options);
      
      expect(comp.name).toBe('CustomComponent');
      expect(comp.id).toBe('custom-id');
      expect(comp.state.customProp).toBe('value');
      expect(comp.config.autoMount).toBe(false);
    });

    test('should generate unique IDs', () => {
      const comp1 = new BaseComponent();
      const comp2 = new BaseComponent();
      
      expect(comp1.id).not.toBe(comp2.id);
    });
  });

  describe('Lifecycle Methods', () => {
    test('should initialize component', async () => {
      expect(component.state.initialized).toBe(false);
      
      await component.init();
      
      expect(component.state.initialized).toBe(true);
      expect(component.performance.initTime).toBeGreaterThan(0);
    });

    test('should not initialize twice', async () => {
      await component.init();
      const firstInitTime = component.performance.initTime;
      
      await component.init();
      
      expect(component.performance.initTime).toBe(firstInitTime);
    });

    test('should mount component', async () => {
      await component.init();
      await component.mount();
      
      expect(component.state.mounted).toBe(true);
      expect(component.element).toBeDefined();
      expect(container.children.length).toBe(1);
    });

    test('should auto-mount if enabled', async () => {
      component.config.autoMount = true;
      
      await component.init();
      
      expect(component.state.mounted).toBe(true);
    });

    test('should update component', async () => {
      await component.init();
      
      const newState = { testProp: 'testValue' };
      await component.update(newState);
      
      expect(component.state.testProp).toBe('testValue');
      expect(component.performance.updateCount).toBe(1);
    });

    test('should destroy component', async () => {
      await component.init();
      await component.mount();
      
      await component.destroy();
      
      expect(component.state.destroyed).toBe(true);
      expect(component.state.mounted).toBe(false);
      expect(container.children.length).toBe(0);
    });
  });

  describe('State Management', () => {
    test('should set and get state', () => {
      const newState = { prop1: 'value1', prop2: 'value2' };
      
      component.setState(newState);
      
      expect(component.getState().prop1).toBe('value1');
      expect(component.getState().prop2).toBe('value2');
    });

    test('should emit state change events', () => {
      const mockCallback = jest.fn();
      EventBus.on('state:changed', mockCallback);
      
      component.setState({ testProp: 'testValue' });
      
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          component: component,
          changes: { testProp: 'testValue' }
        })
      );
    });

    test('should check if has state', () => {
      component.setState({ existingProp: 'value' });
      
      expect(component.hasState('existingProp')).toBe(true);
      expect(component.hasState('nonExistentProp')).toBe(false);
    });
  });

  describe('Event Handling', () => {
    test('should add and remove event listeners', () => {
      const mockCallback = jest.fn();
      
      const listenerId = component.on('test:event', mockCallback);
      component.emit('test:event', { data: 'test' });
      
      expect(mockCallback).toHaveBeenCalled();
      
      component.off('test:event', listenerId);
      component.emit('test:event', { data: 'test2' });
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    test('should emit events with source', () => {
      const mockCallback = jest.fn();
      EventBus.on('test:event', mockCallback);
      
      component.emit('test:event', { data: 'test' });
      
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          source: component,
          data: 'test'
        })
      );
    });

    test('should handle DOM events', async () => {
      await component.init();
      await component.mount();
      
      const mockCallback = jest.fn();
      component.addDOMEventListener(component.element, 'click', mockCallback);
      
      // Simulate click
      const clickEvent = new Event('click');
      component.element.dispatchEvent(clickEvent);
      
      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe('Child Management', () => {
    test('should add and remove child components', () => {
      const childComponent = new BaseComponent({ name: 'ChildComponent' });
      
      const childId = component.addChild(childComponent);
      
      expect(component.children.has(childId)).toBe(true);
      expect(childComponent.parent).toBe(component);
      
      component.removeChild(childId);
      
      expect(component.children.has(childId)).toBe(false);
    });

    test('should get child components', () => {
      const childComponent = new BaseComponent({ name: 'ChildComponent' });
      const childId = component.addChild(childComponent, 'custom-child-id');
      
      expect(component.getChild('custom-child-id')).toBe(childComponent);
      expect(component.getChildren().size).toBe(1);
    });

    test('should destroy child components when parent is destroyed', async () => {
      const childComponent = new BaseComponent({ name: 'ChildComponent' });
      childComponent.destroy = jest.fn();
      
      component.addChild(childComponent);
      await component.destroy();
      
      expect(childComponent.destroy).toHaveBeenCalled();
    });
  });

  describe('Hooks', () => {
    test('should add and run lifecycle hooks', async () => {
      const beforeInitHook = jest.fn();
      const afterInitHook = jest.fn();
      
      component.addHook('beforeInit', beforeInitHook);
      component.addHook('afterInit', afterInitHook);
      
      await component.init();
      
      expect(beforeInitHook).toHaveBeenCalled();
      expect(afterInitHook).toHaveBeenCalled();
    });

    test('should handle hook errors gracefully', async () => {
      const errorHook = jest.fn(() => {
        throw new Error('Hook error');
      });
      
      component.addHook('beforeInit', errorHook);
      
      // Should not throw
      await expect(component.init()).resolves.toBeDefined();
    });
  });

  describe('Utility Methods', () => {
    test('should check component status', async () => {
      expect(component.isReady()).toBe(false);
      expect(component.isMounted()).toBe(false);
      
      await component.init();
      expect(component.isReady()).toBe(true);
      
      await component.mount();
      expect(component.isMounted()).toBe(true);
      
      await component.destroy();
      expect(component.isReady()).toBe(false);
      expect(component.isMounted()).toBe(false);
    });

    test('should handle errors', () => {
      const error = new Error('Test error');
      component.setState({ error });
      
      expect(component.hasError()).toBe(true);
      
      component.clearError();
      
      expect(component.hasError()).toBe(false);
    });

    test('should get component info', async () => {
      await component.init();
      
      const info = component.getInfo();
      
      expect(info).toMatchObject({
        id: component.id,
        name: component.name,
        state: expect.any(Object),
        config: expect.any(Object),
        performance: expect.any(Object)
      });
    });

    test('should get performance metrics', async () => {
      await component.init();
      await component.update({ test: 'value' });
      
      const metrics = component.getPerformanceMetrics();
      
      expect(metrics.initTime).toBeGreaterThan(0);
      expect(metrics.updateCount).toBe(1);
      expect(metrics.averageRenderTime).toBeGreaterThanOrEqual(0);
    });

    test('should serialize component', () => {
      const serialized = component.serialize();
      
      expect(serialized).toMatchObject({
        id: component.id,
        name: component.name,
        state: expect.any(Object),
        config: expect.any(Object),
        performance: expect.any(Object)
      });
    });

    test('should clone component', () => {
      const cloned = component.clone({ name: 'ClonedComponent' });
      
      expect(cloned).toBeInstanceOf(BaseComponent);
      expect(cloned.name).toBe('ClonedComponent');
      expect(cloned.id).not.toBe(component.id);
    });
  });

  describe('Error Handling', () => {
    test('should handle initialization errors', async () => {
      // Mock onInit to throw error
      component.onInit = jest.fn().mockRejectedValue(new Error('Init error'));
      
      await expect(component.init()).rejects.toThrow('Init error');
      expect(component.state.error).toBeDefined();
    });

    test('should handle mount errors', async () => {
      await component.init();
      
      // Mock onMount to throw error
      component.onMount = jest.fn().mockRejectedValue(new Error('Mount error'));
      
      await expect(component.mount()).rejects.toThrow('Mount error');
      expect(component.state.error).toBeDefined();
    });

    test('should emit error events', async () => {
      const errorCallback = jest.fn();
      EventBus.on('component:error', errorCallback);
      
      component.onInit = jest.fn().mockRejectedValue(new Error('Test error'));
      
      try {
        await component.init();
      } catch (error) {
        // Expected to throw
      }
      
      expect(errorCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          component: component,
          error: expect.any(Error)
        })
      );
    });
  });

  describe('Configuration', () => {
    test('should respect autoMount configuration', async () => {
      const comp = new BaseComponent({
        container: container,
        config: { autoMount: false }
      });
      
      await comp.init();
      
      expect(comp.state.mounted).toBe(false);
    });

    test('should respect enableEvents configuration', async () => {
      const comp = new BaseComponent({
        config: { enableEvents: false }
      });
      
      comp.setupEventListeners = jest.fn();
      
      await comp.init();
      
      expect(comp.setupEventListeners).not.toHaveBeenCalled();
    });

    test('should respect enableStateTracking configuration', () => {
      const comp = new BaseComponent({
        config: { enableStateTracking: false }
      });
      
      comp.setState({ test: 'value' });
      
      expect(comp.state.test).toBeUndefined();
    });
  });
});