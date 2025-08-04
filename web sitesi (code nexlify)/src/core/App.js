/**
 * Core Application Class
 * Manages the main application lifecycle and state
 */

import { EventBus } from './EventBus.js';
import { Logger } from '../utils/Logger.js';

export class App {
  constructor() {
    this.logger = new Logger('App');
    this.state = {
      isInitialized: false,
      currentPage: null,
      theme: 'light',
      language: 'tr',
      isOnline: navigator.onLine
    };
    
    this.config = {
      version: '2.0.0',
      name: 'CodeNexlify',
      debug: process.env.NODE_ENV === 'development'
    };
    
    this.setupNetworkListeners();
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      this.logger.info('🚀 Initializing Core App...');
      
      // Load configuration
      await this.loadConfig();
      
      // Setup global state
      this.setupGlobalState();
      
      // Initialize core features
      await this.initializeCore();
      
      this.state.isInitialized = true;
      this.logger.success('✅ Core App initialized successfully');
      
      EventBus.emit('app:core:ready');
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize Core App:', error);
      throw error;
    }
  }

  /**
   * Load application configuration
   */
  async loadConfig() {
    try {
      // Load from localStorage or API
      const savedConfig = localStorage.getItem('codenexlify-config');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        this.config = { ...this.config, ...parsedConfig };
      }
      
      this.logger.info('⚙️ Configuration loaded:', this.config);
    } catch (error) {
      this.logger.warn('⚠️ Failed to load configuration, using defaults');
    }
  }

  /**
   * Setup global application state
   */
  setupGlobalState() {
    // Detect current page
    this.state.currentPage = this.detectCurrentPage();
    
    // Load saved preferences
    this.loadUserPreferences();
    
    // Setup state change listeners
    this.setupStateListeners();
    
    this.logger.info('🔧 Global state initialized:', this.state);
  }

  /**
   * Initialize core application features
   */
  async initializeCore() {
    // Setup error handling
    this.setupErrorHandling();
    
    // Setup performance monitoring
    this.setupPerformanceMonitoring();
    
    // Setup accessibility features
    this.setupAccessibility();
    
    // Setup SEO features
    this.setupSEO();
  }

  /**
   * Detect current page from URL
   */
  detectCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';
    
    const pageMap = {
      'index.html': 'home',
      '': 'home',
      'about.html': 'about',
      'services.html': 'services',
      'contact.html': 'contact',
      'blog.html': 'blog'
    };
    
    return pageMap[filename] || 'unknown';
  }

  /**
   * Load user preferences from localStorage
   */
  loadUserPreferences() {
    try {
      const preferences = localStorage.getItem('codenexlify-preferences');
      if (preferences) {
        const parsed = JSON.parse(preferences);
        this.state.theme = parsed.theme || 'light';
        this.state.language = parsed.language || 'tr';
      }
    } catch (error) {
      this.logger.warn('⚠️ Failed to load user preferences');
    }
  }

  /**
   * Setup state change listeners
   */
  setupStateListeners() {
    // Listen for state changes
    EventBus.on('app:state:change', (data) => {
      this.updateState(data);
    });
    
    // Listen for theme changes
    EventBus.on('theme:change', (theme) => {
      this.updateState({ theme });
    });
    
    // Listen for language changes
    EventBus.on('language:change', (language) => {
      this.updateState({ language });
    });
  }

  /**
   * Setup network status listeners
   */
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.updateState({ isOnline: true });
      EventBus.emit('network:online');
      this.logger.info('🌐 Network: Online');
    });
    
    window.addEventListener('offline', () => {
      this.updateState({ isOnline: false });
      EventBus.emit('network:offline');
      this.logger.warn('📡 Network: Offline');
    });
  }

  /**
   * Setup global error handling
   */
  setupErrorHandling() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.handleError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    });
    
    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: 'promise',
        reason: event.reason,
        promise: event.promise
      });
    });
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    if ('performance' in window) {
      // Monitor page load performance
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType('navigation')[0];
          const metrics = {
            loadTime: perfData.loadEventEnd - perfData.loadEventStart,
            domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
            firstPaint: this.getFirstPaintTime(),
            firstContentfulPaint: this.getFirstContentfulPaintTime()
          };
          
          EventBus.emit('performance:metrics', metrics);
          this.logger.info('⚡ Performance metrics:', metrics);
        }, 0);
      });
    }
  }

  /**
   * Setup accessibility features
   */
  setupAccessibility() {
    // Add skip link for keyboard navigation
    this.addSkipLink();
    
    // Setup focus management
    this.setupFocusManagement();
    
    // Setup ARIA live regions
    this.setupAriaLiveRegions();
  }

  /**
   * Setup SEO features
   */
  setupSEO() {
    // Update meta tags based on current page
    this.updateMetaTags();
    
    // Setup structured data
    this.setupStructuredData();
  }

  /**
   * Add skip link for accessibility
   */
  addSkipLink() {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Ana içeriğe geç';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 10000;
      border-radius: 4px;
    `;
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  /**
   * Setup focus management
   */
  setupFocusManagement() {
    // Track focus for keyboard navigation
    let isKeyboardUser = false;
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        isKeyboardUser = true;
        document.body.classList.add('keyboard-navigation');
      }
    });
    
    document.addEventListener('mousedown', () => {
      isKeyboardUser = false;
      document.body.classList.remove('keyboard-navigation');
    });
  }

  /**
   * Setup ARIA live regions
   */
  setupAriaLiveRegions() {
    // Create live region for announcements
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.id = 'live-region';
    
    document.body.appendChild(liveRegion);
    
    // Listen for announcements
    EventBus.on('announce', (message) => {
      liveRegion.textContent = message;
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    });
  }

  /**
   * Update meta tags for current page
   */
  updateMetaTags() {
    const pageMetadata = this.getPageMetadata();
    
    // Update title
    document.title = pageMetadata.title;
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', pageMetadata.description);
    }
    
    // Update Open Graph tags
    this.updateOpenGraphTags(pageMetadata);
  }

  /**
   * Get metadata for current page
   */
  getPageMetadata() {
    const metadata = {
      home: {
        title: 'CodeNexlify - Yenilikçi Teknoloji Çözümleri',
        description: 'AI odaklı hizmetlerle geliştiricilere ve işletmelere ilham veriyoruz. Web, mobil, masaüstü ve AI eklentileri geliştirme hizmetleri.'
      },
      about: {
        title: 'Hakkımızda - CodeNexlify',
        description: 'CodeNexlify ekibi ve vizyonumuz hakkında bilgi edinin. Yenilikçi teknoloji çözümleri sunan uzman ekibimizi tanıyın.'
      },
      services: {
        title: 'Hizmetlerimiz - CodeNexlify',
        description: 'Web geliştirme, mobil uygulamalar, masaüstü yazılımlar, AI eklentileri ve danışmanlık hizmetlerimizi keşfedin.'
      },
      contact: {
        title: 'İletişim - CodeNexlify',
        description: 'Projeleriniz için ücretsiz konsültasyon alın. CodeNexlify ile iletişime geçin ve hayalinizdeki projeyi gerçekleştirin.'
      },
      blog: {
        title: 'Blog - CodeNexlify',
        description: 'Teknoloji dünyasından güncel haberler, yazılım geliştirme ipuçları ve AI konularında uzman görüşleri.'
      }
    };
    
    return metadata[this.state.currentPage] || metadata.home;
  }

  /**
   * Update Open Graph tags
   */
  updateOpenGraphTags(metadata) {
    const ogTags = [
      { property: 'og:title', content: metadata.title },
      { property: 'og:description', content: metadata.description },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: window.location.href },
      { property: 'og:site_name', content: 'CodeNexlify' }
    ];
    
    ogTags.forEach(tag => {
      let element = document.querySelector(`meta[property="${tag.property}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('property', tag.property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', tag.content);
    });
  }

  /**
   * Setup structured data
   */
  setupStructuredData() {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': 'CodeNexlify',
      'description': 'Yenilikçi teknoloji çözümleri sunan yazılım geliştirme şirketi',
      'url': 'https://codenexlify.com',
      'logo': 'https://codenexlify.com/assets/logo.png',
      'contactPoint': {
        '@type': 'ContactPoint',
        'telephone': '+90-555-123-4567',
        'contactType': 'customer service',
        'availableLanguage': ['Turkish', 'English']
      },
      'sameAs': [
        'https://twitter.com/codenexlify',
        'https://linkedin.com/company/codenexlify',
        'https://github.com/codenexlify'
      ]
    };
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
  }

  /**
   * Get first paint time
   */
  getFirstPaintTime() {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : 0;
  }

  /**
   * Get first contentful paint time
   */
  getFirstContentfulPaintTime() {
    const paintEntries = performance.getEntriesByType('paint');
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return firstContentfulPaint ? firstContentfulPaint.startTime : 0;
  }

  /**
   * Handle application errors
   */
  handleError(errorData) {
    this.logger.error('🚨 Application Error:', errorData);
    
    // Emit error event for other components to handle
    EventBus.emit('app:error', errorData);
    
    // Track error in analytics if available
    EventBus.emit('analytics:error', errorData);
  }

  /**
   * Update application state
   */
  updateState(newState) {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...newState };
    
    // Save preferences to localStorage
    this.saveUserPreferences();
    
    // Emit state change event
    EventBus.emit('app:state:updated', {
      oldState,
      newState: this.state,
      changes: newState
    });
    
    this.logger.info('🔄 State updated:', newState);
  }

  /**
   * Save user preferences to localStorage
   */
  saveUserPreferences() {
    try {
      const preferences = {
        theme: this.state.theme,
        language: this.state.language
      };
      
      localStorage.setItem('codenexlify-preferences', JSON.stringify(preferences));
    } catch (error) {
      this.logger.warn('⚠️ Failed to save user preferences:', error);
    }
  }

  /**
   * Get current application state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Get application configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Check if application is initialized
   */
  isInitialized() {
    return this.state.isInitialized;
  }

  /**
   * Cleanup application resources
   */
  cleanup() {
    this.logger.info('🧹 Cleaning up Core App...');
    
    // Remove event listeners
    EventBus.removeAllListeners();
    
    // Clear state
    this.state.isInitialized = false;
    
    this.logger.info('✅ Core App cleanup completed');
  }
}