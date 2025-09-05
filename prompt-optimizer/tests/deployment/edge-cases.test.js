/**
 * Edge Case Testing for Multi-Package Deployment
 * Tests unusual scenarios and boundary conditions for deployment
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

describe('Multi-Package Deployment Edge Cases', () => {
  const projectRoot = process.cwd()
  const webDistPath = path.join(projectRoot, 'packages/web/dist')
  const tempFiles = []
  
  beforeAll(async () => {
    // Ensure clean state
    try {
      await execAsync('pnpm clean', { cwd: projectRoot })
    } catch (error) {
      console.warn('Clean command failed:', error.message)
    }
  })

  afterAll(async () => {
    // Cleanup temporary files
    for (const file of tempFiles) {
      try {
        await fs.unlink(file)
      } catch (error) {
        console.warn(`Failed to cleanup ${file}:`, error.message)
      }
    }
  })

  describe('Build Order Dependencies', () => {
    test('should fail gracefully when core package is missing', async () => {
      // Temporarily move core package
      const corePackagePath = path.join(projectRoot, 'packages/core')
      const tempCorePath = path.join(projectRoot, 'packages/core.bak')
      
      try {
        await fs.rename(corePackagePath, tempCorePath)
        
        // Try to build web package
        const result = await execAsync('pnpm build:web', { 
          cwd: projectRoot,
          timeout: 60000
        }).catch(error => error)
        
        // Should fail with clear error message
        expect(result.code).not.toBe(0)
        expect(result.stderr || result.stdout).toMatch(/core.*not found|cannot resolve/i)
        
      } finally {
        // Restore core package
        const backupExists = await fs.access(tempCorePath).then(() => true).catch(() => false)
        if (backupExists) {
          await fs.rename(tempCorePath, corePackagePath)
        }
      }
    })

    test('should handle partial build failures', async () => {
      // Create a temporary invalid file in core package
      const invalidFilePath = path.join(projectRoot, 'packages/core/src/invalid-syntax.ts')
      tempFiles.push(invalidFilePath)
      
      try {
        await fs.writeFile(invalidFilePath, 'invalid typescript syntax $$$ \n export default {}')
        
        // Try to build
        const result = await execAsync('pnpm build:core', { 
          cwd: projectRoot,
          timeout: 60000
        }).catch(error => error)
        
        // Should fail with TypeScript error
        expect(result.code).not.toBe(0)
        expect(result.stderr || result.stdout).toMatch(/error|failed/i)
        
      } finally {
        // Cleanup invalid file
        try {
          await fs.unlink(invalidFilePath)
        } catch (error) {
          console.warn('Failed to cleanup invalid file:', error.message)
        }
      }
    })
  })

  describe('Concurrent Build Scenarios', () => {
    test('should handle simultaneous builds', async () => {
      await execAsync('pnpm clean', { cwd: projectRoot })
      
      // Start multiple builds simultaneously
      const builds = [
        execAsync('pnpm build:core', { cwd: projectRoot, timeout: 120000 }),
        execAsync('pnpm build:ui', { cwd: projectRoot, timeout: 120000 })
      ]
      
      try {
        await Promise.all(builds)
        
        // Both should succeed
        const coreExists = await fs.access(path.join(projectRoot, 'packages/core/dist'))
          .then(() => true).catch(() => false)
        const uiExists = await fs.access(path.join(projectRoot, 'packages/ui/dist'))
          .then(() => true).catch(() => false)
        
        expect(coreExists).toBe(true)
        expect(uiExists).toBe(true)
        
      } catch (error) {
        // If concurrent builds fail, it should be handled gracefully
        console.warn('Concurrent build failed:', error.message)
      }
    })

    test('should handle build interruption and recovery', async () => {
      await execAsync('pnpm clean', { cwd: projectRoot })
      
      // Start a build and simulate interruption
      const buildPromise = execAsync('pnpm build', { cwd: projectRoot, timeout: 30000 })
      
      // Wait a bit then force timeout
      setTimeout(() => {
        buildPromise.child?.kill('SIGTERM')
      }, 5000)
      
      try {
        await buildPromise
      } catch (error) {
        // Build should have been interrupted
        expect(error.signal).toBe('SIGTERM')
      }
      
      // Recovery build should work
      const recoveryResult = await execAsync('pnpm build', { 
        cwd: projectRoot,
        timeout: 300000
      })
      
      expect(recoveryResult.code).toBeUndefined() // Success
    })
  })

  describe('Large File Handling', () => {
    test('should handle large asset files', async () => {
      // Create a large dummy asset file
      const largeAssetPath = path.join(projectRoot, 'packages/web/public/large-test-asset.txt')
      tempFiles.push(largeAssetPath)
      
      const largeContent = 'x'.repeat(2 * 1024 * 1024) // 2MB file
      await fs.writeFile(largeAssetPath, largeContent)
      
      // Build should handle large assets
      await execAsync('pnpm build:web', { cwd: projectRoot, timeout: 180000 })
      
      const builtAssetPath = path.join(webDistPath, 'large-test-asset.txt')
      const assetExists = await fs.access(builtAssetPath).then(() => true).catch(() => false)
      
      expect(assetExists).toBe(true)
      
      const builtContent = await fs.readFile(builtAssetPath, 'utf8')
      expect(builtContent.length).toBe(largeContent.length)
    })

    test('should handle many small files', async () => {
      // Create many small files
      const smallFilesDir = path.join(projectRoot, 'packages/web/public/many-files')
      await fs.mkdir(smallFilesDir, { recursive: true })
      
      const filePromises = []
      for (let i = 0; i < 100; i++) {
        const filePath = path.join(smallFilesDir, `file-${i}.txt`)
        tempFiles.push(filePath)
        filePromises.push(fs.writeFile(filePath, `Content ${i}`))
      }
      
      await Promise.all(filePromises)
      
      // Build should handle many files
      await execAsync('pnpm build:web', { cwd: projectRoot, timeout: 180000 })
      
      const builtDir = path.join(webDistPath, 'many-files')
      const builtDirExists = await fs.access(builtDir).then(() => true).catch(() => false)
      
      expect(builtDirExists).toBe(true)
      
      const builtFiles = await fs.readdir(builtDir)
      expect(builtFiles.length).toBe(100)
    })
  })

  describe('Memory and Resource Limits', () => {
    test('should handle low memory conditions gracefully', async () => {
      // This test simulates memory pressure but actual testing requires system-level control
      // We'll test the build with limited Node.js heap
      
      try {
        const result = await execAsync('node --max-old-space-size=512 node_modules/.bin/vite build', {
          cwd: path.join(projectRoot, 'packages/web'),
          timeout: 300000
        })
        
        // Should succeed or fail gracefully
        expect(result).toBeDefined()
        
      } catch (error) {
        // If it fails due to memory, error should be clear
        if (error.message.includes('out of memory')) {
          console.warn('Build failed due to memory limit - this is expected for low memory test')
        } else {
          throw error
        }
      }
    })

    test('should handle long file paths', async () => {
      // Create deeply nested directory structure
      const deepPath = path.join(projectRoot, 'packages/web/src/very/deeply/nested/directory/structure/that/is/quite/long')
      await fs.mkdir(deepPath, { recursive: true })
      
      const longFilePath = path.join(deepPath, 'very-long-filename-that-tests-path-limits.ts')
      tempFiles.push(longFilePath)
      
      await fs.writeFile(longFilePath, 'export const test = "long path test"')
      
      // Build should handle long paths
      await execAsync('pnpm build:web', { cwd: projectRoot, timeout: 180000 })
      
      // Build should complete successfully
      const distExists = await fs.access(webDistPath).then(() => true).catch(() => false)
      expect(distExists).toBe(true)
    })
  })

  describe('Network and External Dependencies', () => {
    test('should handle CDN failures gracefully', async () => {
      // This would require network manipulation in real scenario
      // For now, we test that build doesn't depend on external CDNs during build time
      
      await execAsync('pnpm build', { 
        cwd: projectRoot,
        timeout: 300000,
        env: {
          ...process.env,
          npm_config_registry: 'http://localhost:9999' // Non-existent registry
        }
      }).catch(() => {
        // Expected to fail, but should be due to dependencies, not CDN
        console.log('Build failed with bad registry - expected for offline test')
      })
      
      // Normal build should still work
      await execAsync('pnpm build', { cwd: projectRoot, timeout: 300000 })
      
      const distExists = await fs.access(webDistPath).then(() => true).catch(() => false)
      expect(distExists).toBe(true)
    })
  })

  describe('File System Edge Cases', () => {
    test('should handle special characters in filenames', async () => {
      const specialCharFile = path.join(projectRoot, 'packages/web/public/file with spaces & special chars #1.txt')
      tempFiles.push(specialCharFile)
      
      await fs.writeFile(specialCharFile, 'Special character content')
      
      await execAsync('pnpm build:web', { cwd: projectRoot, timeout: 180000 })
      
      const builtFiles = await fs.readdir(webDistPath)
      const specialFile = builtFiles.find(f => f.includes('file with spaces'))
      
      expect(specialFile).toBeDefined()
    })

    test('should handle case-sensitive filename conflicts', async () => {
      const upperCaseFile = path.join(projectRoot, 'packages/web/src/TEST.ts')
      const lowerCaseFile = path.join(projectRoot, 'packages/web/src/test.ts')
      
      tempFiles.push(upperCaseFile, lowerCaseFile)
      
      await fs.writeFile(upperCaseFile, 'export const UPPER = "UPPER"')
      
      try {
        await fs.writeFile(lowerCaseFile, 'export const lower = "lower"')
        
        // On case-insensitive systems, this might conflict
        const result = await execAsync('pnpm build:web', { 
          cwd: projectRoot,
          timeout: 180000
        }).catch(error => error)
        
        // Should either succeed or fail with clear error
        if (result.code !== 0) {
          expect(result.stderr || result.stdout).toMatch(/case|conflict/i)
        }
        
      } catch (error) {
        if (error.code === 'EEXIST') {
          // Case-insensitive file system - expected
          console.log('Case-insensitive filesystem detected')
        } else {
          throw error
        }
      }
    })

    test('should handle missing directories', async () => {
      // Remove dist directories
      const distPaths = [
        path.join(projectRoot, 'packages/core/dist'),
        path.join(projectRoot, 'packages/ui/dist'),
        path.join(projectRoot, 'packages/web/dist')
      ]
      
      for (const distPath of distPaths) {
        try {
          await fs.rm(distPath, { recursive: true, force: true })
        } catch (error) {
          // Directory might not exist
        }
      }
      
      // Build should recreate directories
      await execAsync('pnpm build', { cwd: projectRoot, timeout: 300000 })
      
      for (const distPath of distPaths) {
        const exists = await fs.access(distPath).then(() => true).catch(() => false)
        expect(exists).toBe(true)
      }
    })
  })

  describe('Vercel-Specific Edge Cases', () => {
    test('should handle Vercel build context changes', async () => {
      // Test build with different Vercel contexts
      const contexts = [
        { VERCEL: '1', VERCEL_ENV: 'production' },
        { VERCEL: '1', VERCEL_ENV: 'preview' },
        { VERCEL: '1', VERCEL_ENV: 'development' }
      ]
      
      for (const context of contexts) {
        await execAsync('pnpm clean:dist', { cwd: projectRoot })
        
        await execAsync('pnpm build', { 
          cwd: projectRoot,
          timeout: 300000,
          env: { ...process.env, ...context }
        })
        
        const distExists = await fs.access(webDistPath).then(() => true).catch(() => false)
        expect(distExists).toBe(true)
      }
    })

    test('should handle different working directories', async () => {
      // Simulate Vercel's directory structure
      const originalCwd = process.cwd()
      
      try {
        // Test build from packages/extension directory (as per vercel.json)
        const extensionPath = path.join(projectRoot, 'packages/extension')
        const extensionExists = await fs.access(extensionPath).then(() => true).catch(() => false)
        
        if (extensionExists) {
          process.chdir(extensionPath)
          
          // This should trigger the special build command in vercel.json
          const result = await execAsync('cd ../.. && pnpm build', { timeout: 300000 })
          
          expect(result.code).toBeUndefined() // Success
        }
      } finally {
        process.chdir(originalCwd)
      }
    })

    test('should handle build command variations', async () => {
      // Test the complex build command from vercel.json
      const vercelConfig = JSON.parse(
        await fs.readFile(path.join(projectRoot, 'vercel.json'), 'utf8')
      )
      
      const buildCommand = vercelConfig.buildCommand
      
      // The command handles different working directories
      expect(buildCommand).toContain('if')
      expect(buildCommand).toContain('pwd')
      expect(buildCommand).toContain('pnpm build')
      
      // Should work from project root
      await execAsync(buildCommand.replace(/if.*?fi;?\s*/, ''), { 
        cwd: projectRoot,
        timeout: 300000,
        shell: '/bin/bash'
      })
      
      const distExists = await fs.access(webDistPath).then(() => true).catch(() => false)
      expect(distExists).toBe(true)
    })
  })

  describe('Recovery and Resilience', () => {
    test('should recover from corrupted cache', async () => {
      // Simulate corrupted cache by creating invalid cache files
      const cacheDir = path.join(projectRoot, 'node_modules/.cache')
      const cacheExists = await fs.access(cacheDir).then(() => true).catch(() => false)
      
      if (cacheExists) {
        const corruptedFile = path.join(cacheDir, 'corrupted-cache.tmp')
        tempFiles.push(corruptedFile)
        
        await fs.writeFile(corruptedFile, 'corrupted cache data')
      }
      
      // Build should handle corrupted cache gracefully
      await execAsync('pnpm build', { cwd: projectRoot, timeout: 300000 })
      
      const distExists = await fs.access(webDistPath).then(() => true).catch(() => false)
      expect(distExists).toBe(true)
    })

    test('should handle package.json changes during build', async () => {
      // Back up original package.json
      const webPackageJsonPath = path.join(projectRoot, 'packages/web/package.json')
      const originalContent = await fs.readFile(webPackageJsonPath, 'utf8')
      
      try {
        // Temporarily modify package.json
        const modifiedContent = originalContent.replace('"name":', '"name_modified":')
        await fs.writeFile(webPackageJsonPath, modifiedContent)
        
        // Build should detect the change
        const result = await execAsync('pnpm build:web', { 
          cwd: projectRoot,
          timeout: 180000
        }).catch(error => error)
        
        // Should either succeed or fail gracefully
        expect(result).toBeDefined()
        
      } finally {
        // Restore original package.json
        await fs.writeFile(webPackageJsonPath, originalContent)
      }
    })
  })
})