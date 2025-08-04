// Modern Web Features for CodeNexlify
class CodeNexlifyAnimations {
    constructor() {
        this.init();
        this.setupParticles();
        this.setupScrollAnimations();
        this.setupTypingAnimation();
        this.setupCounterAnimations();
        this.setupMobileMenu();
        this.setupAdvancedHovers();
        // this.setupCustomCursor(); // Devre dışı bırakıldı
        this.setupThemeToggle();
    }

    init() {
        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Navbar scroll effect
        this.setupNavbarScroll();
        
        // Initialize loading screen
        this.initLoadingScreen();
        
        // Remove any existing custom cursor elements
        this.cleanupCustomCursor();
    }

    // Particle System
    setupParticles() {
        const canvas = document.createElement('canvas');
        canvas.id = 'particles-canvas';
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
            opacity: 0.3;
        `;
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        let particles = [];
        
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.radius = Math.random() * 3 + 1;
                this.opacity = Math.random() * 0.5 + 0.2;
                this.hue = Math.random() * 60 + 220; // Blue to purple range
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
                if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${this.hue}, 70%, 60%, ${this.opacity})`;
                ctx.fill();
            }
        }

        // Create particles
        for (let i = 0; i < 80; i++) {
            particles.push(new Particle());
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });

            // Draw connections
            particles.forEach((particle, i) => {
                particles.slice(i + 1).forEach(otherParticle => {
                    const dx = particle.x - otherParticle.x;
                    const dy = particle.y - otherParticle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 100) {
                        ctx.beginPath();
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(otherParticle.x, otherParticle.y);
                        ctx.strokeStyle = `hsla(240, 70%, 60%, ${0.3 * (1 - distance / 100)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                });
            });

            requestAnimationFrame(animate);
        };

        animate();
    }

    // Typing Animation
    setupTypingAnimation() {
        const heroTitle = document.querySelector('.hero-title');
        if (!heroTitle) return;

        const text = heroTitle.textContent;
        heroTitle.textContent = '';
        heroTitle.style.borderRight = '3px solid #667eea';
        
        let index = 0;
        const typeSpeed = 50;
        const eraseSpeed = 30;
        const pauseTime = 2000;

        const typeWriter = () => {
            if (index < text.length) {
                heroTitle.textContent += text.charAt(index);
                index++;
                setTimeout(typeWriter, typeSpeed);
            } else {
                setTimeout(() => {
                    heroTitle.style.borderRight = 'none';
                }, 500);
            }
        };

        // Start typing after a short delay
        setTimeout(typeWriter, 1000);
    }

    // Scroll Animations
    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    
                    // Stagger animations for service cards
                    if (entry.target.classList.contains('service-card')) {
                        const cards = entry.target.parentElement.children;
                        Array.from(cards).forEach((card, index) => {
                            if (card.classList.contains('service-card')) {
                                setTimeout(() => {
                                    card.classList.add('animate-in');
                                }, index * 200);
                            }
                        });
                    }
                }
            });
        }, observerOptions);

        // Add CSS for animations
        const style = document.createElement('style');
        style.textContent = `
            .animate-element {
                opacity: 0;
                transform: translateY(50px);
                transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            }
            
            .animate-element.animate-in {
                opacity: 1;
                transform: translateY(0);
            }

            .animate-element.slide-right {
                transform: translateX(-50px);
            }
            
            .animate-element.slide-right.animate-in {
                transform: translateX(0);
            }

            .animate-element.scale {
                transform: scale(0.8);
            }
            
            .animate-element.scale.animate-in {
                transform: scale(1);
            }
        `;
        document.head.appendChild(style);

        // Apply animation classes to elements
        const animateElements = document.querySelectorAll(`
            .service-card, .feature, .value-card, .team-member, 
            .timeline-item, .faq-item, .blog-card, .section-title,
            .service-detail, .stats-card
        `);

        animateElements.forEach((el, index) => {
            el.classList.add('animate-element');
            
            // Add variation to animations
            if (index % 3 === 1) el.classList.add('slide-right');
            if (index % 4 === 2) el.classList.add('scale');
            
            observer.observe(el);
        });
    }

    // Animated Counters
    setupCounterAnimations() {
        const counters = document.querySelectorAll('.stat h3');
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => {
            counterObserver.observe(counter);
        });
    }

    animateCounter(element) {
        const text = element.textContent;
        const number = parseInt(text.replace(/\D/g, ''));
        const suffix = text.replace(/\d/g, '');
        
        if (isNaN(number)) return;
        
        const duration = 2000;
        const startTime = performance.now();
        
        const updateCounter = (currentTime) => {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            
            const currentNumber = Math.floor(progress * number);
            element.textContent = currentNumber + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        };
        
        requestAnimationFrame(updateCounter);
    }

    // Mobile Menu
    setupMobileMenu() {
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');

        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
                document.body.classList.toggle('menu-open');
            });

            // Close menu when clicking on links
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                    document.body.classList.remove('menu-open');
                });
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                    document.body.classList.remove('menu-open');
                }
            });
        }
    }

    // Advanced Hover Effects
    setupAdvancedHovers() {
        // Magnetic effect for buttons
        const magneticElements = document.querySelectorAll('.btn, .service-card, .value-card');
        
        magneticElements.forEach(element => {
            element.addEventListener('mousemove', (e) => {
                const rect = element.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                const deltaX = (e.clientX - centerX) * 0.1;
                const deltaY = (e.clientY - centerY) * 0.1;
                
                element.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.02)`;
            });
            
            element.addEventListener('mouseleave', () => {
                element.style.transform = 'translate(0px, 0px) scale(1)';
            });
        });

        // Ripple effect
        const rippleElements = document.querySelectorAll('.btn');
        rippleElements.forEach(element => {
            element.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.cssText = `
                    position: absolute;
                    width: ${size}px;
                    height: ${size}px;
                    left: ${x}px;
                    top: ${y}px;
                    background: rgba(255, 255, 255, 0.4);
                    border-radius: 50%;
                    transform: scale(0);
                    animation: ripple 0.6s linear;
                    pointer-events: none;
                `;
                
                this.style.position = 'relative';
                this.style.overflow = 'hidden';
                this.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });

        // Add ripple keyframes
        const rippleStyle = document.createElement('style');
        rippleStyle.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(2);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(rippleStyle);
    }

    // Cleanup Custom Cursor
    cleanupCustomCursor() {
        // Remove any existing custom cursor elements
        const existingCursor = document.querySelector('.custom-cursor');
        const existingFollower = document.querySelector('.cursor-follower');
        
        if (existingCursor) existingCursor.remove();
        if (existingFollower) existingFollower.remove();
        
        // Restore normal cursor
        document.body.style.cursor = 'auto';
        const elements = document.querySelectorAll('a, button, input, textarea, .btn, .service-card');
        elements.forEach(el => {
            el.style.cursor = 'pointer';
        });
    }

    // Custom Cursor
    setupCustomCursor() {
        // Skip on mobile devices
        if (window.innerWidth <= 768) return;

        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        cursor.style.cssText = `
            position: fixed;
            width: 20px;
            height: 20px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            transition: transform 0.1s ease;
            mix-blend-mode: difference;
        `;
        document.body.appendChild(cursor);

        const cursorFollower = document.createElement('div');
        cursorFollower.className = 'cursor-follower';
        cursorFollower.style.cssText = `
            position: fixed;
            width: 40px;
            height: 40px;
            border: 2px solid rgba(102, 126, 234, 0.3);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9998;
            transition: all 0.3s ease;
        `;
        document.body.appendChild(cursorFollower);

        let mouseX = 0, mouseY = 0;
        let followerX = 0, followerY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            
            cursor.style.left = mouseX - 10 + 'px';
            cursor.style.top = mouseY - 10 + 'px';
        });

        const updateFollower = () => {
            followerX += (mouseX - followerX) * 0.1;
            followerY += (mouseY - followerY) * 0.1;
            
            cursorFollower.style.left = followerX - 20 + 'px';
            cursorFollower.style.top = followerY - 20 + 'px';
            
            requestAnimationFrame(updateFollower);
        };
        updateFollower();

        // Hover effects
        const hoverElements = document.querySelectorAll('a, button, .btn, .service-card');
        hoverElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                cursor.style.transform = 'scale(1.5)';
                cursorFollower.style.transform = 'scale(1.5)';
            });
            
            element.addEventListener('mouseleave', () => {
                cursor.style.transform = 'scale(1)';
                cursorFollower.style.transform = 'scale(1)';
            });
        });

        // Normal cursor restored
        document.body.style.cursor = 'auto';
        const elements = document.querySelectorAll('a, button, input, textarea');
        elements.forEach(el => el.style.cursor = 'pointer');
    }

    // Theme Toggle
    setupThemeToggle() {
        // Create theme toggle button
        const themeToggle = document.createElement('button');
        themeToggle.innerHTML = '🌙';
        themeToggle.className = 'theme-toggle';
        themeToggle.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: none;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            color: #667eea;
            font-size: 1.5rem;
            cursor: pointer;
            z-index: 1001;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        document.body.appendChild(themeToggle);

        // Check for saved theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        if (savedTheme === 'dark') {
            themeToggle.innerHTML = '☀️';
        }

        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            themeToggle.innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
        });

        // Add dark theme CSS
        const darkThemeStyle = document.createElement('style');
        darkThemeStyle.textContent = `
            [data-theme="dark"] {
                --text-primary: #e2e8f0;
                --text-secondary: #94a3b8;
                --text-light: #64748b;
            }
            
            [data-theme="dark"] body {
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            }
            
            [data-theme="dark"] .header {
                background: rgba(0, 0, 0, 0.3);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            [data-theme="dark"] .service-card,
            [data-theme="dark"] .value-card,
            [data-theme="dark"] .team-member,
            [data-theme="dark"] .faq-item,
            [data-theme="dark"] .blog-card {
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
        `;
        document.head.appendChild(darkThemeStyle);
    }

    // Navbar Scroll Effect
    setupNavbarScroll() {
        const header = document.querySelector('.header');
        let lastScrollY = window.scrollY;

        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            
            if (currentScrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }

            // Hide/show navbar on scroll
            if (currentScrollY > lastScrollY && currentScrollY > 200) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }
            
            lastScrollY = currentScrollY;
        });
    }

    // Loading Screen
    initLoadingScreen() {
        const loadingScreen = document.createElement('div');
        loadingScreen.id = 'loading-screen';
        loadingScreen.innerHTML = `
            <div class="loading-content">
                <div class="loading-logo">
                    <i class="fas fa-code"></i>
                    <h2>CodeNexlify</h2>
                </div>
                <div class="loading-bar">
                    <div class="loading-progress"></div>
                </div>
                <p>Yenilikçi teknoloji çözümleri yükleniyor...</p>
            </div>
        `;
        
        loadingScreen.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            transition: opacity 0.5s ease;
        `;

        const loadingStyle = document.createElement('style');
        loadingStyle.textContent = `
            .loading-content {
                text-align: center;
                color: white;
            }
            
            .loading-logo {
                margin-bottom: 2rem;
            }
            
            .loading-logo i {
                font-size: 4rem;
                margin-bottom: 1rem;
                animation: logoSpin 2s linear infinite;
            }
            
            .loading-logo h2 {
                font-size: 2rem;
                font-family: 'Space Grotesk', sans-serif;
                margin: 0;
            }
            
            .loading-bar {
                width: 300px;
                height: 4px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 2px;
                margin: 2rem auto;
                overflow: hidden;
            }
            
            .loading-progress {
                height: 100%;
                background: white;
                border-radius: 2px;
                animation: loadingProgress 2s ease-in-out;
            }
            
            @keyframes logoSpin {
                to { transform: rotate(360deg); }
            }
            
            @keyframes loadingProgress {
                0% { width: 0%; }
                100% { width: 100%; }
            }
        `;
        document.head.appendChild(loadingStyle);
        document.body.appendChild(loadingScreen);

        // Remove loading screen after animation
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.remove();
            }, 500);
        }, 2500);
    }

    // Contact Form Enhancement
    setupContactForm() {
        const contactForm = document.getElementById('contact-form');
        if (!contactForm) return;

        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData.entries());
            
            // Show success message with animation
            this.showNotification('Mesajınız başarıyla gönderildi! 🎉', 'success');
            contactForm.reset();
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 2rem;
            background: ${type === 'success' ? '#10b981' : '#3b82f6'};
            color: white;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            z-index: 10001;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            font-weight: 600;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CodeNexlifyAnimations();
});

// Performance optimization
if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
        // Initialize heavy animations when browser is idle
        console.log('🚀 CodeNexlify animations loaded successfully!');
    });
}

// Service Worker for PWA features (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // navigator.serviceWorker.register('/sw.js');
    });
} 