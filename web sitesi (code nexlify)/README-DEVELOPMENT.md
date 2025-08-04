# CodeNexlify Development Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm 9+
- Modern browser with ES6+ support

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
codenexlify-website/
├── src/
│   ├── core/                 # Core application modules
│   │   ├── App.js           # Main application class
│   │   ├── ComponentRegistry.js # Component management
│   │   └── EventBus.js      # Event system
│   ├── components/          # Reusable components
│   │   ├── ThemeManager.js  # Theme switching
│   │   ├── I18nManager.js   # Internationalization
│   │   └── ...
│   ├── utils/               # Utility functions
│   │   ├── Logger.js        # Logging system
│   │   ├── helpers.js       # Helper functions
│   │   └── api.js          # API utilities
│   ├── styles/              # SCSS stylesheets
│   │   ├── main.scss        # Main stylesheet
│   │   ├── _variables.scss  # SCSS variables
│   │   ├── _mixins.scss     # SCSS mixins
│   │   └── components/      # Component styles
│   ├── assets/              # Static assets
│   ├── tests/               # Test files
│   └── index.js            # Application entry point
├── public/                  # Public assets
├── dist/                    # Build output
├── vite.config.js          # Vite configuration
├── package.json            # Dependencies and scripts
└── README.md               # Project documentation
```

## 🛠️ Development Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build           # Build for production
npm run preview         # Preview production build

# Testing
npm test                # Run tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run format          # Format code with Prettier

# Analysis
npm run analyze         # Bundle size analysis
npm run lighthouse      # Performance audit
```

## 🏗️ Architecture

### Core System
- **App.js**: Main application lifecycle management
- **ComponentRegistry.js**: Component registration and dependency injection
- **EventBus.js**: Global event communication system

### Component System
- Modular component architecture
- Lifecycle management (init, cleanup)
- Event-driven communication
- Dependency injection support

### Styling
- SCSS with modern features
- CSS custom properties for theming
- Component-scoped styles
- Responsive design utilities

### Build System
- Vite for fast development and building
- Code splitting and lazy loading
- PWA support with service workers
- Modern JavaScript (ES6+)

## 🎨 Theming

The application supports multiple themes:

```javascript
// Theme switching
import { ThemeManager } from './components/ThemeManager.js';

const themeManager = new ThemeManager();
themeManager.setTheme('dark'); // 'light', 'dark', 'auto'
```

### CSS Custom Properties
```css
:root {
  --primary-color: #667eea;
  --text-primary: #1a1a2e;
  --background-primary: #ffffff;
}

[data-theme="dark"] {
  --primary-color: #8b9cf7;
  --text-primary: #e2e8f0;
  --background-primary: #1a202c;
}
```

## 🌐 Internationalization

Multi-language support with dynamic loading:

```javascript
import { I18nManager } from './components/I18nManager.js';

const i18n = new I18nManager();
await i18n.setLanguage('en'); // 'tr', 'en'
const text = i18n.t('welcome.message');
```

## 📱 PWA Features

Progressive Web App capabilities:
- Service worker for offline support
- App manifest for installation
- Background sync
- Push notifications (planned)

## 🧪 Testing

### Unit Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- ThemeManager.test.js

# Run tests in watch mode
npm run test:watch
```

### Test Structure
```javascript
import { ThemeManager } from '../components/ThemeManager.js';

describe('ThemeManager', () => {
  let themeManager;
  
  beforeEach(() => {
    themeManager = new ThemeManager();
  });
  
  test('should initialize with light theme', () => {
    expect(themeManager.currentTheme).toBe('light');
  });
});
```

## 📊 Performance

### Optimization Strategies
- Code splitting by routes and components
- Lazy loading of non-critical resources
- Image optimization and lazy loading
- CSS and JavaScript minification
- Service worker caching

### Performance Monitoring
```javascript
import { PerformanceMonitor } from './utils/PerformanceMonitor.js';

const monitor = new PerformanceMonitor();
monitor.measurePageLoad();
monitor.trackUserInteraction();
```

## 🔧 Configuration

### Environment Variables
```bash
# .env.local
VITE_API_URL=https://api.codenexlify.com
VITE_GA_ID=GA_MEASUREMENT_ID
VITE_DEBUG=true
```

### Vite Configuration
```javascript
// vite.config.js
export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ]
});
```

## 🚀 Deployment

### Build Process
```bash
# Production build
npm run build

# Analyze bundle
npm run analyze

# Test production build locally
npm run preview
```

### Deployment Targets
- **Netlify**: Automatic deployment from Git
- **Vercel**: Zero-config deployment
- **GitHub Pages**: Static hosting
- **Custom Server**: Traditional hosting

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run build
      - name: Deploy to Netlify
        run: npm run deploy
```

## 🐛 Debugging

### Development Tools
- Browser DevTools integration
- Vue DevTools (if using Vue components)
- Performance profiling
- Network monitoring

### Logging System
```javascript
import { Logger } from './utils/Logger.js';

const logger = new Logger('ComponentName');
logger.info('Information message');
logger.error('Error message', error);
logger.debug('Debug information');
```

### Error Handling
```javascript
// Global error handling
window.addEventListener('error', (event) => {
  logger.error('Global error:', event.error);
});

// Promise rejection handling
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection:', event.reason);
});
```

## 📚 Best Practices

### Code Organization
- Use ES6 modules for better tree shaking
- Keep components small and focused
- Use composition over inheritance
- Implement proper error boundaries

### Performance
- Lazy load non-critical components
- Use intersection observer for animations
- Optimize images and assets
- Minimize bundle size

### Accessibility
- Use semantic HTML
- Implement ARIA attributes
- Ensure keyboard navigation
- Test with screen readers

### Security
- Sanitize user inputs
- Use Content Security Policy
- Implement CSRF protection
- Validate all data

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Run tests and linting
6. Submit a pull request

### Code Style
- Use ESLint and Prettier
- Follow naming conventions
- Write meaningful commit messages
- Document complex functions

### Pull Request Process
1. Update documentation
2. Add tests for new features
3. Ensure all tests pass
4. Update CHANGELOG.md
5. Request code review

## 📖 Resources

### Documentation
- [Vite Documentation](https://vitejs.dev/)
- [SCSS Guide](https://sass-lang.com/guide)
- [Jest Testing Framework](https://jestjs.io/)
- [PWA Documentation](https://web.dev/progressive-web-apps/)

### Tools
- [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)

## 🆘 Troubleshooting

### Common Issues

**Build fails with module not found**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Styles not updating in development**
```bash
# Clear Vite cache
rm -rf .vite
npm run dev
```

**Tests failing in CI**
```bash
# Check Node.js version compatibility
# Ensure all dependencies are installed
# Verify test environment setup
```

### Getting Help
- Check existing GitHub issues
- Create detailed bug reports
- Join our Discord community
- Contact the development team

---

For more information, see the main [README.md](README.md) file.