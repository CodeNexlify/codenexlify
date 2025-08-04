/**
 * CodeNexlify Main Application Entry Point
 * Modern JavaScript ES6+ with modular architecture
 */

// Import core modules
import { App } from './core/App.js';
import { ComponentRegistry } from './core/ComponentRegistry.js';
import { EventBus } from './core/EventBus.js';
import { Logger } from './utils/Logger.js';

// Import components
import { ThemeManager } from './components/ThemeManager.js';
import { I18nManager } from './components/I18nManager.js';
import { NavigationManager } from './components/NavigationManager.js';
import { PWAManager } from './components/PWAManager.js';
import { AnalyticsManager } from './components/AnalyticsManager.js';

// Import styles
import './styles/main.scss';

// Initialize logger
const logger = new Logger('CodeNexlify');

/**
 * Application initialization
 */
class CodeNexlifyApp {
  constructor() {
    this.app = null;
    this.components = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      logger.info('🚀 Initializing CodeNexlify Application...');

      // Initialize core app
      this.app = new App();
      
      // Register core components
      await this.registerComponents();
      
      // Initialize components
      await this.initializeComponents();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Mark as initialized
      this.isInitialized = true;
      
      logger.success('✅ CodeNexlify Application initialized successfully!');
      
      // Dispatch ready event
      EventBus.emit('app:ready');
      
    } catch (error) {
      logger.error('❌ Failed to initialize application:', error);
      this.handleInitializationError(error);
    }
  }

  /**
   * Register all components
   */
  async registerComponents() {
    const componentRegistry = ComponentRegistry.getInstance();
    
    // Core components
    componentRegistry.register('theme', ThemeManager);
    componentRegistry.register('i18n', I18nManager);
    componentRegistry.register('navigation', NavigationManager);
    componentRegistry.register('pwa', PWAManager);
    componentRegistry.register('analytics', AnalyticsManager);
    
    logger.info('📦 Components registered successfully');
  }

  /**
   * Initialize all registered components
   */
  async initializeComponents() {
    const componentRegistry = ComponentRegistry.getInstance();
    const components = componentRegistry.getAll();
    
    for (const [name, ComponentClass] of components) {
      try {
        logger.info(`🔧 Initializing ${name} component...`);
        
        const instance = new ComponentClass();
        await instance.init();
        
        this.components.set(name, instance);
        
        logger.success(`✅ ${name} component initialized`);
      } catch (error) {
        logger.error(`❌ Failed to initialize ${name} component:`, error);
      }
    }
  }

  /**
   * Setup global event listeners
   */
  setupEventListeners() {
    // DOM Content Loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.onDOMReady();
      });
    } else {
      this.onDOMReady();
    }

    // Window load
    window.addEventListener('load', () => {
      this.onWindowLoad();
    });

    // Before unload
    window.addEventListener('beforeunload', () => {
      this.onBeforeUnload();
    });

    // Error handling
    window.addEventListener('error', (event) => {
      this.handleGlobalError(event);
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleUnhandledRejection(event);
    });
  }

  /**
   * Handle DOM ready event
   */
  onDOMReady() {
    logger.info('📄 DOM Content Loaded');
    EventBus.emit('dom:ready');
    
    // Initialize page-specific functionality
    this.initializePageSpecificFeatures();
  }

  /**
   * Handle window load event
   */
  onWindowLoad() {
    logger.info('🌐 Window Loaded');
    EventBus.emit('window:loaded');
    
    // Start performance monitoring
    this.startPerformanceMonitoring();
  }

  /**
   * Handle before unload event
   */
  onBeforeUnload() {
    logger.info('👋 Application unloading...');
    EventBus.emit('app:beforeunload');
    
    // Cleanup components
    this.cleanup();
  }

  /**
   * Initialize page-specific features based on current page
   */
  initializePageSpecificFeatures() {
    const currentPage = this.getCurrentPage();
    logger.info(`📄 Current page: ${currentPage}`);
    
    switch (currentPage) {
      case 'home':
        this.initializeHomePage();
        break;
      case 'about':
        this.initializeAboutPage();
        break;
      case 'services':
        this.initializeServicesPage();
        break;
      case 'contact':
        this.initializeContactPage();
        break;
      case 'blog':
        this.initializeBlogPage();
        break;
      default:
        logger.warn(`Unknown page: ${currentPage}`);
    }
  }

  /**
   * Get current page identifier
   */
  getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';
    
    if (filename === 'index.html' || filename === '') return 'home';
    return filename.replace('.html', '');
  }

  /**
   * Initialize home page specific features
   */
  initializeHomePage() {
    logger.info('🏠 Initializing home page features...');
    // Home page specific initialization will be added here
  }

  /**
   * Initialize about page specific features
   */
  initializeAboutPage() {
    logger.info('ℹ️ Initializing about page features...');
    // About page specific initialization will be added here
  }

  /**
   * Initialize services page specific features
   */
  initializeServicesPage() {
    logger.info('🛠️ Initializing services page features...');
    // Services page specific initialization will be added here
  }

  /**
   * Initialize contact page specific features
   */
  initializeContactPage() {
    logger.info('📞 Initializing contact page features...');
    // Contact page specific initialization will be added here
  }

  /**
   * Initialize blog page specific features
   */
  initializeBlogPage() {
    logger.info('📝 Initializing blog page features...');
    // Blog page specific initialization will be added here
  }

  /**
   * Start performance monitoring
   */
  startPerformanceMonitoring() {
    if ('performance' in window) {
      const perfData = performance.getEntriesByType('navigation')[0];
      logger.info('⚡ Performance metrics:', {
        loadTime: perfData.loadEventEnd - perfData.loadEventStart,
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0
      });
    }
  }

  /**
   * Handle global errors
   */
  handleGlobalError(event) {
    logger.error('🚨 Global error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
    
    // Send error to analytics if available
    const analytics = this.components.get('analytics');
    if (analytics) {
      analytics.trackError(event.error);
    }
  }

  /**
   * Handle unhandled promise rejections
   */
  handleUnhandledRejection(event) {
    logger.error('🚨 Unhandled promise rejection:', event.reason);
    
    // Send error to analytics if available
    const analytics = this.components.get('analytics');
    if (analytics) {
      analytics.trackError(event.reason);
    }
  }

  /**
   * Handle initialization errors
   */
  handleInitializationError(error) {
    // Show user-friendly error message
    const errorMessage = document.createElement('div');
    errorMessage.className = 'app-error';
    errorMessage.innerHTML = `
      <div class="error-content">
        <h2>🚨 Uygulama Başlatılamadı</h2>
        <p>Bir hata oluştu. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.</p>
        <button onclick="window.location.reload()">Sayfayı Yenile</button>
      </div>
    `;
    
    document.body.appendChild(errorMessage);
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Cleanup all components
    for (const [name, component] of this.components) {
      if (component.cleanup && typeof component.cleanup === 'function') {
        try {
          component.cleanup();
          logger.info(`🧹 Cleaned up ${name} component`);
        } catch (error) {
          logger.error(`❌ Error cleaning up ${name} component:`, error);
        }
      }
    }
    
    // Clear components map
    this.components.clear();
    
    // Remove event listeners
    EventBus.removeAllListeners();
    
    logger.info('🧹 Application cleanup completed');
  }

  /**
   * Get component instance
   */
  getComponent(name) {
    return this.components.get(name);
  }

  /**
   * Check if application is initialized
   */
  isReady() {
    return this.isInitialized;
  }
}

// Create and initialize application
const codeNexlifyApp = new CodeNexlifyApp();

// Auto-initialize when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    codeNexlifyApp.init();
  });
} else {
  codeNexlifyApp.init();
}

// Export for global access
window.CodeNexlify = codeNexlifyApp;

// Export for module usage
export default codeNexlifyApp;