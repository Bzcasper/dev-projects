# Vercel Deployment Guide for Prompt Optimizer

This guide provides comprehensive instructions for deploying the Prompt Optimizer project to Vercel with advanced features and optimizations.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or 20+ or 22+
- pnpm package manager
- Vercel CLI (optional)
- Git repository

### Basic Deployment

1. **Clone and Install**
   ```bash
   git clone <your-repo-url>
   cd prompt-optimizer
   pnpm install
   ```

2. **Build Locally (Test)**
   ```bash
   pnpm run vercel:build
   ```

3. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Or use Vercel CLI: `pnpm run deploy:prod`

## ⚙️ Configuration Overview

### vercel.json Features

Our enhanced `vercel.json` includes:

- **Edge Functions**: `/api/optimize` and `/api/health`
- **Security Headers**: CSP, CORS, XSS protection
- **Performance Caching**: Static assets, immutable resources
- **Multi-region Deployment**: Global edge network
- **Analytics Integration**: Vercel Analytics & Speed Insights
- **Health Monitoring**: Automated health checks

### Environment Variables

#### Required Variables

```bash
# Core functionality
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# Vercel deployment
VITE_VERCEL_DEPLOYMENT=true
VITE_ANALYTICS_ENABLED=true
```

#### Optional Variables

```bash
# LiteLLM Smart Routing
LITELLM_ENABLED=true
LITELLM_BASE_URL=https://your-litellm-endpoint
LITELLM_API_KEY=your-litellm-key

# Vector Search
CHROMA_URL=https://your-chroma-instance
CHROMA_API_KEY=your-chroma-key

# Security
ACCESS_PASSWORD=your-access-password
CSRF_SECRET=your-csrf-secret

# Performance
CACHE_TTL=3600
COMPRESSION_ENABLED=true
```

## 🛠️ Advanced Features

### 1. Edge Functions

#### `/api/optimize` - Prompt Optimization API
- **Runtime**: Edge
- **Regions**: Multi-region (IAD1, CLE1, FRA1, HND1)
- **Features**: CORS, rate limiting, error handling
- **Usage**: POST requests for prompt optimization

#### `/api/health` - Health Monitoring
- **Runtime**: Edge
- **Features**: System health checks, external service validation
- **Monitoring**: LiteLLM, Vector DB, system metrics
- **Cron**: Runs every 6 hours for health checks

### 2. Middleware Features

#### Security
- Content Security Policy (CSP)
- XSS Protection
- Frame Options
- CORS handling
- Rate limiting

#### Performance
- Resource preloading
- Server timing headers
- Compression headers
- Cache optimization

#### Analytics
- Geo-location detection
- A/B testing buckets
- Bot detection
- Session tracking
- Request monitoring

### 3. Build Optimizations

#### Bundle Analysis
```bash
pnpm run analyze:bundle    # Analyze bundle sizes
pnpm run perf:benchmark    # Performance benchmarking
pnpm run optimize:images   # Image optimization audit
```

#### Performance Scripts
- **Image Optimization**: Automated image analysis and recommendations
- **Bundle Analysis**: Size analysis and optimization suggestions
- **Performance Benchmarking**: Build time and asset analysis
- **Security Auditing**: Dependency vulnerability scanning

## 🌍 Multi-Region Deployment

### Supported Regions

- **IAD1**: US East (Virginia)
- **CLE1**: US East (Cleveland)
- **FRA1**: Europe (Frankfurt)
- **HND1**: Asia (Tokyo)

### Geo-based Features

#### Feature Flags by Region
- **US**: Premium models, collaboration features
- **EU**: GDPR compliance, data residency
- **China**: Baidu models, local storage
- **Global**: Analytics, basic models

#### Performance Optimization
- Edge function deployment in multiple regions
- Automatic CDN distribution
- Regional caching strategies

## 📊 Monitoring & Analytics

### Vercel Analytics Integration

```javascript
// Automatically enabled in production
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

export default function App() {
  return (
    <>
      <YourApp />
      <Analytics />
      <SpeedInsights />
    </>
  );
}
```

### Health Monitoring

#### Endpoints
- `GET /api/health` - System health status
- Health checks include:
  - Memory usage
  - External service status (LiteLLM, Vector DB)
  - Build information
  - Performance metrics

#### Metrics Tracked
- Response times
- Error rates
- Memory usage
- External service health
- Geo-location statistics

### A/B Testing

#### Available Experiments
- **UI Redesign**: 50/50 split
- **Premium CTA**: 25/50/25 split (aggressive/subtle/control)
- **Optimization Algorithm**: 10/90 split (experimental/standard)

#### Usage
```javascript
// Access experiment data from headers
const experiment = response.headers.get('X-Experiment-ui-redesign');
// Returns: 'control' or 'variant'
```

## 🔒 Security Features

### Security Headers

#### Content Security Policy
```
default-src 'self';
script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: https: blob:;
connect-src 'self' https: wss:;
```

#### Additional Security
- X-Frame-Options: SAMEORIGIN
- X-XSS-Protection: 1; mode=block
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

### Access Control

#### Password Protection
Set `ACCESS_PASSWORD` environment variable to enable site-wide password protection.

#### Rate Limiting
- API endpoints: 60 requests/minute (default)
- Bots: 100 requests/minute
- Headers: X-RateLimit-* information

## 🚀 Performance Optimizations

### Caching Strategy

#### Static Assets
```json
{
  "source": "/static/(.*)",
  "headers": [{
    "key": "Cache-Control",
    "value": "public, max-age=31536000, immutable"
  }]
}
```

#### Dynamic Content
- API responses: Context-based caching
- Health checks: No-cache for real-time status
- Bot requests: Extended caching (1-2 hours)

### Build Optimizations

#### Vite Configuration
- Code splitting
- Tree shaking
- Bundle analysis
- Asset optimization
- Source map control

#### Performance Scripts
```bash
# Run comprehensive performance audit
pnpm run perf:benchmark

# Analyze and optimize images
pnpm run optimize:images

# Lighthouse audit (if configured)
pnpm run lighthouse:audit

# Security audit
pnpm run security:audit
```

## 🛠️ Development Workflow

### Local Development
```bash
# Development with hot reload
pnpm run dev

# Development with fresh install
pnpm run dev:fresh

# Vercel-specific development
pnpm run vercel:dev
```

### Deployment Workflow
```bash
# Preview deployment
pnpm run deploy:preview

# Production deployment
pnpm run deploy:prod

# Manual Vercel CLI deployment
vercel --prod
```

### Testing
```bash
# Run all tests
pnpm test

# Test individual packages
pnpm -F @prompt-optimizer/web test
pnpm -F @prompt-optimizer/core test
```

## 📋 Troubleshooting

### Common Issues

#### Build Failures
1. Check Node.js version (18+, 20+, or 22+)
2. Verify pnpm installation
3. Clear build cache: `pnpm run clean`
4. Check environment variables

#### Edge Function Errors
1. Verify API routes are in `/api` directory
2. Check Next.js import compatibility
3. Review function timeout limits
4. Check environment variable access

#### Performance Issues
1. Run bundle analysis: `pnpm run analyze:bundle`
2. Check image optimization: `pnpm run optimize:images`
3. Review performance benchmark: `pnpm run perf:benchmark`
4. Monitor Vercel Analytics dashboard

### Debug Commands
```bash
# Verbose build output
DEBUG=* pnpm run build

# Vercel deployment logs
vercel logs <deployment-url>

# Health check debug
curl https://your-app.vercel.app/api/health
```

## 📚 Additional Resources

### Documentation
- [Vercel Documentation](https://vercel.com/docs)
- [Edge Functions Guide](https://vercel.com/docs/functions/edge-functions)
- [Vercel Analytics](https://vercel.com/analytics)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

### Monitoring Tools
- Vercel Dashboard
- Analytics Dashboard
- Speed Insights
- Function Logs
- Edge Network Status

### Support
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Edge Runtime Documentation](https://edge-runtime.vercel.app/)
- [Performance Best Practices](https://vercel.com/docs/concepts/analytics)

---

## 🎉 Deployment Checklist

- [ ] Environment variables configured
- [ ] Build passes locally (`pnpm run vercel:build`)
- [ ] Performance benchmarks acceptable
- [ ] Security headers configured
- [ ] Analytics enabled
- [ ] Health monitoring active
- [ ] Edge functions deployed
- [ ] Multi-region configuration set
- [ ] CORS policies configured
- [ ] Rate limiting enabled

**Ready for Production! 🚀**