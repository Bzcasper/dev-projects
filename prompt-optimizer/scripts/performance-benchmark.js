#!/usr/bin/env node

/**
 * Performance Benchmark Script for Vercel Deployment
 * Analyzes build performance, bundle sizes, and deployment metrics
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const WEB_DIST_DIR = path.join(ROOT_DIR, 'packages/web/dist');

async function main() {
  console.log('🚀 Starting performance benchmark for Vercel deployment...');
  
  try {
    const metrics = {
      buildTime: await measureBuildTime(),
      bundleAnalysis: await analyzeBundles(),
      assetAnalysis: await analyzeAssets(),
      dependencies: await analyzeDependencies(),
      recommendations: []
    };
    
    generateRecommendations(metrics);
    printReport(metrics);
    
  } catch (error) {
    console.error('❌ Performance benchmark failed:', error.message);
    process.exit(1);
  }
}

async function measureBuildTime() {
  console.log('⏱️  Measuring build performance...');
  
  const startTime = Date.now();
  
  try {
    // Clean previous build
    execSync('pnpm run clean:dist', { 
      cwd: ROOT_DIR,
      stdio: 'pipe'
    });
    
    // Measure build time
    execSync('pnpm run vercel:build', {
      cwd: ROOT_DIR,
      stdio: 'pipe'
    });
    
    const buildTime = Date.now() - startTime;
    
    return {
      duration: buildTime,
      durationFormatted: formatDuration(buildTime),
      success: true
    };
    
  } catch (error) {
    return {
      duration: Date.now() - startTime,
      durationFormatted: 'Failed',
      success: false,
      error: error.message
    };
  }
}

async function analyzeBundles() {
  console.log('📦 Analyzing bundle sizes...');
  
  const bundles = {
    total: 0,
    files: [],
    chunks: {
      vendor: 0,
      app: 0,
      css: 0,
      assets: 0
    }
  };
  
  try {
    await fs.access(WEB_DIST_DIR);
    
    const files = await findFiles(WEB_DIST_DIR, ['.js', '.css', '.html']);
    
    for (const filePath of files) {
      const stats = await fs.stat(filePath);
      const relativePath = path.relative(WEB_DIST_DIR, filePath);
      const ext = path.extname(filePath);
      
      const fileInfo = {
        path: relativePath,
        size: stats.size,
        sizeFormatted: formatBytes(stats.size),
        type: getFileType(relativePath, ext),
        gzipEstimate: Math.round(stats.size * 0.3) // Rough gzip estimate
      };
      
      bundles.files.push(fileInfo);
      bundles.total += stats.size;
      
      // Categorize chunks
      if (relativePath.includes('vendor') || relativePath.includes('node_modules')) {
        bundles.chunks.vendor += stats.size;
      } else if (ext === '.js') {
        bundles.chunks.app += stats.size;
      } else if (ext === '.css') {
        bundles.chunks.css += stats.size;
      } else {
        bundles.chunks.assets += stats.size;
      }
    }
    
    // Sort by size
    bundles.files.sort((a, b) => b.size - a.size);
    
  } catch (error) {
    console.warn('⚠️  Could not analyze bundles:', error.message);
  }
  
  return bundles;
}

async function analyzeAssets() {
  console.log('🖼️  Analyzing static assets...');
  
  const assets = {
    total: 0,
    count: 0,
    types: {},
    large: []
  };
  
  try {
    const assetFiles = await findFiles(WEB_DIST_DIR, [
      '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp',
      '.woff', '.woff2', '.ttf', '.otf',
      '.ico', '.json', '.xml'
    ]);
    
    for (const filePath of assetFiles) {
      const stats = await fs.stat(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const relativePath = path.relative(WEB_DIST_DIR, filePath);
      
      assets.total += stats.size;
      assets.count++;
      
      if (!assets.types[ext]) {
        assets.types[ext] = { count: 0, size: 0 };
      }
      assets.types[ext].count++;
      assets.types[ext].size += stats.size;
      
      // Track large assets (>100KB)
      if (stats.size > 100 * 1024) {
        assets.large.push({
          path: relativePath,
          size: stats.size,
          sizeFormatted: formatBytes(stats.size),
          type: ext
        });
      }
    }
    
    // Sort large assets by size
    assets.large.sort((a, b) => b.size - a.size);
    
  } catch (error) {
    console.warn('⚠️  Could not analyze assets:', error.message);
  }
  
  return assets;
}

async function analyzeDependencies() {
  console.log('📚 Analyzing dependencies...');
  
  const deps = {
    production: 0,
    development: 0,
    total: 0,
    heavy: [],
    unused: []
  };
  
  try {
    const packageJsonPath = path.join(ROOT_DIR, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    
    if (packageJson.dependencies) {
      deps.production = Object.keys(packageJson.dependencies).length;
    }
    
    if (packageJson.devDependencies) {
      deps.development = Object.keys(packageJson.devDependencies).length;
    }
    
    deps.total = deps.production + deps.development;
    
    // Analyze heavy dependencies (this is simplified - in production you'd use bundle analyzer)
    const heavyPackages = [
      'electron', 'chromadb', '@vue/runtime-core', '@vue/runtime-dom',
      'element-plus', 'lodash-es', '@vueuse/core'
    ];
    
    if (packageJson.dependencies) {
      for (const [pkg, version] of Object.entries(packageJson.dependencies)) {
        if (heavyPackages.includes(pkg)) {
          deps.heavy.push({ package: pkg, version });
        }
      }
    }
    
  } catch (error) {
    console.warn('⚠️  Could not analyze dependencies:', error.message);
  }
  
  return deps;
}

function generateRecommendations(metrics) {
  const recommendations = [];
  
  // Build time recommendations
  if (metrics.buildTime.duration > 5 * 60 * 1000) { // 5 minutes
    recommendations.push('🐌 Build time is over 5 minutes. Consider optimizing build process or using build caching.');
  }
  
  // Bundle size recommendations
  if (metrics.bundleAnalysis.total > 2 * 1024 * 1024) { // 2MB
    recommendations.push('📦 Bundle size is over 2MB. Consider code splitting and lazy loading.');
  }
  
  if (metrics.bundleAnalysis.chunks.vendor > 1 * 1024 * 1024) { // 1MB
    recommendations.push('📚 Vendor bundle is over 1MB. Consider splitting large dependencies.');
  }
  
  // Asset recommendations
  if (metrics.assetAnalysis.large.length > 0) {
    recommendations.push(`🖼️  Found ${metrics.assetAnalysis.large.length} large assets. Consider optimization or lazy loading.`);
  }
  
  // Dependency recommendations
  if (metrics.dependencies.production > 50) {
    recommendations.push('📦 Many production dependencies detected. Review if all are necessary for the web build.');
  }
  
  // Vercel-specific recommendations
  recommendations.push('⚡ Enable Vercel Speed Insights for real-world performance monitoring.');
  recommendations.push('🗜️  Consider enabling Vercel compression for static assets.');
  recommendations.push('🌐 Use Vercel Edge Network for global CDN distribution.');
  
  if (metrics.bundleAnalysis.files.some(f => f.path.includes('sourcemap'))) {
    recommendations.push('🗺️  Source maps detected in build. Consider excluding from production builds.');
  }
  
  metrics.recommendations = recommendations;
}

async function findFiles(dir, extensions) {
  const files = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip hidden directories
        if (!entry.name.startsWith('.')) {
          files.push(...await findFiles(fullPath, extensions));
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    // Ignore errors for directories we can't read
  }
  
  return files;
}

function getFileType(filePath, ext) {
  if (filePath.includes('vendor') || filePath.includes('node_modules')) {
    return 'vendor';
  }
  
  switch (ext) {
    case '.js': return 'javascript';
    case '.css': return 'stylesheet';
    case '.html': return 'markup';
    case '.json': return 'data';
    case '.svg': return 'vector';
    default: return 'asset';
  }
}

function printReport(metrics) {
  console.log('\n📊 Performance Benchmark Report');
  console.log('================================');
  
  // Build Performance
  console.log('\n🔨 Build Performance:');
  console.log(`   Duration: ${metrics.buildTime.durationFormatted}`);
  console.log(`   Status: ${metrics.buildTime.success ? '✅ Success' : '❌ Failed'}`);
  if (metrics.buildTime.error) {
    console.log(`   Error: ${metrics.buildTime.error}`);
  }
  
  // Bundle Analysis
  console.log('\n📦 Bundle Analysis:');
  console.log(`   Total Size: ${formatBytes(metrics.bundleAnalysis.total)}`);
  console.log(`   Files: ${metrics.bundleAnalysis.files.length}`);
  console.log(`   Vendor: ${formatBytes(metrics.bundleAnalysis.chunks.vendor)}`);
  console.log(`   App: ${formatBytes(metrics.bundleAnalysis.chunks.app)}`);
  console.log(`   CSS: ${formatBytes(metrics.bundleAnalysis.chunks.css)}`);
  
  if (metrics.bundleAnalysis.files.length > 0) {
    console.log('\n   Largest Files:');
    metrics.bundleAnalysis.files.slice(0, 5).forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.path} (${file.sizeFormatted})`);
    });
  }
  
  // Asset Analysis
  console.log('\n🖼️  Asset Analysis:');
  console.log(`   Total Size: ${formatBytes(metrics.assetAnalysis.total)}`);
  console.log(`   File Count: ${metrics.assetAnalysis.count}`);
  
  if (Object.keys(metrics.assetAnalysis.types).length > 0) {
    console.log('   By Type:');
    Object.entries(metrics.assetAnalysis.types)
      .sort(([,a], [,b]) => b.size - a.size)
      .slice(0, 5)
      .forEach(([ext, data]) => {
        console.log(`   ${ext}: ${data.count} files (${formatBytes(data.size)})`);
      });
  }
  
  if (metrics.assetAnalysis.large.length > 0) {
    console.log(`\n   ⚠️  Large Assets (${metrics.assetAnalysis.large.length}):`);
    metrics.assetAnalysis.large.slice(0, 3).forEach(asset => {
      console.log(`   • ${asset.path} (${asset.sizeFormatted})`);
    });
  }
  
  // Dependencies
  console.log('\n📚 Dependencies:');
  console.log(`   Production: ${metrics.dependencies.production}`);
  console.log(`   Development: ${metrics.dependencies.development}`);
  console.log(`   Total: ${metrics.dependencies.total}`);
  
  if (metrics.dependencies.heavy.length > 0) {
    console.log('   Heavy Packages:');
    metrics.dependencies.heavy.forEach(dep => {
      console.log(`   • ${dep.package}`);
    });
  }
  
  // Recommendations
  if (metrics.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    metrics.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
  }
  
  // Performance Score
  const score = calculatePerformanceScore(metrics);
  console.log('\n🎯 Performance Score:');
  console.log(`   ${getScoreEmoji(score)} ${score}/100`);
  console.log(`   ${getScoreDescription(score)}`);
  
  console.log('\n✅ Performance benchmark complete!');
}

function calculatePerformanceScore(metrics) {
  let score = 100;
  
  // Deduct points for large bundles
  if (metrics.bundleAnalysis.total > 1024 * 1024) { // 1MB
    score -= 20;
  }
  if (metrics.bundleAnalysis.total > 2 * 1024 * 1024) { // 2MB
    score -= 20;
  }
  
  // Deduct points for slow builds
  if (metrics.buildTime.duration > 2 * 60 * 1000) { // 2 minutes
    score -= 10;
  }
  if (metrics.buildTime.duration > 5 * 60 * 1000) { // 5 minutes
    score -= 20;
  }
  
  // Deduct points for large assets
  if (metrics.assetAnalysis.large.length > 5) {
    score -= 15;
  }
  
  // Deduct points for many dependencies
  if (metrics.dependencies.production > 30) {
    score -= 10;
  }
  
  // Deduct points for build failures
  if (!metrics.buildTime.success) {
    score -= 50;
  }
  
  return Math.max(0, score);
}

function getScoreEmoji(score) {
  if (score >= 90) return '🚀';
  if (score >= 70) return '✅';
  if (score >= 50) return '⚠️';
  return '❌';
}

function getScoreDescription(score) {
  if (score >= 90) return 'Excellent - Ready for production!';
  if (score >= 70) return 'Good - Minor optimizations recommended';
  if (score >= 50) return 'Fair - Several optimizations needed';
  return 'Poor - Major optimizations required';
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as performanceBenchmark };