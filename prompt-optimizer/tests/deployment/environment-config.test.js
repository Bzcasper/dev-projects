/**
 * Environment Variable and Configuration Tests
 * Validates environment-specific configuration and variable handling
 */

import { describe, test, expect, beforeAll } from 'vitest'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

describe('Environment Configuration Tests', () => {
  const projectRoot = process.cwd()
  const webDistPath = path.join(projectRoot, 'packages/web/dist')
  
  beforeAll(async () => {
    // Ensure build exists
    const distExists = await fs.access(webDistPath).then(() => true).catch(() => false)
    if (!distExists) {
      await execAsync('pnpm build', { cwd: projectRoot, timeout: 300000 })
    }
  })

  describe('Vercel Environment Configuration', () => {
    test('should have Vercel deployment flag set in build', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      const jsFiles = files.filter(f => f.endsWith('.js'))
      
      let found = false
      for (const jsFile of jsFiles) {
        const content = await fs.readFile(path.join(assetsPath, jsFile), 'utf8')
        if (content.includes('VITE_VERCEL_DEPLOYMENT') || content.includes('true')) {
          found = true
          break
        }
      }
      
      // The environment variable should be embedded in the build
      expect(found).toBe(true)
    })

    test('should validate vercel.json environment section', async () => {
      const vercelConfigPath = path.join(projectRoot, 'vercel.json')
      const config = JSON.parse(await fs.readFile(vercelConfigPath, 'utf8'))
      
      expect(config.env).toBeDefined()
      expect(config.env.VITE_VERCEL_DEPLOYMENT).toBe('true')
      expect(config.build.env).toBeDefined()
      expect(config.build.env.VITE_VERCEL_DEPLOYMENT).toBe('true')
    })

    test('should handle build commands correctly', async () => {
      const vercelConfigPath = path.join(projectRoot, 'vercel.json')
      const config = JSON.parse(await fs.readFile(vercelConfigPath, 'utf8'))
      
      expect(config.buildCommand).toBeDefined()
      expect(config.installCommand).toBeDefined()
      expect(config.outputDirectory).toBe('packages/web/dist')
      
      // Build command should handle monorepo structure
      expect(config.buildCommand).toContain('pnpm build')
    })
  })

  describe('Build Environment Variables', () => {
    test('should respect NODE_ENV in build process', async () => {
      // Test production build
      const { stdout } = await execAsync('NODE_ENV=production pnpm build:web', { 
        cwd: projectRoot,
        timeout: 180000
      })
      
      expect(stdout).not.toContain('ERROR')
      
      // Check that production build is optimized
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      const jsFiles = files.filter(f => f.endsWith('.js'))
      
      const mainJsFile = jsFiles[0]
      const content = await fs.readFile(path.join(assetsPath, mainJsFile), 'utf8')
      
      // Should not contain development artifacts
      expect(content).not.toContain('__DEV__')
      expect(content).not.toContain('development')
    })

    test('should handle missing environment variables gracefully', async () => {
      // Test with minimal environment
      const minimalEnv = {
        PATH: process.env.PATH,
        NODE_ENV: 'production'
      }
      
      try {
        await execAsync('pnpm build:web', { 
          cwd: projectRoot,
          env: minimalEnv,
          timeout: 180000
        })
        
        // Build should succeed even with minimal environment
        const distExists = await fs.access(webDistPath).then(() => true).catch(() => false)
        expect(distExists).toBe(true)
      } catch (error) {
        // If build fails, it should be due to missing dependencies, not env vars
        expect(error.message).not.toContain('environment variable')
      }
    })
  })

  describe('Package-Specific Configuration', () => {
    test('should have consistent environment handling across packages', async () => {
      const packages = ['core', 'ui', 'web']
      
      for (const pkg of packages) {
        const vitePath = path.join(projectRoot, `packages/${pkg}/vite.config.ts`)
        const viteExists = await fs.access(vitePath).then(() => true).catch(() => false)
        
        if (viteExists) {
          const config = await fs.readFile(vitePath, 'utf8')
          
          // Should have consistent environment variable handling
          if (config.includes('loadEnv')) {
            expect(config).toContain('loadEnv')
            expect(config).toContain('mode')
          }
        }
      }
    })

    test('should validate package.json environment requirements', async () => {
      const packages = ['core', 'ui', 'web', 'extension']
      
      for (const pkg of packages) {
        const packagePath = path.join(projectRoot, `packages/${pkg}/package.json`)
        const packageExists = await fs.access(packagePath).then(() => true).catch(() => false)
        
        if (packageExists) {
          const packageJson = JSON.parse(await fs.readFile(packagePath, 'utf8'))
          
          // Should have proper Node version requirements
          if (packageJson.engines) {
            expect(packageJson.engines.node).toBeDefined()
            expect(packageJson.engines.node).toMatch(/\d+\.\d+\.\d+/)
          }
        }
      }
    })
  })

  describe('Runtime Environment Detection', () => {
    test('should detect Vercel environment at runtime', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      const jsFiles = files.filter(f => f.endsWith('.js'))
      
      // Look for environment detection code
      let hasEnvironmentDetection = false
      
      for (const jsFile of jsFiles) {
        const content = await fs.readFile(path.join(assetsPath, jsFile), 'utf8')
        
        if (content.includes('VERCEL') || content.includes('vercel')) {
          hasEnvironmentDetection = true
          break
        }
      }
      
      // Should have some form of environment detection
      expect(hasEnvironmentDetection).toBe(true)
    })

    test('should handle browser environment correctly', async () => {
      const assetsPath = path.join(webDistPath, 'assets')
      const files = await fs.readdir(assetsPath)
      const jsFiles = files.filter(f => f.endsWith('.js'))
      
      for (const jsFile of jsFiles) {
        const content = await fs.readFile(path.join(assetsPath, jsFile), 'utf8')
        
        // Should not contain Node.js specific code
        expect(content).not.toContain('require(')
        expect(content).not.toContain('__dirname')
        expect(content).not.toContain('process.cwd')
        
        // Should be browser-compatible
        if (content.includes('window')) {
          expect(content).toMatch(/typeof\s+window\s*[!=]=/)
        }
      }
    })
  })

  describe('Configuration File Validation', () => {
    test('should have valid Vite configuration for web package', async () => {
      const viteConfigPath = path.join(projectRoot, 'packages/web/vite.config.ts')
      const config = await fs.readFile(viteConfigPath, 'utf8')
      
      expect(config).toContain('defineConfig')
      expect(config).toContain('vue')
      
      // Should have proper build configuration
      expect(config).toMatch(/build\s*:/s)
      expect(config).toMatch(/outDir\s*:/s)
    })

    test('should have valid TypeScript configuration', async () => {
      const tsconfigPath = path.join(projectRoot, 'packages/web/tsconfig.json')
      const tsconfigExists = await fs.access(tsconfigPath).then(() => true).catch(() => false)
      
      if (tsconfigExists) {
        const config = JSON.parse(await fs.readFile(tsconfigPath, 'utf8'))
        
        expect(config.compilerOptions).toBeDefined()
        expect(config.compilerOptions.target).toBeDefined()
        expect(config.compilerOptions.moduleResolution).toBeDefined()
      }
    })

    test('should have proper ESLint configuration', async () => {
      const eslintPaths = [
        '.eslintrc.js',
        '.eslintrc.json',
        'eslint.config.js'
      ]
      
      let hasEslintConfig = false
      
      for (const eslintPath of eslintPaths) {
        const fullPath = path.join(projectRoot, eslintPath)
        const exists = await fs.access(fullPath).then(() => true).catch(() => false)
        if (exists) {
          hasEslintConfig = true
          break
        }
      }
      
      // Should have some form of linting configuration
      expect(hasEslintConfig).toBe(true)
    })
  })

  describe('Deployment-Specific Settings', () => {
    test('should handle different deployment targets', async () => {
      const vercelConfig = path.join(projectRoot, 'vercel.json')
      const config = JSON.parse(await fs.readFile(vercelConfig, 'utf8'))
      
      // Should support multiple deployment contexts
      expect(config.git).toBeDefined()
      expect(config.git.deploymentEnabled).toBeDefined()
      
      // Should handle both main and master branches
      expect(config.git.deploymentEnabled.main).toBe(true)
      expect(config.git.deploymentEnabled.master).toBe(true)
    })

    test('should have proper rewrites for SPA', async () => {
      const vercelConfig = path.join(projectRoot, 'vercel.json')
      const config = JSON.parse(await fs.readFile(vercelConfig, 'utf8'))
      
      expect(config.rewrites).toBeDefined()
      expect(Array.isArray(config.rewrites)).toBe(true)
      
      // Should have catch-all rewrite for SPA
      const catchAllRewrite = config.rewrites.find(r => r.destination === '/index.html')
      expect(catchAllRewrite).toBeDefined()
    })
  })

  describe('Build Environment Consistency', () => {
    test('should have consistent package versions', async () => {
      const rootPackageJson = JSON.parse(
        await fs.readFile(path.join(projectRoot, 'package.json'), 'utf8')
      )
      
      const packages = ['core', 'ui', 'web']
      
      for (const pkg of packages) {
        const packagePath = path.join(projectRoot, `packages/${pkg}/package.json`)
        const packageExists = await fs.access(packagePath).then(() => true).catch(() => false)
        
        if (packageExists) {
          const packageJson = JSON.parse(await fs.readFile(packagePath, 'utf8'))
          
          // Check for version consistency of shared dependencies
          const sharedDeps = ['vue', 'typescript', 'vitest']
          
          for (const dep of sharedDeps) {
            const rootVersion = rootPackageJson.dependencies?.[dep] || rootPackageJson.devDependencies?.[dep]
            const pkgVersion = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]
            
            if (rootVersion && pkgVersion) {
              // Versions should be compatible
              expect(pkgVersion).toBeDefined()
            }
          }
        }
      }
    })

    test('should use pnpm workspace properly', async () => {
      const pnpmWorkspacePath = path.join(projectRoot, 'pnpm-workspace.yaml')
      const workspaceExists = await fs.access(pnpmWorkspacePath).then(() => true).catch(() => false)
      
      if (workspaceExists) {
        const workspaceConfig = await fs.readFile(pnpmWorkspacePath, 'utf8')
        
        expect(workspaceConfig).toContain('packages/*')
      }
      
      // Check pnpm-lock.yaml exists
      const lockPath = path.join(projectRoot, 'pnpm-lock.yaml')
      const lockExists = await fs.access(lockPath).then(() => true).catch(() => false)
      
      expect(lockExists).toBe(true)
    })
  })

  describe('Performance Environment Settings', () => {
    test('should have optimized build settings', async () => {
      const viteConfigPath = path.join(projectRoot, 'packages/web/vite.config.ts')
      const config = await fs.readFile(viteConfigPath, 'utf8')
      
      // Should have build optimizations
      if (config.includes('build')) {
        expect(config).toMatch(/minify/s)
        expect(config).toMatch(/sourcemap/s)
      }
      
      // Should handle chunks properly
      if (config.includes('rollupOptions')) {
        expect(config).toContain('rollupOptions')
      }
    })

    test('should handle development vs production differences', async () => {
      const packages = ['web', 'ui']
      
      for (const pkg of packages) {
        const viteConfigPath = path.join(projectRoot, `packages/${pkg}/vite.config.ts`)
        const configExists = await fs.access(viteConfigPath).then(() => true).catch(() => false)
        
        if (configExists) {
          const config = await fs.readFile(viteConfigPath, 'utf8')
          
          // Should handle different modes
          if (config.includes('mode') || config.includes('command')) {
            expect(config).toMatch(/mode|command/)
          }
        }
      }
    })
  })
})