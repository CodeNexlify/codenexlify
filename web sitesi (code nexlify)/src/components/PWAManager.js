/**
 * PWA Manager Component
 * Handles Progressive Web App functionality
 */

import { BaseComponent } from '../core/BaseComponent.js';
import { EventBus } from '../core/EventBus.js';

export class PWAManager extends BaseComponent {
  constructor(options = {}) {
    super({
      name: 'PWAManager',
      ...options
    });
    
    // PWA specific state
    this.setState({
      isInstallable: false,
      isInstalled: false,
      isOnline: navigator.onLine,
      updateAvailable: false,
      swRegistered: false,
      swUpdateReady: false
    });
    
    // Service Worker registration
    this.swRegistration = null;
    this.deferredPrompt = null;
    
    // Install prompt elements
    this.installBanner = null;
    this.updateBanner = null;
    
    // Configuration
    this.config = {
      ...this.config,
      swPath: '/sw.js',
      showInstallPrompt: true,
      showUpdatePrompt: true,
      autoUpdate: false,
      offlinePageUrl: '/offline.html'
    };
  }

  /**
   * Initialize PWA manager
   */
  async onInit() {
    this.logger.info('📱 Initializing PWA Manager...');
    
    // Check PWA support
    if (!this.isPWASupported()) {
      this.logger.warn('⚠️ PWA features not supported in this browser');
      return;
    }
    
    // Register service worker
    await this.registerServiceWorker();
    
    // Setup install prompt handling
    this.setupInstallPrompt();
    
    // Setup network status monitoring
    this.setupNetworkMonitoring();
    
    // Setup update handling
    this.setupUpdateHandling();
    
    // Check if already installed
    this.checkInstallationStatus();
    
    // Create UI elements
    this.createInstallBanner();
    this.createUpdateBanner();
  }

  /**
   * Check if PWA features are supported
   */
  isPWASupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Register service worker
   */
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      this.logger.warn('⚠️ Service Worker not supported');
      return;
    }
    
    try {
      this.logger.info('🔧 Registering Service Worker...');
      
      this.swRegistration = await navigator.serviceWorker.register(this.config.swPath, {
        scope: '/'
      });
      
      this.setState({ swRegistered: true });
      
      this.logger.success('✅ Service Worker registered successfully');
      
      // Listen for updates
      this.swRegistration.addEventListener('updatefound', () => {
        this.handleServiceWorkerUpdate();
      });
      
      // Check for existing service worker
      if (this.swRegistration.active) {
        this.logger.info('🔄 Service Worker already active');
      }
      
      // Emit registration event
      this.emit('pwa:sw:registered', { registration: this.swRegistration });
      
    } catch (error) {
      this.logger.error('❌ Service Worker registration failed:', error);
      this.emit('pwa:sw:error', { error });
    }
  }

  /**
   * Handle service worker updates
   */
  handleServiceWorkerUpdate() {
    const newWorker = this.swRegistration.installing;
    
    if (!newWorker) return;
    
    this.logger.info('🔄 Service Worker update found');
    
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        this.setState({ updateAvailable: true, swUpdateReady: true });
        
        this.logger.info('🆕 Service Worker update ready');
        
        // Show update banner
        if (this.config.showUpdatePrompt) {
          this.showUpdateBanner();
        }
        
        // Auto-update if enabled
        if (this.config.autoUpdate) {
          this.applyUpdate();
        }
        
        this.emit('pwa:update:available');
      }
    });
  }

  /**
   * Setup install prompt handling
   */
  setupInstallPrompt() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (event) => {
      // Prevent the mini-infobar from appearing on mobile
      event.preventDefault();
      
      // Save the event for later use
      this.deferredPrompt = event;
      
      // Update state
      this.setState({ isInstallable: true });
      
      this.logger.info('📱 App is installable');
      
      // Show install banner
      if (this.config.showInstallPrompt) {
        this.showInstallBanner();
      }
      
      this.emit('pwa:installable');
    });
    
    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      this.setState({ isInstalled: true, isInstallable: false });
      this.hideInstallBanner();
      
      this.logger.success('✅ App installed successfully');
      this.emit('pwa:installed');
      
      // Clear the deferredPrompt
      this.deferredPrompt = null;
    });
  }

  /**
   * Setup network status monitoring
   */
  setupNetworkMonitoring() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.setState({ isOnline: true });
      this.logger.info('🌐 Network: Online');
      this.emit('pwa:network:online');
      this.hideOfflineIndicator();
    });
    
    window.addEventListener('offline', () => {
      this.setState({ isOnline: false });
      this.logger.warn('📡 Network: Offline');
      this.emit('pwa:network:offline');
      this.showOfflineIndicator();
    });
  }

  /**
   * Setup update handling
   */
  setupUpdateHandling() {
    // Listen for service worker messages
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SKIP_WAITING') {
        this.applyUpdate();
      }
    });
    
    // Check for updates periodically
    if (this.swRegistration) {
      setInterval(() => {
        this.checkForUpdates();
      }, 60000); // Check every minute
    }
  }

  /**
   * Check installation status
   */
  checkInstallationStatus() {
    // Check if running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        window.navigator.standalone ||
                        document.referrer.includes('android-app://');
    
    if (isStandalone) {
      this.setState({ isInstalled: true });
      this.logger.info('📱 App is running in standalone mode');
    }
  }

  /**
   * Create install banner
   */
  createInstallBanner() {
    this.installBanner = document.createElement('div');
    this.installBanner.className = 'pwa-install-banner';
    this.installBanner.style.display = 'none';
    
    this.installBanner.innerHTML = `
      <div class="banner-content">
        <div class="banner-icon">📱</div>
        <div class="banner-text">
          <h4>Uygulamayı Yükle</h4>
          <p>Daha iyi deneyim için uygulamayı cihazınıza yükleyin</p>
        </div>
        <div class="banner-actions">
          <button class="btn-install">Yükle</button>
          <button class="btn-dismiss">×</button>
        </div>
      </div>
    `;
    
    // Style the banner
    this.styleInstallBanner();
    
    // Add event listeners
    const installBtn = this.installBanner.querySelector('.btn-install');
    const dismissBtn = this.installBanner.querySelector('.btn-dismiss');
    
    this.addDOMEventListener(installBtn, 'click', this.promptInstall);
    this.addDOMEventListener(dismissBtn, 'click', this.hideInstallBanner);
    
    document.body.appendChild(this.installBanner);
  }

  /**
   * Create update banner
   */
  createUpdateBanner() {
    this.updateBanner = document.createElement('div');
    this.updateBanner.className = 'pwa-update-banner';
    this.updateBanner.style.display = 'none';
    
    this.updateBanner.innerHTML = `
      <div class="banner-content">
        <div class="banner-icon">🔄</div>
        <div class="banner-text">
          <h4>Güncelleme Mevcut</h4>
          <p>Yeni özellikler için uygulamayı güncelleyin</p>
        </div>
        <div class="banner-actions">
          <button class="btn-update">Güncelle</button>
          <button class="btn-dismiss">×</button>
        </div>
      </div>
    `;
    
    // Style the banner
    this.styleUpdateBanner();
    
    // Add event listeners
    const updateBtn = this.updateBanner.querySelector('.btn-update');
    const dismissBtn = this.updateBanner.querySelector('.btn-dismiss');
    
    this.addDOMEventListener(updateBtn, 'click', this.applyUpdate);
    this.addDOMEventListener(dismissBtn, 'click', this.hideUpdateBanner);
    
    document.body.appendChild(this.updateBanner);
  }

  /**
   * Style install banner
   */
  styleInstallBanner() {
    const styles = `
      .pwa-install-banner {
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        background: var(--primary-gradient);
        color: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        animation: slideInUp 0.3s ease-out;
      }
      
      .pwa-install-banner .banner-content {
        display: flex;
        align-items: center;
        padding: 16px;
        gap: 12px;
      }
      
      .pwa-install-banner .banner-icon {
        font-size: 2rem;
        flex-shrink: 0;
      }
      
      .pwa-install-banner .banner-text {
        flex: 1;
      }
      
      .pwa-install-banner .banner-text h4 {
        margin: 0 0 4px 0;
        font-size: 1.1rem;
        font-weight: 600;
      }
      
      .pwa-install-banner .banner-text p {
        margin: 0;
        font-size: 0.9rem;
        opacity: 0.9;
      }
      
      .pwa-install-banner .banner-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
      }
      
      .pwa-install-banner button {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .pwa-install-banner .btn-install {
        background: white;
        color: var(--primary-color);
      }
      
      .pwa-install-banner .btn-install:hover {
        background: rgba(255, 255, 255, 0.9);
        transform: translateY(-1px);
      }
      
      .pwa-install-banner .btn-dismiss {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        padding: 0;
      }
      
      .pwa-install-banner .btn-dismiss:hover {
        background: rgba(255, 255, 255, 0.3);
      }
      
      @keyframes slideInUp {
        from {
          transform: translateY(100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      @media (max-width: 768px) {
        .pwa-install-banner {
          left: 10px;
          right: 10px;
          bottom: 10px;
        }
        
        .pwa-install-banner .banner-content {
          padding: 12px;
        }
        
        .pwa-install-banner .banner-text h4 {
          font-size: 1rem;
        }
        
        .pwa-install-banner .banner-text p {
          font-size: 0.8rem;
        }
      }
    `;
    
    this.addStyles('pwa-install-banner-styles', styles);
  }

  /**
   * Style update banner
   */
  styleUpdateBanner() {
    const styles = `
      .pwa-update-banner {
        position: fixed;
        top: 20px;
        left: 20px;
        right: 20px;
        background: var(--secondary-gradient);
        color: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        z-index: 1001;
        animation: slideInDown 0.3s ease-out;
      }
      
      .pwa-update-banner .banner-content {
        display: flex;
        align-items: center;
        padding: 16px;
        gap: 12px;
      }
      
      .pwa-update-banner .banner-icon {
        font-size: 2rem;
        flex-shrink: 0;
        animation: spin 2s linear infinite;
      }
      
      .pwa-update-banner .banner-text {
        flex: 1;
      }
      
      .pwa-update-banner .banner-text h4 {
        margin: 0 0 4px 0;
        font-size: 1.1rem;
        font-weight: 600;
      }
      
      .pwa-update-banner .banner-text p {
        margin: 0;
        font-size: 0.9rem;
        opacity: 0.9;
      }
      
      .pwa-update-banner .banner-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
      }
      
      .pwa-update-banner button {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .pwa-update-banner .btn-update {
        background: white;
        color: var(--secondary-color);
      }
      
      .pwa-update-banner .btn-update:hover {
        background: rgba(255, 255, 255, 0.9);
        transform: translateY(-1px);
      }
      
      .pwa-update-banner .btn-dismiss {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        padding: 0;
      }
      
      .pwa-update-banner .btn-dismiss:hover {
        background: rgba(255, 255, 255, 0.3);
      }
      
      @keyframes slideInDown {
        from {
          transform: translateY(-100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      
      @media (max-width: 768px) {
        .pwa-update-banner {
          left: 10px;
          right: 10px;
          top: 10px;
        }
      }
    `;
    
    this.addStyles('pwa-update-banner-styles', styles);
  }

  /**
   * Add styles to document
   */
  addStyles(id, styles) {
    if (!document.querySelector(`#${id}`)) {
      const styleSheet = document.createElement('style');
      styleSheet.id = id;
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
    }
  }

  /**
   * Show install banner
   */
  showInstallBanner = () => {
    if (this.installBanner && this.state.isInstallable && !this.state.isInstalled) {
      this.installBanner.style.display = 'block';
      this.logger.info('📱 Install banner shown');
    }
  };

  /**
   * Hide install banner
   */
  hideInstallBanner = () => {
    if (this.installBanner) {
      this.installBanner.style.display = 'none';
      this.logger.info('📱 Install banner hidden');
    }
  };

  /**
   * Show update banner
   */
  showUpdateBanner = () => {
    if (this.updateBanner && this.state.updateAvailable) {
      this.updateBanner.style.display = 'block';
      this.logger.info('🔄 Update banner shown');
    }
  };

  /**
   * Hide update banner
   */
  hideUpdateBanner = () => {
    if (this.updateBanner) {
      this.updateBanner.style.display = 'none';
      this.logger.info('🔄 Update banner hidden');
    }
  };

  /**
   * Prompt app installation
   */
  promptInstall = async () => {
    if (!this.deferredPrompt) {
      this.logger.warn('⚠️ Install prompt not available');
      return;
    }
    
    try {
      // Show the install prompt
      this.deferredPrompt.prompt();
      
      // Wait for the user to respond
      const { outcome } = await this.deferredPrompt.userChoice;
      
      this.logger.info(`📱 Install prompt result: ${outcome}`);
      
      if (outcome === 'accepted') {
        this.emit('pwa:install:accepted');
      } else {
        this.emit('pwa:install:dismissed');
      }
      
      // Clear the deferredPrompt
      this.deferredPrompt = null;
      this.hideInstallBanner();
      
    } catch (error) {
      this.logger.error('❌ Install prompt failed:', error);
      this.emit('pwa:install:error', { error });
    }
  };

  /**
   * Apply service worker update
   */
  applyUpdate = () => {
    if (!this.swRegistration || !this.state.swUpdateReady) {
      this.logger.warn('⚠️ No update available');
      return;
    }
    
    this.logger.info('🔄 Applying service worker update...');
    
    // Tell the service worker to skip waiting
    if (this.swRegistration.waiting) {
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    
    // Hide update banner
    this.hideUpdateBanner();
    
    // Reload the page to activate the new service worker
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
    this.emit('pwa:update:applied');
  };

  /**
   * Check for updates
   */
  async checkForUpdates() {
    if (!this.swRegistration) return;
    
    try {
      await this.swRegistration.update();
      this.logger.debug('🔍 Checked for service worker updates');
    } catch (error) {
      this.logger.error('❌ Failed to check for updates:', error);
    }
  }

  /**
   * Show offline indicator
   */
  showOfflineIndicator() {
    // Create or show offline indicator
    let offlineIndicator = document.querySelector('.offline-indicator');
    
    if (!offlineIndicator) {
      offlineIndicator = document.createElement('div');
      offlineIndicator.className = 'offline-indicator';
      offlineIndicator.innerHTML = `
        <div class="offline-content">
          <span class="offline-icon">📡</span>
          <span class="offline-text">Çevrimdışı</span>
        </div>
      `;
      
      // Style the indicator
      const styles = `
        .offline-indicator {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #ff6b6b;
          color: white;
          padding: 8px;
          text-align: center;
          z-index: 10000;
          font-size: 0.9rem;
          font-weight: 600;
        }
        
        .offline-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .offline-icon {
          font-size: 1.1rem;
        }
      `;
      
      this.addStyles('offline-indicator-styles', styles);
      document.body.appendChild(offlineIndicator);
    }
    
    offlineIndicator.style.display = 'block';
  }

  /**
   * Hide offline indicator
   */
  hideOfflineIndicator() {
    const offlineIndicator = document.querySelector('.offline-indicator');
    if (offlineIndicator) {
      offlineIndicator.style.display = 'none';
    }
  }

  /**
   * Get PWA status
   */
  getPWAStatus() {
    return {
      isInstallable: this.state.isInstallable,
      isInstalled: this.state.isInstalled,
      isOnline: this.state.isOnline,
      updateAvailable: this.state.updateAvailable,
      swRegistered: this.state.swRegistered,
      swUpdateReady: this.state.swUpdateReady
    };
  }

  /**
   * Force install prompt (for testing)
   */
  forceInstallPrompt() {
    if (this.state.isInstallable) {
      this.showInstallBanner();
    } else {
      this.logger.warn('⚠️ App is not installable');
    }
  }

  /**
   * Component cleanup
   */
  async onDestroy() {
    // Remove banners
    if (this.installBanner && this.installBanner.parentNode) {
      this.installBanner.parentNode.removeChild(this.installBanner);
    }
    
    if (this.updateBanner && this.updateBanner.parentNode) {
      this.updateBanner.parentNode.removeChild(this.updateBanner);
    }
    
    // Hide offline indicator
    this.hideOfflineIndicator();
    
    // Clear deferred prompt
    this.deferredPrompt = null;
    
    this.logger.info('🧹 PWA Manager cleaned up');
  }
}