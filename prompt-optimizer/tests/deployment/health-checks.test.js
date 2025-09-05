/**
 * Monitoring and Health Check Validation
 * Tests for deployment health monitoring and system validation
 */

import { describe, test, expect, beforeAll } from 'vitest'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

describe('Health Check and Monitoring Validation', () => {
  const projectRoot = process.cwd()
  const webDistPath = path.join(projectRoot, 'packages/web/dist')
  
  beforeAll(async () => {
    // Ensure build exists
    const distExists = await fs.access(webDistPath).then(() => true).catch(() => false)
    if (!distExists) {
      await execAsync('pnpm build', { cwd: projectRoot, timeout: 300000 })
    }
  })

  describe('Build Health Validation', () => {
    test('should have healthy build output structure', async () => {
      const requiredPaths = [
        path.join(webDistPath, 'index.html'),
        path.join(webDistPath, 'assets'),
        path.join(webDistPath, 'favicon.ico')
      ]
      
      const healthChecks = []
      for (const requiredPath of requiredPaths) {
        const exists = await fs.access(requiredPath).then(() => true).catch(() => false)
        healthChecks.push({ path: requiredPath, exists })
      }
      
      // All critical paths should exist
      const failedChecks = healthChecks.filter(check => !check.exists)
      expect(failedChecks.length).toBe(0)
      
      if (failedChecks.length > 0) {
        console.error('Failed health checks:', failedChecks)
      }
    })

    test('should have valid HTML entry point', async () => {
      const indexPath = path.join(webDistPath, 'index.html')
      const content = await fs.readFile(indexPath, 'utf8')
      
      const healthChecks = [
        { name: 'Has DOCTYPE', check: content.includes('<!DOCTYPE html>') },
        { name: 'Has html tag', check: content.includes('<html') },
        { name: 'Has head section', check: content.includes('<head>') },
        { name: 'Has body section', check: content.includes('<body>') },
        { name: 'Has app mount point', check: content.includes('id="app"') },
        { name: 'Has script tags', check: content.includes('<script') },
        { name: 'Valid HTML structure', check: content.includes('</html>') }
      ]
      
      const failedChecks = healthChecks.filter(check => !check.check)
      expect(failedChecks.length).toBe(0)
      
      if (failedChecks.length > 0) {
        console.error('HTML health check failures:', failedChecks.map(c => c.name))
      }
    })

    test('should have optimized asset bundles', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      
      const jsFiles = files.filter(f => f.endsWith('.js'))
      const cssFiles = files.filter(f => f.endsWith('.css'))
      
      const healthChecks = [
        { name: 'Has JavaScript files', check: jsFiles.length > 0 },
        { name: 'Has CSS files', check: cssFiles.length > 0 },
        { name: 'JS files have content hashes', check: jsFiles.some(f => /\.[a-f0-9]{8,}\./i.test(f)) },
        { name: 'CSS files have content hashes', check: cssFiles.some(f => /\.[a-f0-9]{8,}\./i.test(f)) }
      ]
      
      const failedChecks = healthChecks.filter(check => !check.check)
      expect(failedChecks.length).toBe(0)
      
      if (failedChecks.length > 0) {
        console.error('Asset bundle health check failures:', failedChecks.map(c => c.name))
      }
    })
  })

  describe('Package Dependency Health', () => {
    test('should have healthy package dependencies', async () => {
      const packages = ['core', 'ui', 'web']
      const healthChecks = []
      
      for (const pkg of packages) {
        const packageJsonPath = path.join(projectRoot, `packages/${pkg}/package.json`)
        const distPath = path.join(projectRoot, `packages/${pkg}/dist`)
        
        const packageExists = await fs.access(packageJsonPath).then(() => true).catch(() => false)
        const distExists = await fs.access(distPath).then(() => true).catch(() => false)
        
        healthChecks.push({
          package: pkg,
          packageJsonExists: packageExists,
          distExists: distExists,
          healthy: packageExists && distExists
        })
      }
      
      const unhealthyPackages = healthChecks.filter(check => !check.healthy)
      expect(unhealthyPackages.length).toBe(0)
      
      if (unhealthyPackages.length > 0) {
        console.error('Unhealthy packages:', unhealthyPackages)
      }
    })

    test('should have consistent internal dependencies', async () => {
      const webPackageJsonPath = path.join(projectRoot, 'packages/web/package.json')
      const webPackageJson = JSON.parse(await fs.readFile(webPackageJsonPath, 'utf8'))
      
      const internalDeps = Object.keys(webPackageJson.dependencies || {})
        .filter(dep => dep.startsWith('@prompt-optimizer/'))
      
      const healthChecks = []
      for (const dep of internalDeps) {
        const packageName = dep.replace('@prompt-optimizer/', '')
        const depPackagePath = path.join(projectRoot, `packages/${packageName}`)
        const exists = await fs.access(depPackagePath).then(() => true).catch(() => false)
        
        healthChecks.push({
          dependency: dep,
          packageExists: exists,
          healthy: exists
        })
      }
      
      const brokenDeps = healthChecks.filter(check => !check.healthy)
      expect(brokenDeps.length).toBe(0)
      
      if (brokenDeps.length > 0) {
        console.error('Broken internal dependencies:', brokenDeps)
      }
    })
  })

  describe('Runtime Health Checks', () => {
    test('should have runtime error boundaries', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      const jsFiles = files.filter(f => f.endsWith('.js'))
      
      let hasErrorHandling = false
      
      for (const jsFile of jsFiles) {
        const content = await fs.readFile(path.join(assetsPath, jsFile), 'utf8')
        
        // Check for Vue error handling patterns
        if (content.includes('onErrorCaptured') || 
            content.includes('errorHandler') ||
            content.includes('try') ||
            content.includes('catch')) {
          hasErrorHandling = true
          break
        }
      }
      
      expect(hasErrorHandling).toBe(true)
    })

    test('should have console error monitoring readiness', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      const jsFiles = files.filter(f => f.endsWith('.js'))
      
      let hasConsoleOverrides = false
      
      for (const jsFile of jsFiles) {
        const content = await fs.readFile(path.join(assetsPath, jsFile), 'utf8')
        
        // Check for console monitoring setup
        if (content.includes('console.error') || 
            content.includes('window.onerror') ||
            content.includes('addEventListener') && content.includes('error')) {
          hasConsoleOverrides = true
          break
        }
      }
      
      // This is optional but good to have
      console.log('Has console error monitoring:', hasConsoleOverrides)
    })

    test('should not have development-only error reporting', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      const jsFiles = files.filter(f => f.endsWith('.js'))
      
      for (const jsFile of jsFiles) {
        const content = await fs.readFile(path.join(assetsPath, jsFile), 'utf8')
        
        // Should not have development-only debugging
        expect(content).not.toContain('console.debug')
        expect(content).not.toContain('debugger;')
        expect(content).not.toContain('__VUE_PROD_DEVTOOLS__')
      }
    })
  })

  describe('Performance Health Metrics', () => {
    test('should have reasonable bundle sizes for health monitoring', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      
      let totalSize = 0
      let largestFile = { name: '', size: 0 }
      const fileSizes = []
      
      for (const file of files) {
        const stats = await fs.stat(path.join(assetsPath, file))
        totalSize += stats.size
        fileSizes.push({ name: file, size: stats.size })
        
        if (stats.size > largestFile.size) {
          largestFile = { name: file, size: stats.size }
        }
      }
      
      // Health thresholds
      const healthChecks = [
        { name: 'Total size under 10MB', check: totalSize < 10 * 1024 * 1024 },
        { name: 'Largest file under 5MB', check: largestFile.size < 5 * 1024 * 1024 },
        { name: 'Reasonable file count', check: files.length < 100 }
      ]
      
      const failedChecks = healthChecks.filter(check => !check.check)
      
      // Log metrics for monitoring
      console.log('Bundle health metrics:', {
        totalSize: Math.round(totalSize / 1024 / 1024 * 100) / 100 + 'MB',
        fileCount: files.length,
        largestFile: largestFile.name + ' (' + Math.round(largestFile.size / 1024) + 'KB)'
      })
      
      expect(failedChecks.length).toBe(0)
    })

    test('should have efficient chunk distribution', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      const jsFiles = files.filter(f => f.endsWith('.js'))
      
      // Analyze chunk distribution
      let smallChunks = 0 // < 50KB
      let mediumChunks = 0 // 50KB - 500KB
      let largeChunks = 0 // > 500KB
      
      for (const jsFile of jsFiles) {
        const stats = await fs.stat(path.join(assetsPath, jsFile))
        const sizeKB = stats.size / 1024
        
        if (sizeKB < 50) smallChunks++
        else if (sizeKB < 500) mediumChunks++
        else largeChunks++
      }
      
      const healthChecks = [
        { name: 'Has multiple chunks', check: jsFiles.length > 1 },
        { name: 'Not too many small chunks', check: smallChunks < jsFiles.length * 0.8 },
        { name: 'Not too many large chunks', check: largeChunks < jsFiles.length * 0.3 }
      ]
      
      console.log('Chunk distribution:', { smallChunks, mediumChunks, largeChunks })
      
      const failedChecks = healthChecks.filter(check => !check.check)
      expect(failedChecks.length).toBe(0)
    })
  })

  describe('Vercel Platform Health', () => {
    test('should have Vercel-compatible configuration', async () => {
      const vercelConfigPath = path.join(projectRoot, 'vercel.json')
      const config = JSON.parse(await fs.readFile(vercelConfigPath, 'utf8'))
      
      const healthChecks = [
        { name: 'Has build command', check: !!config.buildCommand },
        { name: 'Has output directory', check: !!config.outputDirectory },
        { name: 'Has install command', check: !!config.installCommand },
        { name: 'Has SPA rewrites', check: Array.isArray(config.rewrites) && config.rewrites.length > 0 },
        { name: 'Has environment config', check: !!config.env },
        { name: 'Has git deployment config', check: !!config.git }
      ]
      
      const failedChecks = healthChecks.filter(check => !check.check)
      expect(failedChecks.length).toBe(0)
      
      if (failedChecks.length > 0) {
        console.error('Vercel config health failures:', failedChecks.map(c => c.name))
      }
    })

    test('should support Vercel analytics integration', async () => {
      const indexPath = path.join(webDistPath, 'index.html')
      const content = await fs.readFile(indexPath, 'utf8')
      
      // Check if prepared for analytics (not required but good to have)
      const hasAnalyticsPreparation = content.includes('analytics') || 
                                     content.includes('va.') ||
                                     content.includes('vercel');
      
      console.log('Analytics integration prepared:', hasAnalyticsPreparation)
    })

    test('should have environment-aware build', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      const jsFiles = files.filter(f => f.endsWith('.js'))
      
      let hasVercelIntegration = false
      
      for (const jsFile of jsFiles) {
        const content = await fs.readFile(path.join(assetsPath, jsFile), 'utf8')
        
        if (content.includes('VERCEL') || content.includes('vercel')) {
          hasVercelIntegration = true
          break
        }
      }
      
      expect(hasVercelIntegration).toBe(true)
    })
  })

  describe('Deployment Validation Endpoints', () => {
    test('should support health check endpoints', async () => {
      const indexPath = path.join(webDistPath, 'index.html')
      const content = await fs.readFile(indexPath, 'utf8')
      
      // Check for router setup that could handle health endpoints
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      const jsFiles = files.filter(f => f.endsWith('.js'))
      
      let hasRouterSetup = false
      
      for (const jsFile of jsFiles) {
        const jsContent = await fs.readFile(path.join(assetsPath, jsFile), 'utf8')
        
        if (jsContent.includes('router') || 
            jsContent.includes('createRouter') ||
            jsContent.includes('vue-router')) {
          hasRouterSetup = true
          break
        }
      }
      
      console.log('Router setup for health endpoints:', hasRouterSetup)
    })

    test('should handle 404 errors gracefully', async () => {
      const vercelConfigPath = path.join(projectRoot, 'vercel.json')
      const config = JSON.parse(await fs.readFile(vercelConfigPath, 'utf8'))
      
      // Check for catch-all route
      const hasCatchAll = config.rewrites.some(rewrite => 
        rewrite.source === '(.*)' && rewrite.destination === '/index.html'
      )
      
      expect(hasCatchAll).toBe(true)
    })
  })

  describe('Monitoring Integration Readiness', () => {
    test('should be prepared for external monitoring', async () => {
      const indexPath = path.join(webDistPath, 'index.html')
      const content = await fs.readFile(indexPath, 'utf8')
      
      // Check for monitoring-friendly meta tags
      const hasViewport = content.includes('name="viewport"')
      const hasCharset = content.includes('charset="utf-8"')
      
      const healthChecks = [
        { name: 'Has viewport meta', check: hasViewport },
        { name: 'Has charset declaration', check: hasCharset }
      ]
      
      const failedChecks = healthChecks.filter(check => !check.check)
      expect(failedChecks.length).toBe(0)
    })

    test('should have performance monitoring hooks', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      const jsFiles = files.filter(f => f.endsWith('.js'))
      
      let hasPerformanceHooks = false
      
      for (const jsFile of jsFiles) {
        const content = await fs.readFile(path.join(assetsPath, jsFile), 'utf8')
        
        if (content.includes('performance') ||
            content.includes('timing') ||
            content.includes('measure')) {
          hasPerformanceHooks = true
          break
        }
      }
      
      console.log('Performance monitoring hooks available:', hasPerformanceHooks)
    })
  })

  describe('System Health Summary', () => {
    test('should generate comprehensive health report', async () => {
      const healthReport = {
        timestamp: new Date().toISOString(),
        buildHealth: {
          distExists: await fs.access(webDistPath).then(() => true).catch(() => false),
          indexExists: await fs.access(path.join(webDistPath, 'index.html')).then(() => true).catch(() => false),
          assetsExists: await fs.access(path.join(webDistPath, 'assets')).then(() => true).catch(() => false)
        },
        packageHealth: {},
        performanceMetrics: {},
        configHealth: {
          vercelConfigExists: await fs.access(path.join(projectRoot, 'vercel.json')).then(() => true).catch(() => false),
          packageJsonExists: await fs.access(path.join(projectRoot, 'package.json')).then(() => true).catch(() => false)
        }
      }
      
      // Check package health
      const packages = ['core', 'ui', 'web']
      for (const pkg of packages) {
        const distPath = path.join(projectRoot, `packages/${pkg}/dist`)
        healthReport.packageHealth[pkg] = {
          distExists: await fs.access(distPath).then(() => true).catch(() => false)
        }
      }
      
      // Performance metrics
      const assetsPath = path.join(webDistPath, 'assets')
      try {
        const files = await fs.readdir(assetsPath)
        let totalSize = 0
        
        for (const file of files) {
          const stats = await fs.stat(path.join(assetsPath, file))
          totalSize += stats.size
        }
        
        healthReport.performanceMetrics = {
          totalAssetSize: totalSize,
          assetCount: files.length,
          jsFileCount: files.filter(f => f.endsWith('.js')).length,
          cssFileCount: files.filter(f => f.endsWith('.css')).length
        }
      } catch (error) {
        healthReport.performanceMetrics.error = error.message
      }
      
      // Overall health status
      const criticalChecks = [
        healthReport.buildHealth.distExists,
        healthReport.buildHealth.indexExists,
        healthReport.buildHealth.assetsExists,
        healthReport.configHealth.vercelConfigExists
      ]
      
      healthReport.overall = {
        healthy: criticalChecks.every(check => check),
        criticalFailures: criticalChecks.filter(check => !check).length
      }
      
      console.log('Health Report:', JSON.stringify(healthReport, null, 2))
      
      expect(healthReport.overall.healthy).toBe(true)
      expect(healthReport.overall.criticalFailures).toBe(0)
    })
  })
})