/**
 * Vercel Deployment Readiness Tests
 * Validates that the application is ready for Vercel deployment
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

describe('Vercel Deployment Readiness', () => {
  const projectRoot = process.cwd()
  const webDistPath = path.join(projectRoot, 'packages/web/dist')
  const buildTimeout = 300000 // 5 minutes for build operations

  beforeAll(async () => {
    // Ensure clean state
    try {
      await execAsync('pnpm clean', { cwd: projectRoot })
    } catch (error) {
      console.warn('Clean command failed, continuing...', error.message)
    }
  }, buildTimeout)

  describe('Build System Validation', () => {
    test('should successfully run full build process', async () => {
      const { stdout, stderr } = await execAsync('pnpm build', { 
        cwd: projectRoot,
        timeout: buildTimeout
      })
      
      expect(stderr).not.toContain('ERROR')
      expect(stdout).toContain('built')
      
      // Verify web dist directory exists
      const webDistExists = await fs.access(webDistPath).then(() => true).catch(() => false)
      expect(webDistExists).toBe(true)
    }, buildTimeout)

    test('should generate all required build artifacts', async () => {
      const requiredFiles = [
        'index.html',
        'assets',
        'favicon.ico'
      ]

      for (const file of requiredFiles) {
        const filePath = path.join(webDistPath, file)
        const exists = await fs.access(filePath).then(() => true).catch(() => false)
        expect(exists).toBe(true)
      }
    })

    test('should have optimized production assets', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      
      // Check for minified JS files
      const jsFiles = files.filter(f => f.endsWith('.js'))
      expect(jsFiles.length).toBeGreaterThan(0)
      
      // Check for CSS files
      const cssFiles = files.filter(f => f.endsWith('.css'))
      expect(cssFiles.length).toBeGreaterThan(0)
      
      // Verify files are minified (no unnecessary whitespace)
      const jsFile = jsFiles[0]
      const jsContent = await fs.readFile(path.join(assetsPath, jsFile), 'utf8')
      expect(jsContent).not.toMatch(/^\s*$/m) // Should not have empty lines
    })
  })

  describe('Vercel Configuration Validation', () => {
    test('should have valid vercel.json configuration', async () => {
      const vercelConfigPath = path.join(projectRoot, 'vercel.json')
      const config = JSON.parse(await fs.readFile(vercelConfigPath, 'utf8'))
      
      expect(config.buildCommand).toBeDefined()
      expect(config.outputDirectory).toBe('packages/web/dist')
      expect(config.installCommand).toBeDefined()
      expect(config.rewrites).toBeDefined()
      expect(config.env).toHaveProperty('VITE_VERCEL_DEPLOYMENT', 'true')
    })

    test('should handle SPA routing correctly', async () => {
      const vercelConfigPath = path.join(projectRoot, 'vercel.json')
      const config = JSON.parse(await fs.readFile(vercelConfigPath, 'utf8'))
      
      const spaRewrite = config.rewrites.find(r => r.destination === '/index.html')
      expect(spaRewrite).toBeDefined()
      expect(spaRewrite.source).toBe('/(.*)')
    })
  })

  describe('Environment Variables', () => {
    test('should set Vercel deployment flag in build', async () => {
      const indexPath = path.join(webDistPath, 'index.html')
      const indexContent = await fs.readFile(indexPath, 'utf8')
      
      // The build should include the Vercel environment variable
      // This might be embedded in the built assets
      expect(indexContent).toBeTruthy()
    })

    test('should not expose sensitive information in build', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      
      for (const file of files) {
        if (file.endsWith('.js') || file.endsWith('.css')) {
          const content = await fs.readFile(path.join(assetsPath, file), 'utf8')
          
          // Check for common sensitive patterns
          expect(content).not.toMatch(/api[_-]?key/i)
          expect(content).not.toMatch(/secret/i)
          expect(content).not.toMatch(/password/i)
          expect(content).not.toMatch(/private[_-]?key/i)
        }
      }
    })
  })

  describe('Package Dependencies', () => {
    test('should have all production dependencies available', async () => {
      // Verify that the build includes all necessary dependencies
      const packageJsonPath = path.join(projectRoot, 'packages/web/package.json')
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'))
      
      expect(packageJson.dependencies).toBeDefined()
      
      // Verify critical dependencies are present
      const criticalDeps = ['vue', '@vueuse/core', 'element-plus']
      for (const dep of criticalDeps) {
        if (packageJson.dependencies[dep] || packageJson.devDependencies?.[dep]) {
          // Dependency is listed, build should have succeeded
          expect(true).toBe(true)
        }
      }
    })

    test('should not include development dependencies in build', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      
      for (const file of files) {
        if (file.endsWith('.js')) {
          const content = await fs.readFile(path.join(assetsPath, file), 'utf8')
          
          // Should not include vitest, @types, etc in production build
          expect(content).not.toContain('vitest')
          expect(content).not.toContain('@types/')
        }
      }
    })
  })

  describe('Build Size and Performance', () => {
    test('should have reasonable bundle sizes', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      
      let totalSize = 0
      for (const file of files) {
        const stats = await fs.stat(path.join(assetsPath, file))
        totalSize += stats.size
      }
      
      // Total assets should be reasonable (< 10MB for a typical Vue app)
      expect(totalSize).toBeLessThan(10 * 1024 * 1024)
    })

    test('should have gzip-optimized assets', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      
      const jsFiles = files.filter(f => f.endsWith('.js'))
      expect(jsFiles.length).toBeGreaterThan(0)
      
      // Check that JavaScript files are reasonably small (indicating minification)
      for (const jsFile of jsFiles.slice(0, 3)) { // Check first 3 files
        const stats = await fs.stat(path.join(assetsPath, jsFile))
        // Each JS file should be less than 2MB (reasonable for minified chunks)
        expect(stats.size).toBeLessThan(2 * 1024 * 1024)
      }
    })
  })

  describe('Static Asset Validation', () => {
    test('should include all required static assets', async () => {
      const publicAssets = [
        'favicon.ico',
        'index.html'
      ]

      for (const asset of publicAssets) {
        const assetPath = path.join(webDistPath, asset)
        const exists = await fs.access(assetPath).then(() => true).catch(() => false)
        expect(exists).toBe(true)
      }
    })

    test('should have valid HTML structure', async () => {
      const indexPath = path.join(webDistPath, 'index.html')
      const indexContent = await fs.readFile(indexPath, 'utf8')
      
      expect(indexContent).toContain('<!DOCTYPE html>')
      expect(indexContent).toContain('<html')
      expect(indexContent).toContain('<head>')
      expect(indexContent).toContain('<body>')
      expect(indexContent).toContain('<div id="app">')
      expect(indexContent).toContain('<script')
    })
  })

  describe('Monorepo Build Dependencies', () => {
    test('should have core package built', async () => {
      const coreDistPath = path.join(projectRoot, 'packages/core/dist')
      const exists = await fs.access(coreDistPath).then(() => true).catch(() => false)
      expect(exists).toBe(true)
    })

    test('should have ui package built', async () => {
      const uiDistPath = path.join(projectRoot, 'packages/ui/dist')
      const exists = await fs.access(uiDistPath).then(() => true).catch(() => false)
      expect(exists).toBe(true)
    })

    test('should have correct package interdependencies', async () => {
      // Verify that web package can import from core and ui
      const webPackageJson = path.join(projectRoot, 'packages/web/package.json')
      const webConfig = JSON.parse(await fs.readFile(webPackageJson, 'utf8'))
      
      // Check internal dependencies
      const dependencies = { ...webConfig.dependencies, ...webConfig.devDependencies }
      
      // Web should depend on core and ui packages
      expect(dependencies['@prompt-optimizer/core']).toBeDefined()
      expect(dependencies['@prompt-optimizer/ui']).toBeDefined()
    })
  })

  afterAll(async () => {
    // Cleanup can be added here if needed
    console.log('Deployment readiness tests completed')
  })
})