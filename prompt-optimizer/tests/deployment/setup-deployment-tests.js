/**
 * Setup file for deployment tests
 * Configures test environment and utilities for deployment testing
 */

import fs from 'fs/promises'
import path from 'path'
import { beforeAll, afterAll } from 'vitest'

// Global test configuration
globalThis.DEPLOYMENT_TEST_CONFIG = {
  projectRoot: process.cwd(),
  timeout: {
    build: 600000, // 10 minutes for builds
    install: 300000, // 5 minutes for installations
    cleanup: 60000 // 1 minute for cleanup
  },
  paths: {
    webDist: path.join(process.cwd(), 'packages/web/dist'),
    coreDist: path.join(process.cwd(), 'packages/core/dist'),
    uiDist: path.join(process.cwd(), 'packages/ui/dist'),
    vercelConfig: path.join(process.cwd(), 'vercel.json'),
    testResults: path.join(process.cwd(), 'tests/deployment/results')
  }
}

// Global utilities for deployment tests
globalThis.DeploymentTestUtils = {
  /**
   * Check if a path exists
   */
  async pathExists(filePath) {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  },

  /**
   * Get file size in bytes
   */
  async getFileSize(filePath) {
    try {
      const stats = await fs.stat(filePath)
      return stats.size
    } catch {
      return 0
    }
  },

  /**
   * Create directory if it doesn't exist
   */
  async ensureDir(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true })
      return true
    } catch {
      return false
    }
  },

  /**
   * Read JSON file safely
   */
  async readJSON(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8')
      return JSON.parse(content)
    } catch {
      return null
    }
  },

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },

  /**
   * Create test report
   */
  async createTestReport(testName, results) {
    const reportPath = path.join(globalThis.DEPLOYMENT_TEST_CONFIG.paths.testResults, `${testName}-report.json`)
    await this.ensureDir(path.dirname(reportPath))
    
    const report = {
      testName,
      timestamp: new Date().toISOString(),
      results,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cwd: process.cwd()
      }
    }
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
    return reportPath
  },

  /**
   * Validate build output structure
   */
  async validateBuildStructure(distPath) {
    const structure = {
      exists: await this.pathExists(distPath),
      indexHtml: await this.pathExists(path.join(distPath, 'index.html')),
      assetsDir: await this.pathExists(path.join(distPath, 'assets')),
      favicon: await this.pathExists(path.join(distPath, 'favicon.ico'))
    }
    
    if (structure.assetsDir) {
      const assetsPath = path.join(distPath, 'assets')
      try {
        const files = await fs.readdir(assetsPath)
        structure.assetFiles = {
          total: files.length,
          js: files.filter(f => f.endsWith('.js')).length,
          css: files.filter(f => f.endsWith('.css')).length,
          other: files.filter(f => !f.endsWith('.js') && !f.endsWith('.css')).length
        }
      } catch {
        structure.assetFiles = null
      }
    }
    
    return structure
  },

  /**
   * Check system requirements
   */
  async checkSystemRequirements() {
    const requirements = {
      node: {
        version: process.version,
        major: parseInt(process.version.slice(1).split('.')[0]),
        required: 18,
        satisfied: parseInt(process.version.slice(1).split('.')[0]) >= 18
      },
      memory: {
        total: process.memoryUsage().heapTotal,
        used: process.memoryUsage().heapUsed,
        available: process.memoryUsage().heapTotal - process.memoryUsage().heapUsed
      },
      disk: {
        // Basic check - would need more sophisticated implementation for real disk space
        cwd: process.cwd()
      }
    }
    
    return requirements
  }
}

// Global test hooks
beforeAll(async () => {
  console.log('🚀 Setting up deployment tests...')
  
  // Ensure test results directory exists
  await globalThis.DeploymentTestUtils.ensureDir(globalThis.DEPLOYMENT_TEST_CONFIG.paths.testResults)
  
  // Check system requirements
  const requirements = await globalThis.DeploymentTestUtils.checkSystemRequirements()
  console.log(`📋 Node.js version: ${requirements.node.version}`)
  console.log(`💾 Memory usage: ${globalThis.DeploymentTestUtils.formatBytes(requirements.memory.used)} / ${globalThis.DeploymentTestUtils.formatBytes(requirements.memory.total)}`)
  
  if (!requirements.node.satisfied) {
    console.warn(`⚠️  Node.js version ${requirements.node.version} may not be supported. Minimum required: ${requirements.node.required}`)
  }
  
  // Validate project structure
  const projectStructure = {
    packageJson: await globalThis.DeploymentTestUtils.pathExists(path.join(globalThis.DEPLOYMENT_TEST_CONFIG.projectRoot, 'package.json')),
    vercelJson: await globalThis.DeploymentTestUtils.pathExists(globalThis.DEPLOYMENT_TEST_CONFIG.paths.vercelConfig),
    webPackage: await globalThis.DeploymentTestUtils.pathExists(path.join(globalThis.DEPLOYMENT_TEST_CONFIG.projectRoot, 'packages/web')),
    corePackage: await globalThis.DeploymentTestUtils.pathExists(path.join(globalThis.DEPLOYMENT_TEST_CONFIG.projectRoot, 'packages/core')),
    uiPackage: await globalThis.DeploymentTestUtils.pathExists(path.join(globalThis.DEPLOYMENT_TEST_CONFIG.projectRoot, 'packages/ui'))
  }
  
  const missingComponents = Object.entries(projectStructure)
    .filter(([, exists]) => !exists)
    .map(([name]) => name)
  
  if (missingComponents.length > 0) {
    console.warn('⚠️  Missing project components:', missingComponents.join(', '))
  } else {
    console.log('✅ Project structure validated')
  }
  
  // Store initial state
  globalThis.DEPLOYMENT_TEST_STATE = {
    startTime: Date.now(),
    initialStructure: projectStructure,
    testResults: []
  }
}, 30000) // 30 second timeout for setup

afterAll(async () => {
  console.log('🧹 Cleaning up deployment tests...')
  
  // Generate final test report
  const finalReport = {
    duration: Date.now() - globalThis.DEPLOYMENT_TEST_STATE.startTime,
    testResults: globalThis.DEPLOYMENT_TEST_STATE.testResults,
    finalState: {
      webDist: await globalThis.DeploymentTestUtils.validateBuildStructure(globalThis.DEPLOYMENT_TEST_CONFIG.paths.webDist),
      coreDist: await globalThis.DeploymentTestUtils.pathExists(globalThis.DEPLOYMENT_TEST_CONFIG.paths.coreDist),
      uiDist: await globalThis.DeploymentTestUtils.pathExists(globalThis.DEPLOYMENT_TEST_CONFIG.paths.uiDist)
    },
    systemState: await globalThis.DeploymentTestUtils.checkSystemRequirements()
  }
  
  await globalThis.DeploymentTestUtils.createTestReport('deployment-final-report', finalReport)
  
  console.log(`📊 Test duration: ${Math.round(finalReport.duration / 1000)}s`)
  console.log(`📁 Results saved to: ${globalThis.DEPLOYMENT_TEST_CONFIG.paths.testResults}`)
  
  // Cleanup any temporary files if needed
  // (Individual tests should handle their own cleanup, this is just a safety net)
}, 30000) // 30 second timeout for cleanup

// Add custom matchers for deployment testing
expect.extend({
  toHaveValidBuildStructure(received) {
    const pass = received.exists && 
                 received.indexHtml && 
                 received.assetsDir && 
                 received.assetFiles && 
                 received.assetFiles.js > 0
    
    if (pass) {
      return {
        message: () => `Expected build structure to be invalid, but it was valid`,
        pass: true
      }
    } else {
      const missing = []
      if (!received.exists) missing.push('dist directory')
      if (!received.indexHtml) missing.push('index.html')
      if (!received.assetsDir) missing.push('assets directory')
      if (!received.assetFiles || received.assetFiles.js === 0) missing.push('JavaScript files')
      
      return {
        message: () => `Expected build structure to be valid, but missing: ${missing.join(', ')}`,
        pass: false
      }
    }
  },

  toHaveReasonableSize(received, maxSize) {
    const pass = received <= maxSize
    
    if (pass) {
      return {
        message: () => `Expected size ${globalThis.DeploymentTestUtils.formatBytes(received)} to be larger than ${globalThis.DeploymentTestUtils.formatBytes(maxSize)}`,
        pass: true
      }
    } else {
      return {
        message: () => `Expected size ${globalThis.DeploymentTestUtils.formatBytes(received)} to be less than or equal to ${globalThis.DeploymentTestUtils.formatBytes(maxSize)}`,
        pass: false
      }
    }
  }
})

// Environment configuration logging
console.log('🔧 Deployment test environment configured')
console.log(`📁 Project root: ${globalThis.DEPLOYMENT_TEST_CONFIG.projectRoot}`)
console.log(`⏱️  Build timeout: ${globalThis.DEPLOYMENT_TEST_CONFIG.timeout.build}ms`)
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)