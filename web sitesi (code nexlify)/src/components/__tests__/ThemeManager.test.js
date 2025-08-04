/**
 * ThemeManager Tests
 * Comprehensive test suite for the theme manager component
 */

import { ThemeManager } from '../ThemeManager.js';
import { EventBus } from '../../core/EventBus.js';

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

describe('ThemeManager', () => {
  let themeManager;
  let mockMatchMedia;

  beforeEach(() => {
    // Mock matchMedia
    mockMatchMedia = jest.fn().mockImplementation(query => ({
      matches: query.includes('dark'),
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });

    // Create theme manager instance
    themeManager = new ThemeManager();
  });

  afterEach(() => {
    // Cleanup
    if (themeManager && !themeManager.state.destroyed) {
      themeManager.destroy();
    }
    
    // Clear event bus
    EventBus.removeAllListeners();
    
    // Reset document attributes
    document.documentElement.removeAttribute('data-theme');
    document.body.className = '';
    
    // Clear localStorage
    localStorage.clear();
  });

  describe('Constructor', () => {
    test('should create theme manager with default values', () => {
      expect(themeManager.name).toBe('ThemeManager');
      expect(themeManager.state.currentTheme).toBe('light');
      expect(themeManager.state.systemPreference).toBe('light');
      expect(themeManager.config.themes).toEqual(['light', 'dark', 'auto']);
    });

    test('should create theme manager with custom options', () => {
      const customManager = new ThemeManager({
        config: {
          enableTransitions: false,
          themes: ['light', 'dark', 'custom']
        }
      });
      
      expect(customManager.config.enableTransitions).toBe(false);
      expect(customManager.config.themes).toEqual(['light', 'dark', 'custom']);
    });
  });

  describe('Initialization', () => {
    test('should initialize theme manager', async () => {
      await themeManager.init();
      
      expect(themeManager.state.initialized).toBe(true);
      expect(themeManager.toggleButton).toBeDefined();
      expect(document.body.appendChild).toHaveBeenCalled();
    });

    test('should detect system preference', async () => {
      mockMatchMedia.mockReturnValue({
        matches: true, // Dark mode
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      });
      
      await themeManager.init();
      
      expect(themeManager.state.systemPreference).toBe('dark');
      expect(themeManager.state.supportsSystemPreference).toBe(true);
    });

    test('should load saved theme from localStorage', async () => {
      localStorage.setItem('codenexlify-theme', 'dark');
      
      await themeManager.init();
      
      expect(themeManager.state.currentTheme).toBe('dark');
    });

    test('should use auto theme as default', async () => {
      await themeManager.init();
      
      expect(themeManager.state.currentTheme).toBe('auto');
    });
  });

  describe('Theme Operations', () => {
    beforeEach(async () => {
      await themeManager.init();
    });

    test('should set theme', () => {
      const result = themeManager.setTheme('dark');
      
      expect(result).toBe(true);
      expect(themeManager.state.currentTheme).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    test('should not set invalid theme', () => {
      const result = themeManager.setTheme('invalid');
      
      expect(result).toBe(false);
      expect(themeManager.state.currentTheme).not.toBe('invalid');
    });

    test('should toggle theme', () => {
      themeManager.setState({ currentTheme: 'light' });
      
      themeManager.toggleTheme();
      
      expect(themeManager.state.currentTheme).toBe('dark');
      
      themeManager.toggleTheme();
      
      expect(themeManager.state.currentTheme).toBe('auto');
    });

    test('should get effective theme', () => {
      themeManager.setState({ 
        currentTheme: 'auto',
        systemPreference: 'dark'
      });
      
      expect(themeManager.getEffectiveTheme()).toBe('dark');
      
      themeManager.setState({ currentTheme: 'light' });
      
      expect(themeManager.getEffectiveTheme()).toBe('light');
    });

    test('should check theme states', () => {
      themeManager.setState({ 
        currentTheme: 'dark',
        systemPreference: 'light'
      });
      
      expect(themeManager.isDarkTheme()).toBe(true);
      expect(themeManager.isLightTheme()).toBe(false);
      expect(themeManager.isAutoTheme()).toBe(false);
      
      themeManager.setState({ currentTheme: 'auto' });
      
      expect(themeManager.isAutoTheme()).toBe(true);
      expect(themeManager.isLightTheme()).toBe(true); // Because system preference is light
    });
  });

  describe('Theme Persistence', () => {
    beforeEach(async () => {
      await themeManager.init();
    });

    test('should save theme to localStorage', () => {
      themeManager.setTheme('dark');
      
      expect(localStorage.getItem('codenexlify-theme')).toBe('dark');
    });

    test('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn(() => {
        throw new Error('Storage error');
      });
      
      // Should not throw
      expect(() => themeManager.setTheme('dark')).not.toThrow();
      
      // Restore original
      localStorage.setItem = originalSetItem;
    });
  });

  describe('UI Updates', () => {
    beforeEach(async () => {
      await themeManager.init();
    });

    test('should update toggle button', () => {
      themeManager.setTheme('dark');
      
      expect(themeManager.toggleButton.textContent).toBe('☀️');
      expect(themeManager.toggleButton.getAttribute('aria-label')).toContain('Açık');
    });

    test('should update document attributes', () => {
      themeManager.setTheme('dark');
      
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.body.classList.contains('theme-dark')).toBe(true);
      expect(document.body.classList.contains('theme-light')).toBe(false);
    });

    test('should update meta theme-color', () => {
      themeManager.setTheme('dark');
      
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      expect(metaThemeColor).toBeDefined();
      expect(metaThemeColor.content).toBe('#1a202c');
    });
  });

  describe('Event Handling', () => {
    beforeEach(async () => {
      await themeManager.init();
    });

    test('should emit theme change events', () => {
      const mockCallback = jest.fn();
      EventBus.on('theme:changed', mockCallback);
      
      themeManager.setTheme('dark');
      
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          theme: 'dark',
          effectiveTheme: 'dark',
          component: themeManager
        })
      );
    });

    test('should handle theme set events', () => {
      themeManager.emit('theme:set', { theme: 'dark' });
      
      expect(themeManager.state.currentTheme).toBe('dark');
    });

    test('should handle theme toggle events', () => {
      const initialTheme = themeManager.state.currentTheme;
      
      themeManager.emit('theme:toggle');
      
      expect(themeManager.state.currentTheme).not.toBe(initialTheme);
    });

    test('should handle keyboard shortcuts', () => {
      const initialTheme = themeManager.state.currentTheme;
      
      // Simulate Ctrl+Shift+T
      const keyEvent = new KeyboardEvent('keydown', {
        key: 'T',
        ctrlKey: true,
        shiftKey: true
      });
      
      document.dispatchEvent(keyEvent);
      
      expect(themeManager.state.currentTheme).not.toBe(initialTheme);
    });
  });

  describe('Custom Themes', () => {
    beforeEach(async () => {
      await themeManager.init();
    });

    test('should add custom theme', () => {
      const result = themeManager.addTheme('custom', {
        css: '--primary-color: #ff0000;'
      });
      
      expect(result).toBe(true);
      expect(themeManager.config.themes).toContain('custom');
      
      const styleSheet = document.querySelector('#theme-custom');
      expect(styleSheet).toBeDefined();
    });

    test('should not add duplicate theme', () => {
      themeManager.addTheme('custom', {});
      const result = themeManager.addTheme('custom', {});
      
      expect(result).toBe(false);
    });

    test('should remove custom theme', () => {
      themeManager.addTheme('custom', {});
      const result = themeManager.removeTheme('custom');
      
      expect(result).toBe(true);
      expect(themeManager.config.themes).not.toContain('custom');
    });

    test('should not remove built-in theme', () => {
      const result = themeManager.removeTheme('light');
      
      expect(result).toBe(false);
      expect(themeManager.config.themes).toContain('light');
    });

    test('should switch to default when removing current theme', () => {
      themeManager.addTheme('custom', {});
      themeManager.setTheme('custom');
      
      themeManager.removeTheme('custom');
      
      expect(themeManager.state.currentTheme).toBe('light');
    });
  });

  describe('Configuration', () => {
    test('should respect enableTransitions config', async () => {
      const manager = new ThemeManager({
        config: { enableTransitions: false }
      });
      
      await manager.init();
      
      expect(manager.config.enableTransitions).toBe(false);
      expect(document.querySelector('#theme-transitions')).toBeNull();
    });

    test('should respect enableSystemDetection config', async () => {
      const manager = new ThemeManager({
        config: { enableSystemDetection: false }
      });
      
      await manager.init();
      
      expect(manager.state.supportsSystemPreference).toBe(false);
    });
  });

  describe('Theme Information', () => {
    beforeEach(async () => {
      await themeManager.init();
    });

    test('should get theme info', () => {
      themeManager.setState({ 
        currentTheme: 'dark',
        systemPreference: 'light'
      });
      
      const info = themeManager.getThemeInfo();
      
      expect(info).toMatchObject({
        current: 'dark',
        effective: 'dark',
        system: 'light',
        available: ['light', 'dark', 'auto']
      });
    });

    test('should get theme statistics', () => {
      const stats = themeManager.getThemeStats();
      
      expect(stats).toMatchObject({
        totalThemes: 3,
        currentTheme: expect.any(String),
        effectiveTheme: expect.any(String),
        systemPreference: expect.any(String)
      });
    });

    test('should export theme configuration', () => {
      const config = themeManager.exportThemeConfig();
      
      expect(config).toMatchObject({
        currentTheme: expect.any(String),
        availableThemes: expect.any(Array),
        systemPreference: expect.any(String),
        config: expect.any(Object)
      });
    });

    test('should import theme configuration', () => {
      const config = {
        currentTheme: 'dark',
        config: {
          enableTransitions: false
        }
      };
      
      const result = themeManager.importThemeConfig(config);
      
      expect(result).toBe(true);
      expect(themeManager.state.currentTheme).toBe('dark');
      expect(themeManager.config.enableTransitions).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle initialization errors gracefully', async () => {
      // Mock createToggleButton to throw error
      themeManager.createToggleButton = jest.fn(() => {
        throw new Error('Toggle button error');
      });
      
      await expect(themeManager.init()).rejects.toThrow('Toggle button error');
      expect(themeManager.state.error).toBeDefined();
    });

    test('should handle invalid theme gracefully', () => {
      const result = themeManager.setTheme('invalid-theme');
      
      expect(result).toBe(false);
      expect(themeManager.state.currentTheme).not.toBe('invalid-theme');
    });
  });

  describe('Cleanup', () => {
    test('should cleanup properly', async () => {
      await themeManager.init();
      
      const toggleButton = themeManager.toggleButton;
      document.body.appendChild(toggleButton);
      
      await themeManager.destroy();
      
      expect(themeManager.state.destroyed).toBe(true);
      expect(document.body.contains(toggleButton)).toBe(false);
    });

    test('should remove transition styles on cleanup', async () => {
      await themeManager.init();
      
      // Transition styles should be added
      expect(document.querySelector('#theme-transitions')).toBeDefined();
      
      await themeManager.destroy();
      
      // Transition styles should be removed
      expect(document.querySelector('#theme-transitions')).toBeNull();
    });
  });
});