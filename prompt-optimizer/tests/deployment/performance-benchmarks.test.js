/**
 * Performance Testing for Vercel Environment
 * Tests performance characteristics that are critical for production deployment
 */

import { describe, test, expect, beforeAll } from 'vitest'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

describe('Vercel Performance Benchmarks', () => {
  const projectRoot = process.cwd()
  const webDistPath = path.join(projectRoot, 'packages/web/dist')
  
  beforeAll(async () => {
    // Ensure build exists
    const distExists = await fs.access(webDistPath).then(() => true).catch(() => false)
    if (!distExists) {
      await execAsync('pnpm build', { cwd: projectRoot, timeout: 300000 })
    }
  })

  describe('Build Performance', () => {
    test('should complete build within reasonable time', async () => {
      const startTime = Date.now()
      
      // Clean and rebuild to measure actual build time
      await execAsync('pnpm clean:dist', { cwd: projectRoot })
      await execAsync('pnpm build', { cwd: projectRoot, timeout: 600000 }) // 10 minutes max
      
      const buildTime = Date.now() - startTime
      
      // Build should complete within 5 minutes on reasonable hardware
      expect(buildTime).toBeLessThan(5 * 60 * 1000)
      console.log(`Build completed in ${buildTime}ms`)
    }, 600000)

    test('should generate efficient bundle sizes', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      
      const jsFiles = files.filter(f => f.endsWith('.js'))
      const cssFiles = files.filter(f => f.endsWith('.css'))
      
      let totalJsSize = 0
      let totalCssSize = 0
      
      for (const jsFile of jsFiles) {
        const stats = await fs.stat(path.join(assetsPath, jsFile))
        totalJsSize += stats.size
      }
      
      for (const cssFile of cssFiles) {
        const stats = await fs.stat(path.join(assetsPath, cssFile))
        totalCssSize += stats.size
      }
      
      // Performance benchmarks for bundle sizes
      expect(totalJsSize).toBeLessThan(5 * 1024 * 1024) // < 5MB total JS
      expect(totalCssSize).toBeLessThan(1 * 1024 * 1024) // < 1MB total CSS
      
      console.log(`Total JS size: ${(totalJsSize / 1024 / 1024).toFixed(2)}MB`)
      console.log(`Total CSS size: ${(totalCssSize / 1024).toFixed(2)}KB`)
    })
  })

  describe('Asset Optimization', () => {
    test('should have chunked JavaScript files', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      const jsFiles = files.filter(f => f.endsWith('.js'))
      
      // Should have multiple JS chunks for code splitting
      expect(jsFiles.length).toBeGreaterThan(1)
      
      // Should have vendor chunk (typically the largest)
      const vendorChunk = jsFiles.find(f => f.includes('vendor') || f.includes('chunk'))
      if (vendorChunk) {
        const vendorStats = await fs.stat(path.join(assetsPath, vendorChunk))
        // Vendor chunk should be reasonable size
        expect(vendorStats.size).toBeLessThan(3 * 1024 * 1024) // < 3MB
      }
    })

    test('should have optimized images', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      const imageFiles = files.filter(f => /\.(png|jpg|jpeg|webp|svg)$/i.test(f))
      
      for (const imageFile of imageFiles) {
        const stats = await fs.stat(path.join(assetsPath, imageFile))
        // Individual images should be reasonably sized
        expect(stats.size).toBeLessThan(500 * 1024) // < 500KB per image
      }
    })

    test('should have compressed CSS', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      const cssFiles = files.filter(f => f.endsWith('.css'))
      
      for (const cssFile of cssFiles) {
        const content = await fs.readFile(path.join(assetsPath, cssFile), 'utf8')
        
        // CSS should be minified (no unnecessary whitespace)
        expect(content).not.toMatch(/\n\s*\n/) // No empty lines
        expect(content).not.toMatch(/;\s+/) // No space after semicolons
        
        // Should have some compression
        const stats = await fs.stat(path.join(assetsPath, cssFile))
        expect(stats.size).toBeLessThan(300 * 1024) // < 300KB per CSS file
      }
    })
  })

  describe('Runtime Performance Indicators', () => {
    test('should have efficient module loading structure', async () => {
      const indexPath = path.join(webDistPath, 'index.html')
      const content = await fs.readFile(indexPath, 'utf8')
      
      // Should have preload links for critical resources
      const preloadLinks = (content.match(/rel="preload"/g) || []).length
      const moduleScripts = (content.match(/type="module"/g) || []).length
      
      // Modern loading patterns
      expect(moduleScripts).toBeGreaterThan(0) // Should use ES modules
      
      // Should not have too many separate script tags (indicates poor bundling)
      const scriptTags = (content.match(/<script/g) || []).length
      expect(scriptTags).toBeLessThan(10) // Reasonable number of scripts
    })

    test('should have tree-shaken dependencies', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      const jsFiles = files.filter(f => f.endsWith('.js'))
      
      // Check a main JS file for unused code patterns
      const mainJsFile = jsFiles.find(f => f.includes('index') || f.includes('main')) || jsFiles[0]
      const content = await fs.readFile(path.join(assetsPath, mainJsFile), 'utf8')
      
      // Should not contain development-only code
      expect(content).not.toContain('console.debug')
      expect(content).not.toContain('__DEV__')
    })
  })

  describe('Memory Efficiency', () => {
    test('should not have memory leaks in build output', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      const jsFiles = files.filter(f => f.endsWith('.js'))
      
      for (const jsFile of jsFiles) {
        const content = await fs.readFile(path.join(assetsPath, jsFile), 'utf8')
        
        // Check for potential memory leak patterns
        expect(content).not.toMatch(/setInterval\s*\([^}]*\)\s*[^;]*(?!clearInterval)/) // Uncleaned intervals
        expect(content).not.toContain('new Array(1000000)') // Large array allocations
      }
    })

    test('should have efficient asset loading', async () => {
      const indexPath = path.join(webDistPath, 'index.html')
      const content = await fs.readFile(indexPath, 'utf8')
      
      // Should have async or defer on non-critical scripts
      const scriptTags = content.match(/<script[^>]*>/g) || []
      
      for (const scriptTag of scriptTags) {
        if (scriptTag.includes('src=') && !scriptTag.includes('type="module"')) {
          // Non-module scripts should have async or defer
          const hasAsync = scriptTag.includes('async') || scriptTag.includes('defer')
          // This is a recommendation rather than requirement
          if (!hasAsync) {
            console.warn('Script without async/defer found:', scriptTag)
          }
        }
      }
    })
  })

  describe('Network Performance', () => {
    test('should minimize HTTP requests', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      
      // Total asset files should be reasonable
      expect(files.length).toBeLessThan(50) // Not too many separate files
      
      // Should have good bundling
      const jsFiles = files.filter(f => f.endsWith('.js'))
      const cssFiles = files.filter(f => f.endsWith('.css'))
      
      expect(jsFiles.length).toBeLessThan(20) // Well-bundled JS
      expect(cssFiles.length).toBeLessThan(10) // Well-bundled CSS
    })

    test('should have efficient caching headers support', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      
      // Files should have content hashes for cache busting
      const hashedFiles = files.filter(f => /\.[a-f0-9]{8,}\./i.test(f))
      
      // Most assets should be content-hashed
      expect(hashedFiles.length).toBeGreaterThan(files.length * 0.7)
    })
  })

  describe('Load Time Estimation', () => {
    test('should estimate reasonable load times', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      
      let criticalPathSize = 0
      
      // Calculate critical path (JS + CSS needed for first render)
      for (const file of files) {
        if (file.endsWith('.js') || file.endsWith('.css')) {
          const stats = await fs.stat(path.join(assetsPath, file))
          criticalPathSize += stats.size
        }
      }
      
      // Estimate load time on 3G (1.6 Mbps = 200KB/s)
      const estimatedLoadTime3G = (criticalPathSize / 1024 / 200) * 1000 // ms
      
      // Should load reasonably fast on 3G
      expect(estimatedLoadTime3G).toBeLessThan(10000) // < 10 seconds
      
      console.log(`Estimated 3G load time: ${estimatedLoadTime3G.toFixed(0)}ms`)
      console.log(`Critical path size: ${(criticalPathSize / 1024).toFixed(0)}KB`)
    })
  })

  describe('Production Readiness Indicators', () => {
    test('should not contain development artifacts', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      
      for (const file of files) {
        // No source maps in production (unless explicitly wanted)
        expect(file).not.toContain('.map')
        
        // No dev-only file extensions
        expect(file).not.toMatch(/\.(dev|development)\./i)
      }
    })

    test('should have production-optimized code', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      const jsFiles = files.filter(f => f.endsWith('.js'))
      
      const mainJsFile = jsFiles[0]
      const content = await fs.readFile(path.join(assetsPath, mainJsFile), 'utf8')
      
      // Should have production optimizations
      expect(content).not.toContain('process.env.NODE_ENV="development"')
      expect(content).not.toContain('__VUE_PROD_DEVTOOLS__')
      
      // Should be minified
      expect(content.length / content.split('\n').length).toBeGreaterThan(100) // High character density
    })
  })
})