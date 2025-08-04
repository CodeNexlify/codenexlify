/**
 * Theme Manager Component
 * Handles dark/light theme switching and persistence
 */

import { BaseComponent } from '../core/BaseComponent.js';
import { EventBus } from '../core/EventBus.js';

export class ThemeManager extends BaseComponent {
  constructor(options = {}) {
    super({
      name: 'ThemeManager',
      ...options
    });
    
    // Theme specific state
    this.setState({
      currentTheme: 'light',
      systemPreference: 'light',
      isTransitioning: false,
      supportsSystemPreference: false
    });
    
    // Configuration
    this.config = {
      ...this.config,
      storageKey: 'codenexlify-theme',
      transitionDuration: 300,
      enableTransitions: true,
      enableSystemDetection: true,
      themes: ['light', 'dark', 'auto']
    };
    
    // DOM references
    this.toggleButton = null;
    this.mediaQuery = null;
  }

  /**
   * Initialize theme manager
   */
  async onInit() {
    this.logger.info('🎨 Initializing Theme Manager...');
    
    // Detect system preference
    this.detectSystemPreference();
    
    // Load saved theme or use system preference
    this.loadTheme();
    
    // Create theme toggle button
    this.createToggleButton();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Apply initial theme
    this.applyTheme(this.state.currentTheme);
    
    // Setup CSS transitions
    if (this.config.enableTransitions) {
      this.setupThemeTransitions();
    }
  }

  /**
   * Detect system color scheme preference
   */
  detectSystemPreference() {
    if (!this.config.enableSystemDetection) return;
    
    if (window.matchMedia) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const systemPreference = this.mediaQuery.matches ? 'dark' : 'light';
      
      this.setState({ 
        systemPreference,
        supportsSystemPreference: true 
      });
      
      this.logger.info(`🔍 System preference detected: ${systemPreference}`);
    } else {
      this.logger.warn('⚠️ System preference detection not supported');
    }
  }

  /**
   * Load theme from localStorage or use system preference
   */
  loadTheme() {
    try {
      const savedTheme = localStorage.getItem(this.config.storageKey);
      
      if (savedTheme && this.config.themes.includes(savedTheme)) {
        this.setState({ currentTheme: savedTheme });
      } else {
        this.setState({ currentTheme: 'auto' });
      }
      
      this.logger.info(`📂 Theme loaded: ${this.state.currentTheme}`);
      
    } catch (error) {
      this.logger.warn('⚠️ Failed to load theme from storage, using default');
      this.setState({ currentTheme: 'auto' });
    }
  }

  /**
   * Save theme to localStorage
   */
  saveTheme() {
    try {
      localStorage.setItem(this.config.storageKey, this.state.currentTheme);
      this.logger.info(`💾 Theme saved: ${this.state.currentTheme}`);
    } catch (error) {
      this.logger.warn('⚠️ Failed to save theme to storage:', error);
    }
  }

  /**
   * Create theme toggle button
   */
  createToggleButton() {
    this.toggleButton = document.createElement('button');
    this.toggleButton.className = 'theme-toggle';
    this.toggleButton.setAttribute('aria-label', 'Tema değiştir');
    this.toggleButton.setAttribute('title', 'Tema değiştir');
    
    // Style the button
    this.styleToggleButton();
    
    // Add to page
    document.body.appendChild(this.toggleButton);
    
    // Update button icon
    this.updateToggleButton();
    
    this.logger.info('🔘 Theme toggle button created');
  }

  /**
   * Style the toggle button
   */
  styleToggleButton() {
    const styles = `
      .theme-toggle {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        border: none;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        color: var(--text-primary);
        font-size: 1.5rem;
        cursor: pointer;
        z-index: 1001;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      
      .theme-toggle:hover {
        transform: scale(1.1);
        background: rgba(255, 255, 255, 0.2);
      }
      
      .theme-toggle:focus {
        outline: 2px solid var(--accent-color);
        outline-offset: 2px;
      }
      
      .theme-toggle:active {
        transform: scale(0.95);
      }
      
      @media (max-width: 768px) {
        .theme-toggle {
          width: 44px;
          height: 44px;
          font-size: 1.2rem;
          top: 15px;
          right: 15px;
        }
      }
    `;
    
    // Add styles to head if not already present
    if (!document.querySelector('#theme-toggle-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'theme-toggle-styles';
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
    }
  }

  /**
   * Update toggle button icon and text
   */
  updateToggleButton() {
    if (!this.toggleButton) return;
    
    const effectiveTheme = this.getEffectiveTheme();
    const icons = {
      light: '🌙',
      dark: '☀️',
      auto: '🌓'
    };
    
    const labels = {
      light: 'Karanlık temaya geç',
      dark: 'Açık temaya geç',
      auto: 'Otomatik temaya geç'
    };
    
    this.toggleButton.textContent = icons[this.state.currentTheme] || icons.auto;
    this.toggleButton.setAttribute('aria-label', labels[effectiveTheme] || labels.auto);
    this.toggleButton.setAttribute('title', labels[effectiveTheme] || labels.auto);
    
    // Add visual feedback during transition
    if (this.state.isTransitioning) {
      this.toggleButton.classList.add('transitioning');
      setTimeout(() => {
        this.toggleButton.classList.remove('transitioning');
      }, this.config.transitionDuration);
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Toggle button click
    if (this.toggleButton) {
      this.addDOMEventListener(this.toggleButton, 'click', this.toggleTheme);
    }
    
    // System preference change
    if (this.mediaQuery) {
      this.addDOMEventListener(this.mediaQuery, 'change', this.handleSystemPreferenceChange);
    }
    
    // Keyboard shortcut (Ctrl/Cmd + Shift + T)
    this.addDOMEventListener(document, 'keydown', this.handleKeyboardShortcut);
    
    // Listen for theme change requests
    this.on('theme:set', (data) => {
      this.setTheme(data.theme);
    });
    
    this.on('theme:toggle', () => {
      this.toggleTheme();
    });
    
    // Listen for component state changes
    this.on('state:changed', this.handleStateChange);
  }

  /**
   * Handle system preference change
   */
  handleSystemPreferenceChange = (e) => {
    const systemPreference = e.matches ? 'dark' : 'light';
    this.setState({ systemPreference });
    
    this.logger.info(`🔄 System preference changed: ${systemPreference}`);
    
    // Apply theme if in auto mode
    if (this.state.currentTheme === 'auto') {
      this.applyTheme('auto');
    }
  };

  /**
   * Handle keyboard shortcuts
   */
  handleKeyboardShortcut = (e) => {
    // Ctrl/Cmd + Shift + T for theme toggle
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
      e.preventDefault();
      this.toggleTheme();
    }
  };

  /**
   * Handle component state changes
   */
  handleStateChange = (data) => {
    if (data.changes.currentTheme) {
      this.updateToggleButton();
      this.saveTheme();
    }
  };

  /**
   * Get effective theme (resolves 'auto' to actual theme)
   */
  getEffectiveTheme() {
    if (this.state.currentTheme === 'auto') {
      return this.state.systemPreference;
    }
    return this.state.currentTheme;
  }

  /**
   * Apply theme to document
   */
  applyTheme(theme) {
    const effectiveTheme = theme === 'auto' ? this.state.systemPreference : theme;
    
    // Start transition
    if (this.config.enableTransitions) {
      this.setState({ isTransitioning: true });
    }
    
    // Update document attribute
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    
    // Update body class for compatibility
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${effectiveTheme}`);
    
    // Update meta theme-color for mobile browsers
    this.updateMetaThemeColor(effectiveTheme);
    
    // Update toggle button
    this.updateToggleButton();
    
    // Emit theme change event
    this.emit('theme:changed', {
      theme: this.state.currentTheme,
      effectiveTheme,
      systemPreference: this.state.systemPreference,
      component: this
    });
    
    // End transition after duration
    if (this.config.enableTransitions) {
      setTimeout(() => {
        this.setState({ isTransitioning: false });
      }, this.config.transitionDuration);
    }
    
    this.logger.info(`🎨 Theme applied: ${effectiveTheme} (setting: ${this.state.currentTheme})`);
  }

  /**
   * Update meta theme-color for mobile browsers
   */
  updateMetaThemeColor(theme) {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    
    const colors = {
      light: '#667eea',
      dark: '#1a202c'
    };
    
    metaThemeColor.content = colors[theme] || colors.light;
  }

  /**
   * Set specific theme
   */
  setTheme(theme) {
    if (!this.config.themes.includes(theme)) {
      this.logger.warn(`⚠️ Invalid theme: ${theme}`);
      return false;
    }
    
    const oldTheme = this.state.currentTheme;
    
    if (oldTheme === theme) {
      this.logger.debug(`🔄 Theme already set: ${theme}`);
      return true;
    }
    
    // Update state
    this.setState({ currentTheme: theme });
    
    // Apply theme
    this.applyTheme(theme);
    
    this.logger.info(`🔄 Theme changed: ${oldTheme} → ${theme}`);
    
    // Announce to screen readers
    this.announceThemeChange(theme);
    
    return true;
  }

  /**
   * Toggle between themes
   */
  toggleTheme = () => {
    const currentIndex = this.config.themes.indexOf(this.state.currentTheme);
    const nextIndex = (currentIndex + 1) % this.config.themes.length;
    const nextTheme = this.config.themes[nextIndex];
    
    this.setTheme(nextTheme);
  };

  /**
   * Announce theme change to screen readers
   */
  announceThemeChange(theme) {
    const messages = {
      light: 'Açık tema aktif',
      dark: 'Karanlık tema aktif',
      auto: 'Otomatik tema aktif'
    };
    
    EventBus.emit('announce', messages[theme] || messages.auto);
  }

  /**
   * Setup theme transitions
   */
  setupThemeTransitions() {
    const transitionStyles = `
      .theme-toggle.transitioning {
        transform: scale(0.9) rotate(180deg);
        opacity: 0.7;
      }
      
      * {
        transition: background-color ${this.config.transitionDuration}ms ease,
                   color ${this.config.transitionDuration}ms ease,
                   border-color ${this.config.transitionDuration}ms ease,
                   box-shadow ${this.config.transitionDuration}ms ease;
      }
      
      @media (prefers-reduced-motion: reduce) {
        * {
          transition: none !important;
        }
      }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.id = 'theme-transitions';
    styleSheet.textContent = transitionStyles;
    document.head.appendChild(styleSheet);
  }

  /**
   * Get current theme info
   */
  getThemeInfo() {
    return {
      current: this.state.currentTheme,
      effective: this.getEffectiveTheme(),
      system: this.state.systemPreference,
      available: this.config.themes,
      isTransitioning: this.state.isTransitioning,
      supportsSystemPreference: this.state.supportsSystemPreference
    };
  }

  /**
   * Check if dark theme is active
   */
  isDarkTheme() {
    return this.getEffectiveTheme() === 'dark';
  }

  /**
   * Check if light theme is active
   */
  isLightTheme() {
    return this.getEffectiveTheme() === 'light';
  }

  /**
   * Check if auto theme is enabled
   */
  isAutoTheme() {
    return this.state.currentTheme === 'auto';
  }

  /**
   * Add custom theme
   */
  addTheme(themeName, themeConfig) {
    if (this.config.themes.includes(themeName)) {
      this.logger.warn(`⚠️ Theme already exists: ${themeName}`);
      return false;
    }
    
    this.config.themes.push(themeName);
    
    // Apply theme CSS if provided
    if (themeConfig.css) {
      const styleSheet = document.createElement('style');
      styleSheet.id = `theme-${themeName}`;
      styleSheet.textContent = `
        [data-theme="${themeName}"] {
          ${themeConfig.css}
        }
      `;
      document.head.appendChild(styleSheet);
    }
    
    this.logger.info(`➕ Custom theme added: ${themeName}`);
    this.emit('theme:added', { name: themeName, config: themeConfig });
    
    return true;
  }

  /**
   * Remove custom theme
   */
  removeTheme(themeName) {
    if (['light', 'dark', 'auto'].includes(themeName)) {
      this.logger.warn(`⚠️ Cannot remove built-in theme: ${themeName}`);
      return false;
    }
    
    const index = this.config.themes.indexOf(themeName);
    if (index === -1) {
      this.logger.warn(`⚠️ Theme not found: ${themeName}`);
      return false;
    }
    
    // Remove from themes array
    this.config.themes.splice(index, 1);
    
    // Remove CSS
    const styleSheet = document.querySelector(`#theme-${themeName}`);
    if (styleSheet) {
      styleSheet.remove();
    }
    
    // Switch to default theme if current theme is being removed
    if (this.state.currentTheme === themeName) {
      this.setTheme('light');
    }
    
    this.logger.info(`➖ Custom theme removed: ${themeName}`);
    this.emit('theme:removed', { name: themeName });
    
    return true;
  }

  /**
   * Add theme change listener
   */
  onThemeChange(callback) {
    return EventBus.on('theme:changed', callback);
  }

  /**
   * Remove theme change listener
   */
  offThemeChange(listenerId) {
    return EventBus.off('theme:changed', listenerId);
  }

  /**
   * Preload theme-specific resources
   */
  preloadThemeResources(theme) {
    const effectiveTheme = theme === 'auto' ? this.systemPreference : theme;
    
    // Preload theme-specific images or resources
    const themeResources = {
      light: [
        // Light theme specific resources
      ],
      dark: [
        // Dark theme specific resources
      ]
    };
    
    const resources = themeResources[effectiveTheme] || [];
    
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.url;
      link.as = resource.type;
      document.head.appendChild(link);
    });
  }

  /**
   * Get theme statistics
   */
  getStats() {
    return {
      currentTheme: this.currentTheme,
      effectiveTheme: this.getEffectiveTheme(),
      systemPreference: this.systemPreference,
      supportsSystemPreference: !!this.mediaQuery,
      toggleButtonExists: !!this.toggleButton,
      storageAvailable: this.isStorageAvailable()
    };
  }

  /**
   * Check if localStorage is available
   */
  isStorageAvailable() {
    try {
      const test = '__theme_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get theme statistics
   */
  getThemeStats() {
    return {
      totalThemes: this.config.themes.length,
      currentTheme: this.state.currentTheme,
      effectiveTheme: this.getEffectiveTheme(),
      systemPreference: this.state.systemPreference,
      transitionsEnabled: this.config.enableTransitions,
      systemDetectionEnabled: this.config.enableSystemDetection,
      isTransitioning: this.state.isTransitioning
    };
  }

  /**
   * Export theme configuration
   */
  exportThemeConfig() {
    return {
      currentTheme: this.state.currentTheme,
      availableThemes: this.config.themes,
      systemPreference: this.state.systemPreference,
      config: {
        enableTransitions: this.config.enableTransitions,
        enableSystemDetection: this.config.enableSystemDetection,
        transitionDuration: this.config.transitionDuration
      }
    };
  }

  /**
   * Import theme configuration
   */
  importThemeConfig(config) {
    try {
      if (config.currentTheme && this.config.themes.includes(config.currentTheme)) {
        this.setTheme(config.currentTheme);
      }
      
      if (config.config) {
        Object.assign(this.config, config.config);
      }
      
      this.logger.info('📥 Theme configuration imported');
      return true;
      
    } catch (error) {
      this.logger.error('❌ Failed to import theme configuration:', error);
      return false;
    }
  }

  /**
   * Component cleanup
   */
  async onDestroy() {
    // Remove toggle button
    if (this.toggleButton && this.toggleButton.parentNode) {
      this.toggleButton.parentNode.removeChild(this.toggleButton);
    }
    
    // Remove transition styles
    const transitionStyles = document.querySelector('#theme-transitions');
    if (transitionStyles) {
      transitionStyles.remove();
    }
    
    this.logger.info('🧹 Theme Manager cleaned up');
  }
}