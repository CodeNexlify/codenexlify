/**
 * Navigation Manager Component
 * Handles navigation functionality and mobile menu
 */

import { BaseComponent } from '../core/BaseComponent.js';
import { EventBus } from '../core/EventBus.js';

export class NavigationManager extends BaseComponent {
  constructor(options = {}) {
    super({
      name: 'NavigationManager',
      ...options
    });
    
    // Navigation specific state
    this.setState({
      mobileMenuOpen: false,
      currentPage: 'home',
      scrolled: false,
      isSticky: false
    });
    
    // DOM references
    this.navbar = null;
    this.hamburger = null;
    this.navMenu = null;
    this.navLinks = [];
    
    // Configuration
    this.config = {
      ...this.config,
      stickyOffset: 100,
      mobileBreakpoint: 768,
      smoothScroll: true,
      autoHighlight: true
    };
    
    // Scroll throttling
    this.scrollThrottleId = null;
    this.lastScrollY = 0;
  }

  /**
   * Initialize navigation manager
   */
  async onInit() {
    this.logger.info('🧭 Initializing Navigation Manager...');
    
    // Find navigation elements
    this.findNavigationElements();
    
    // Detect current page
    this.detectCurrentPage();
    
    // Setup navigation functionality
    this.setupNavigation();
    
    // Setup scroll handling
    this.setupScrollHandling();
    
    // Setup responsive behavior
    this.setupResponsiveBehavior();
  }

  /**
   * Find navigation DOM elements
   */
  findNavigationElements() {
    this.navbar = document.querySelector('.navbar') || document.querySelector('nav');
    this.hamburger = document.querySelector('.hamburger');
    this.navMenu = document.querySelector('.nav-menu');
    this.navLinks = Array.from(document.querySelectorAll('.nav-link'));
    
    if (!this.navbar) {
      this.logger.warn('⚠️ Navigation bar not found');
      return;
    }
    
    this.logger.debug(`📍 Found navigation elements: navbar=${!!this.navbar}, hamburger=${!!this.hamburger}, menu=${!!this.navMenu}, links=${this.navLinks.length}`);
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
    
    const currentPage = pageMap[filename] || 'home';
    this.setState({ currentPage });
    
    this.logger.info(`📄 Current page detected: ${currentPage}`);
  }

  /**
   * Setup navigation functionality
   */
  setupNavigation() {
    // Setup mobile menu toggle
    if (this.hamburger) {
      this.addDOMEventListener(this.hamburger, 'click', this.toggleMobileMenu);
    }
    
    // Setup navigation links
    this.navLinks.forEach(link => {
      this.addDOMEventListener(link, 'click', this.handleNavLinkClick);
    });
    
    // Setup smooth scrolling for anchor links
    if (this.config.smoothScroll) {
      this.setupSmoothScrolling();
    }
    
    // Highlight current page
    if (this.config.autoHighlight) {
      this.highlightCurrentPage();
    }
    
    // Close mobile menu when clicking outside
    this.addDOMEventListener(document, 'click', this.handleOutsideClick);
    
    // Handle escape key
    this.addDOMEventListener(document, 'keydown', this.handleKeyDown);
  }

  /**
   * Setup scroll handling
   */
  setupScrollHandling() {
    this.addDOMEventListener(window, 'scroll', this.handleScroll);
    
    // Initial scroll check
    this.handleScroll();
  }

  /**
   * Setup responsive behavior
   */
  setupResponsiveBehavior() {
    // Handle window resize
    this.addDOMEventListener(window, 'resize', this.handleResize);
    
    // Initial resize check
    this.handleResize();
  }

  /**
   * Setup smooth scrolling for anchor links
   */
  setupSmoothScrolling() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
      this.addDOMEventListener(link, 'click', (event) => {
        event.preventDefault();
        
        const targetId = link.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          this.scrollToElement(targetElement);
          
          // Close mobile menu if open
          if (this.state.mobileMenuOpen) {
            this.closeMobileMenu();
          }
        }
      });
    });
  }

  /**
   * Scroll to element smoothly
   */
  scrollToElement(element, offset = 80) {
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - offset;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
    
    this.emit('navigation:scroll', { 
      target: element, 
      position: offsetPosition 
    });
  }

  /**
   * Handle scroll events
   */
  handleScroll = () => {
    // Throttle scroll events
    if (this.scrollThrottleId) {
      return;
    }
    
    this.scrollThrottleId = requestAnimationFrame(() => {
      const currentScrollY = window.scrollY;
      const scrolled = currentScrollY > this.config.stickyOffset;
      const scrollDirection = currentScrollY > this.lastScrollY ? 'down' : 'up';
      
      // Update scrolled state
      if (scrolled !== this.state.scrolled) {
        this.setState({ scrolled });
        this.updateNavbarAppearance();
      }
      
      // Handle navbar visibility on mobile
      if (window.innerWidth <= this.config.mobileBreakpoint) {
        this.handleMobileNavbarVisibility(scrollDirection, currentScrollY);
      }
      
      this.lastScrollY = currentScrollY;
      this.scrollThrottleId = null;
      
      // Emit scroll event
      this.emit('navigation:scroll', {
        scrollY: currentScrollY,
        direction: scrollDirection,
        scrolled
      });
    });
  };

  /**
   * Handle mobile navbar visibility
   */
  handleMobileNavbarVisibility(direction, scrollY) {
    if (!this.navbar) return;
    
    const shouldHide = direction === 'down' && scrollY > 200 && !this.state.mobileMenuOpen;
    
    if (shouldHide) {
      this.navbar.style.transform = 'translateY(-100%)';
    } else {
      this.navbar.style.transform = 'translateY(0)';
    }
  }

  /**
   * Update navbar appearance based on scroll
   */
  updateNavbarAppearance() {
    if (!this.navbar) return;
    
    if (this.state.scrolled) {
      this.navbar.classList.add('scrolled');
    } else {
      this.navbar.classList.remove('scrolled');
    }
  }

  /**
   * Handle window resize
   */
  handleResize = () => {
    const isMobile = window.innerWidth <= this.config.mobileBreakpoint;
    
    // Close mobile menu on desktop
    if (!isMobile && this.state.mobileMenuOpen) {
      this.closeMobileMenu();
    }
    
    // Reset navbar transform
    if (this.navbar) {
      this.navbar.style.transform = '';
    }
    
    this.emit('navigation:resize', {
      width: window.innerWidth,
      isMobile
    });
  };

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu = (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (this.state.mobileMenuOpen) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  };

  /**
   * Open mobile menu
   */
  openMobileMenu() {
    this.setState({ mobileMenuOpen: true });
    
    if (this.hamburger) {
      this.hamburger.classList.add('active');
    }
    
    if (this.navMenu) {
      this.navMenu.classList.add('active');
    }
    
    document.body.classList.add('menu-open');
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    this.emit('navigation:menu:opened');
    this.logger.debug('📱 Mobile menu opened');
  }

  /**
   * Close mobile menu
   */
  closeMobileMenu() {
    this.setState({ mobileMenuOpen: false });
    
    if (this.hamburger) {
      this.hamburger.classList.remove('active');
    }
    
    if (this.navMenu) {
      this.navMenu.classList.remove('active');
    }
    
    document.body.classList.remove('menu-open');
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    this.emit('navigation:menu:closed');
    this.logger.debug('📱 Mobile menu closed');
  }

  /**
   * Handle navigation link clicks
   */
  handleNavLinkClick = (event) => {
    const link = event.currentTarget;
    const href = link.getAttribute('href');
    
    // Close mobile menu
    if (this.state.mobileMenuOpen) {
      this.closeMobileMenu();
    }
    
    // Handle external links
    if (href && (href.startsWith('http') || href.startsWith('mailto'))) {
      return; // Let browser handle normally
    }
    
    // Handle internal navigation
    if (href && !href.startsWith('#')) {
      this.emit('navigation:link:clicked', {
        href,
        text: link.textContent,
        element: link
      });
    }
    
    this.logger.debug(`🔗 Navigation link clicked: ${href}`);
  };

  /**
   * Handle clicks outside navigation
   */
  handleOutsideClick = (event) => {
    if (!this.state.mobileMenuOpen) return;
    
    const isNavClick = this.navbar && this.navbar.contains(event.target);
    
    if (!isNavClick) {
      this.closeMobileMenu();
    }
  };

  /**
   * Handle keyboard events
   */
  handleKeyDown = (event) => {
    // Close mobile menu on Escape
    if (event.key === 'Escape' && this.state.mobileMenuOpen) {
      this.closeMobileMenu();
    }
    
    // Handle arrow key navigation
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      this.handleArrowKeyNavigation(event);
    }
  };

  /**
   * Handle arrow key navigation
   */
  handleArrowKeyNavigation(event) {
    if (!this.state.mobileMenuOpen) return;
    
    const focusedElement = document.activeElement;
    const currentIndex = this.navLinks.indexOf(focusedElement);
    
    if (currentIndex === -1) return;
    
    event.preventDefault();
    
    let nextIndex;
    if (event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % this.navLinks.length;
    } else {
      nextIndex = (currentIndex - 1 + this.navLinks.length) % this.navLinks.length;
    }
    
    this.navLinks[nextIndex].focus();
  }

  /**
   * Highlight current page in navigation
   */
  highlightCurrentPage() {
    this.navLinks.forEach(link => {
      link.classList.remove('active');
      
      const href = link.getAttribute('href');
      if (href) {
        const linkPage = this.getPageFromHref(href);
        if (linkPage === this.state.currentPage) {
          link.classList.add('active');
        }
      }
    });
  }

  /**
   * Get page name from href
   */
  getPageFromHref(href) {
    const filename = href.split('/').pop() || 'index.html';
    
    const pageMap = {
      'index.html': 'home',
      '': 'home',
      'about.html': 'about',
      'services.html': 'services',
      'contact.html': 'contact',
      'blog.html': 'blog'
    };
    
    return pageMap[filename] || 'home';
  }

  /**
   * Navigate to page programmatically
   */
  navigateTo(page) {
    const pageUrls = {
      home: 'index.html',
      about: 'about.html',
      services: 'services.html',
      contact: 'contact.html',
      blog: 'blog.html'
    };
    
    const url = pageUrls[page];
    if (url) {
      window.location.href = url;
    } else {
      this.logger.warn(`⚠️ Unknown page: ${page}`);
    }
  }

  /**
   * Add navigation item dynamically
   */
  addNavigationItem(item) {
    if (!this.navMenu) return false;
    
    const li = document.createElement('li');
    const a = document.createElement('a');
    
    a.href = item.href || '#';
    a.className = 'nav-link';
    a.textContent = item.text || '';
    
    if (item.icon) {
      const icon = document.createElement('i');
      icon.className = item.icon;
      a.insertBefore(icon, a.firstChild);
    }
    
    li.appendChild(a);
    this.navMenu.appendChild(li);
    
    // Add to navLinks array
    this.navLinks.push(a);
    
    // Setup event listener
    this.addDOMEventListener(a, 'click', this.handleNavLinkClick);
    
    this.emit('navigation:item:added', { item, element: a });
    this.logger.debug(`➕ Navigation item added: ${item.text}`);
    
    return a;
  }

  /**
   * Remove navigation item
   */
  removeNavigationItem(href) {
    const link = this.navLinks.find(link => link.getAttribute('href') === href);
    
    if (link && link.parentElement) {
      // Remove from DOM
      link.parentElement.remove();
      
      // Remove from navLinks array
      const index = this.navLinks.indexOf(link);
      if (index !== -1) {
        this.navLinks.splice(index, 1);
      }
      
      this.emit('navigation:item:removed', { href, element: link });
      this.logger.debug(`➖ Navigation item removed: ${href}`);
      
      return true;
    }
    
    return false;
  }

  /**
   * Get navigation state
   */
  getNavigationState() {
    return {
      currentPage: this.state.currentPage,
      mobileMenuOpen: this.state.mobileMenuOpen,
      scrolled: this.state.scrolled,
      navLinksCount: this.navLinks.length
    };
  }

  /**
   * Component cleanup
   */
  async onDestroy() {
    // Close mobile menu
    if (this.state.mobileMenuOpen) {
      this.closeMobileMenu();
    }
    
    // Cancel any pending scroll throttle
    if (this.scrollThrottleId) {
      cancelAnimationFrame(this.scrollThrottleId);
    }
    
    // Reset navbar styles
    if (this.navbar) {
      this.navbar.style.transform = '';
      this.navbar.classList.remove('scrolled');
    }
    
    // Reset body styles
    document.body.classList.remove('menu-open');
    document.body.style.overflow = '';
    
    this.logger.info('🧹 Navigation Manager cleaned up');
  }
}