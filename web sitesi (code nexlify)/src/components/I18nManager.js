/**
 * Internationalization Manager Component
 * Handles multi-language support and dynamic content loading
 */

import { BaseComponent } from '../core/BaseComponent.js';
import { EventBus } from '../core/EventBus.js';

export class I18nManager extends BaseComponent {
  constructor(options = {}) {
    super({
      name: 'I18nManager',
      ...options
    });
    
    // I18n specific state
    this.setState({
      currentLanguage: 'tr',
      availableLanguages: ['tr', 'en'],
      isLoading: false,
      loadedLanguages: new Set(['tr']) // Turkish is default
    });
    
    // Translation storage
    this.translations = new Map();
    this.fallbackTranslations = new Map();
    
    // Configuration
    this.config = {
      ...this.config,
      fallbackLanguage: 'tr',
      storageKey: 'codenexlify-language',
      translationsPath: '/locales',
      autoDetect: true,
      persistChoice: true
    };
    
    // Language toggle button
    this.languageToggle = null;
    
    // Initialize with default Turkish translations
    this.initializeDefaultTranslations();
  }

  /**
   * Initialize I18n manager
   */
  async onInit() {
    this.logger.info('🌐 Initializing I18n Manager...');
    
    // Load saved language preference
    this.loadLanguagePreference();
    
    // Auto-detect browser language if enabled
    if (this.config.autoDetect && !localStorage.getItem(this.config.storageKey)) {
      this.detectBrowserLanguage();
    }
    
    // Create language toggle button
    this.createLanguageToggle();
    
    // Load current language translations
    await this.loadTranslations(this.state.currentLanguage);
    
    // Apply translations to current page
    this.applyTranslations();
    
    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Initialize default Turkish translations
   */
  initializeDefaultTranslations() {
    const defaultTranslations = {
      // Navigation
      'nav.home': 'Ana Sayfa',
      'nav.about': 'Hakkımızda',
      'nav.services': 'Hizmetler',
      'nav.contact': 'İletişim',
      'nav.blog': 'Blog',
      
      // Common
      'common.loading': 'Yükleniyor...',
      'common.error': 'Hata',
      'common.success': 'Başarılı',
      'common.cancel': 'İptal',
      'common.save': 'Kaydet',
      'common.close': 'Kapat',
      'common.back': 'Geri',
      'common.next': 'İleri',
      'common.previous': 'Önceki',
      'common.submit': 'Gönder',
      'common.search': 'Ara',
      'common.filter': 'Filtrele',
      'common.sort': 'Sırala',
      'common.view_all': 'Tümünü Gör',
      'common.read_more': 'Devamını Oku',
      
      // Hero Section
      'hero.title': 'Yenilikçi Teknoloji Çözümleri',
      'hero.subtitle': 'AI odaklı hizmetlerle geliştiricilere ve işletmelere ilham veriyoruz. Türkçe destekli çözümlerle yerel pazardan globale uzanan vizyonumuzla yanınızdayız.',
      'hero.cta_primary': 'Hizmetlerimizi Keşfedin',
      'hero.cta_secondary': 'İletişime Geçin',
      
      // Services
      'services.title': 'Hizmetlerimiz',
      'services.subtitle': 'Modern teknolojilerle hayalinizdeki projeleri gerçeğe dönüştürüyoruz',
      'services.web.title': 'Web Siteleri',
      'services.web.description': 'SEO uyumlu, mobil dostu ve modern web çözümleri geliştiriyoruz.',
      'services.mobile.title': 'Mobil Uygulamalar',
      'services.mobile.description': 'Çapraz platform mobil uygulamalar ile her cihazda mükemmel deneyim.',
      'services.desktop.title': 'Masaüstü Araçlar',
      'services.desktop.description': 'Otomasyon ve IDE destekli yazılımlarla iş süreçlerinizi hızlandırın.',
      'services.ai.title': 'AI Eklentileri',
      'services.ai.description': 'NexlifyBuddy gibi AI destekli kodlama araçları ile verimliliğinizi artırın.',
      'services.consulting.title': 'Danışmanlık',
      'services.consulting.description': 'NGINX, API ve otomasyon konularında uzman rehberliği sağlıyoruz.',
      
      // Contact
      'contact.title': 'İletişim',
      'contact.subtitle': 'Projeleriniz için ücretsiz konsültasyon alın',
      'contact.form.name': 'Ad Soyad',
      'contact.form.email': 'E-posta',
      'contact.form.phone': 'Telefon',
      'contact.form.service': 'Hizmet Türü',
      'contact.form.budget': 'Bütçe Aralığı',
      'contact.form.message': 'Mesajınız',
      'contact.form.submit': 'Mesaj Gönder',
      
      // Footer
      'footer.company': 'Şirket',
      'footer.services': 'Hizmetler',
      'footer.contact': 'İletişim',
      'footer.rights': 'Tüm hakları saklıdır.',
      
      // Theme
      'theme.toggle': 'Tema değiştir',
      'theme.light': 'Açık tema',
      'theme.dark': 'Karanlık tema',
      'theme.auto': 'Otomatik tema',
      
      // Language
      'language.toggle': 'Dil değiştir',
      'language.turkish': 'Türkçe',
      'language.english': 'English'
    };
    
    this.translations.set('tr', defaultTranslations);
    this.fallbackTranslations.set('tr', defaultTranslations);
  }

  /**
   * Load language preference from storage
   */
  loadLanguagePreference() {
    if (!this.config.persistChoice) return;
    
    try {
      const savedLanguage = localStorage.getItem(this.config.storageKey);
      if (savedLanguage && this.state.availableLanguages.includes(savedLanguage)) {
        this.setState({ currentLanguage: savedLanguage });
        this.logger.info(`📂 Language preference loaded: ${savedLanguage}`);
      }
    } catch (error) {
      this.logger.warn('⚠️ Failed to load language preference:', error);
    }
  }

  /**
   * Save language preference to storage
   */
  saveLanguagePreference() {
    if (!this.config.persistChoice) return;
    
    try {
      localStorage.setItem(this.config.storageKey, this.state.currentLanguage);
      this.logger.info(`💾 Language preference saved: ${this.state.currentLanguage}`);
    } catch (error) {
      this.logger.warn('⚠️ Failed to save language preference:', error);
    }
  }

  /**
   * Detect browser language
   */
  detectBrowserLanguage() {
    const browserLanguage = navigator.language || navigator.userLanguage;
    const languageCode = browserLanguage.split('-')[0]; // Get language code without region
    
    if (this.state.availableLanguages.includes(languageCode)) {
      this.setState({ currentLanguage: languageCode });
      this.logger.info(`🔍 Browser language detected: ${languageCode}`);
    }
  }

  /**
   * Create language toggle button
   */
  createLanguageToggle() {
    this.languageToggle = document.createElement('button');
    this.languageToggle.className = 'language-toggle';
    this.languageToggle.setAttribute('aria-label', this.t('language.toggle'));
    this.languageToggle.setAttribute('title', this.t('language.toggle'));
    
    // Style the button
    this.styleLanguageToggle();
    
    // Add to page
    document.body.appendChild(this.languageToggle);
    
    // Update button content
    this.updateLanguageToggle();
    
    // Add click handler
    this.addDOMEventListener(this.languageToggle, 'click', this.toggleLanguage);
    
    this.logger.info('🔘 Language toggle button created');
  }

  /**
   * Style the language toggle button
   */
  styleLanguageToggle() {
    const styles = `
      .language-toggle {
        position: fixed;
        top: 80px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        border: none;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        color: var(--text-primary);
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        z-index: 1000;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      
      .language-toggle:hover {
        transform: scale(1.1);
        background: rgba(255, 255, 255, 0.2);
      }
      
      .language-toggle:focus {
        outline: 2px solid var(--accent-color);
        outline-offset: 2px;
      }
      
      .language-toggle:active {
        transform: scale(0.95);
      }
      
      @media (max-width: 768px) {
        .language-toggle {
          width: 44px;
          height: 44px;
          font-size: 0.8rem;
          top: 75px;
          right: 15px;
        }
      }
    `;
    
    // Add styles to head if not already present
    if (!document.querySelector('#language-toggle-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'language-toggle-styles';
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
    }
  }

  /**
   * Update language toggle button
   */
  updateLanguageToggle() {
    if (!this.languageToggle) return;
    
    const languageLabels = {
      tr: 'TR',
      en: 'EN'
    };
    
    this.languageToggle.textContent = languageLabels[this.state.currentLanguage] || 'TR';
    this.languageToggle.setAttribute('aria-label', this.t('language.toggle'));
    this.languageToggle.setAttribute('title', this.t('language.toggle'));
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for language change requests
    this.on('i18n:set-language', (data) => {
      this.setLanguage(data.language);
    });
    
    // Listen for translation requests
    this.on('i18n:translate', (data) => {
      const translation = this.t(data.key, data.params);
      this.emit('i18n:translation-result', {
        key: data.key,
        translation,
        language: this.state.currentLanguage
      });
    });
  }

  /**
   * Load translations for a language
   */
  async loadTranslations(language) {
    if (this.state.loadedLanguages.has(language)) {
      this.logger.debug(`📚 Translations already loaded for: ${language}`);
      return;
    }
    
    this.setState({ isLoading: true });
    
    try {
      this.logger.info(`📥 Loading translations for: ${language}`);
      
      // Try to load from external file
      const translationsUrl = `${this.config.translationsPath}/${language}.json`;
      
      try {
        const response = await fetch(translationsUrl);
        if (response.ok) {
          const translations = await response.json();
          this.translations.set(language, translations);
          this.logger.success(`✅ Translations loaded from file: ${language}`);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (fetchError) {
        this.logger.warn(`⚠️ Failed to load translations from file: ${fetchError.message}`);
        
        // Use built-in translations for English
        if (language === 'en') {
          this.loadBuiltInEnglishTranslations();
        }
      }
      
      this.state.loadedLanguages.add(language);
      
    } catch (error) {
      this.logger.error(`❌ Failed to load translations for ${language}:`, error);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  /**
   * Load built-in English translations
   */
  loadBuiltInEnglishTranslations() {
    const englishTranslations = {
      // Navigation
      'nav.home': 'Home',
      'nav.about': 'About',
      'nav.services': 'Services',
      'nav.contact': 'Contact',
      'nav.blog': 'Blog',
      
      // Common
      'common.loading': 'Loading...',
      'common.error': 'Error',
      'common.success': 'Success',
      'common.cancel': 'Cancel',
      'common.save': 'Save',
      'common.close': 'Close',
      'common.back': 'Back',
      'common.next': 'Next',
      'common.previous': 'Previous',
      'common.submit': 'Submit',
      'common.search': 'Search',
      'common.filter': 'Filter',
      'common.sort': 'Sort',
      'common.view_all': 'View All',
      'common.read_more': 'Read More',
      
      // Hero Section
      'hero.title': 'Innovative Technology Solutions',
      'hero.subtitle': 'We inspire developers and businesses with AI-focused services. With Turkish-supported solutions, we are with you with our vision extending from the local market to the global.',
      'hero.cta_primary': 'Discover Our Services',
      'hero.cta_secondary': 'Get In Touch',
      
      // Services
      'services.title': 'Our Services',
      'services.subtitle': 'We turn your dream projects into reality with modern technologies',
      'services.web.title': 'Web Sites',
      'services.web.description': 'We develop SEO-friendly, mobile-friendly and modern web solutions.',
      'services.mobile.title': 'Mobile Applications',
      'services.mobile.description': 'Perfect experience on every device with cross-platform mobile applications.',
      'services.desktop.title': 'Desktop Tools',
      'services.desktop.description': 'Speed up your business processes with automation and IDE-supported software.',
      'services.ai.title': 'AI Plugins',
      'services.ai.description': 'Increase your productivity with AI-supported coding tools like NexlifyBuddy.',
      'services.consulting.title': 'Consulting',
      'services.consulting.description': 'We provide expert guidance on NGINX, API and automation.',
      
      // Contact
      'contact.title': 'Contact',
      'contact.subtitle': 'Get free consultation for your projects',
      'contact.form.name': 'Full Name',
      'contact.form.email': 'Email',
      'contact.form.phone': 'Phone',
      'contact.form.service': 'Service Type',
      'contact.form.budget': 'Budget Range',
      'contact.form.message': 'Your Message',
      'contact.form.submit': 'Send Message',
      
      // Footer
      'footer.company': 'Company',
      'footer.services': 'Services',
      'footer.contact': 'Contact',
      'footer.rights': 'All rights reserved.',
      
      // Theme
      'theme.toggle': 'Toggle theme',
      'theme.light': 'Light theme',
      'theme.dark': 'Dark theme',
      'theme.auto': 'Auto theme',
      
      // Language
      'language.toggle': 'Change language',
      'language.turkish': 'Türkçe',
      'language.english': 'English'
    };
    
    this.translations.set('en', englishTranslations);
    this.logger.info('📚 Built-in English translations loaded');
  }

  /**
   * Get translation for a key
   */
  t(key, params = {}) {
    const currentTranslations = this.translations.get(this.state.currentLanguage);
    const fallbackTranslations = this.translations.get(this.config.fallbackLanguage);
    
    let translation = currentTranslations?.[key] || 
                     fallbackTranslations?.[key] || 
                     key;
    
    // Replace parameters
    if (params && typeof params === 'object') {
      Object.keys(params).forEach(param => {
        const placeholder = `{{${param}}}`;
        translation = translation.replace(new RegExp(placeholder, 'g'), params[param]);
      });
    }
    
    return translation;
  }

  /**
   * Set language
   */
  async setLanguage(language) {
    if (!this.state.availableLanguages.includes(language)) {
      this.logger.warn(`⚠️ Language not available: ${language}`);
      return false;
    }
    
    if (language === this.state.currentLanguage) {
      this.logger.debug(`🔄 Language already set: ${language}`);
      return true;
    }
    
    const oldLanguage = this.state.currentLanguage;
    
    try {
      this.logger.info(`🔄 Changing language: ${oldLanguage} → ${language}`);
      
      // Load translations if not already loaded
      await this.loadTranslations(language);
      
      // Update state
      this.setState({ currentLanguage: language });
      
      // Save preference
      this.saveLanguagePreference();
      
      // Update language toggle
      this.updateLanguageToggle();
      
      // Apply translations to current page
      this.applyTranslations();
      
      // Update document language
      document.documentElement.lang = language;
      
      // Emit language change event
      this.emit('i18n:language-changed', {
        oldLanguage,
        newLanguage: language,
        translations: this.translations.get(language)
      });
      
      // Announce to screen readers
      this.announceLanguageChange(language);
      
      this.logger.success(`✅ Language changed to: ${language}`);
      return true;
      
    } catch (error) {
      this.logger.error(`❌ Failed to change language to ${language}:`, error);
      return false;
    }
  }

  /**
   * Toggle between available languages
   */
  toggleLanguage = () => {
    const currentIndex = this.state.availableLanguages.indexOf(this.state.currentLanguage);
    const nextIndex = (currentIndex + 1) % this.state.availableLanguages.length;
    const nextLanguage = this.state.availableLanguages[nextIndex];
    
    this.setLanguage(nextLanguage);
  };

  /**
   * Apply translations to current page
   */
  applyTranslations() {
    // Find all elements with data-i18n attribute
    const translatableElements = document.querySelectorAll('[data-i18n]');
    
    translatableElements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.t(key);
      
      // Update text content or specific attribute
      const attribute = element.getAttribute('data-i18n-attr');
      if (attribute) {
        element.setAttribute(attribute, translation);
      } else {
        element.textContent = translation;
      }
    });
    
    // Update placeholder texts
    const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderElements.forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      const translation = this.t(key);
      element.setAttribute('placeholder', translation);
    });
    
    // Update title attributes
    const titleElements = document.querySelectorAll('[data-i18n-title]');
    titleElements.forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      const translation = this.t(key);
      element.setAttribute('title', translation);
    });
    
    this.logger.debug(`🔄 Applied translations to ${translatableElements.length} elements`);
  }

  /**
   * Announce language change to screen readers
   */
  announceLanguageChange(language) {
    const languageNames = {
      tr: 'Türkçe',
      en: 'English'
    };
    
    const message = `${this.t('language.toggle')}: ${languageNames[language]}`;
    EventBus.emit('announce', message);
  }

  /**
   * Get available languages
   */
  getAvailableLanguages() {
    return [...this.state.availableLanguages];
  }

  /**
   * Get current language
   */
  getCurrentLanguage() {
    return this.state.currentLanguage;
  }

  /**
   * Check if language is loaded
   */
  isLanguageLoaded(language) {
    return this.state.loadedLanguages.has(language);
  }

  /**
   * Add custom translation
   */
  addTranslation(language, key, value) {
    if (!this.translations.has(language)) {
      this.translations.set(language, {});
    }
    
    this.translations.get(language)[key] = value;
    this.logger.debug(`➕ Translation added: ${language}.${key} = ${value}`);
  }

  /**
   * Add multiple translations
   */
  addTranslations(language, translations) {
    if (!this.translations.has(language)) {
      this.translations.set(language, {});
    }
    
    Object.assign(this.translations.get(language), translations);
    this.logger.debug(`➕ Multiple translations added for: ${language}`);
  }

  /**
   * Get all translations for a language
   */
  getTranslations(language = null) {
    const lang = language || this.state.currentLanguage;
    return this.translations.get(lang) || {};
  }

  /**
   * Component cleanup
   */
  async onDestroy() {
    // Remove language toggle button
    if (this.languageToggle && this.languageToggle.parentNode) {
      this.languageToggle.parentNode.removeChild(this.languageToggle);
    }
    
    // Clear translations
    this.translations.clear();
    this.fallbackTranslations.clear();
    
    this.logger.info('🧹 I18n Manager cleaned up');
  }
}