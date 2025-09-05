#!/usr/bin/env node
/**
 * Repository Diagnostic Scanner
 * Scans codebase for TypeScript errors, mixed service code, and other issues
 *
 * @format
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

class RepositoryScanner {
  constructor(basePath = process.cwd()) {
    this.basePath = basePath;
    this.issues = [];
  }

  // Find TypeScript files
  findTsFiles() {
    const result = execSync(
      'find . -name "*.ts" -not -path "./node_modules/*" -not -path "./.git/*"',
      { cwd: this.basePath }
    )
      .toString()
      .trim();
    return result.split("\n").filter((f) => f.length > 0);
  }

  // Check TypeScript compilation errors
  checkTypeScriptErrors() {
    console.log("🔍 Checking TypeScript compilation errors...");
    try {
      const output = execSync("npx tsc --noEmit --skipLibCheck", {
        cwd: this.basePath,
      }).toString();
      return output;
    } catch (error) {
      return error.stdout ? error.stdout.toString() : "";
    }
  }

  // Scan for Qdrant references in ChromaDB files
  scanMixedServiceCode() {
    console.log(
      "🔍 Scanning for mixed service code (Qdrant in ChromaDB files)..."
    );
    const tsFiles = this.findTsFiles();
    const issues = [];

    tsFiles.forEach((file) => {
      const content = fs.readFileSync(file, "utf8");

      // Check for ChromaDB files with Qdrant references
      const isChromaFile =
        content.includes("chromadb") ||
        content.includes("ChromaClient") ||
        content.includes("CloudClient");
      const hasQdrantRefs =
        content.includes("qdrantClient") ||
        content.includes("QdrantClient") ||
        content.includes("qdrant-js") ||
        content.includes("collection_name:");

      if (isChromaFile && hasQdrantRefs) {
        issues.push({
          file,
          type: "MIXED_SERVICE_CODE",
          severity: "CRITICAL",
          description: `ChromaDB file contains Qdrant references - likely incomplete migration`,
        });
      }
    });

    return issues;
  }

  // Check for import issues
  scanImportIssues() {
    console.log("🔍 Scanning for import issues...");
    const tsFiles = this.findTsFiles();
    const issues = [];

    tsFiles.forEach((file) => {
      const content = fs.readFileSync(file, "utf8");

      // Check for CommonJS requires in TS files
      const requireMatches = content.match(/require\([^)]*\)/g) || [];
      if (requireMatches.length > 0 && !file.includes("test-")) {
        issues.push({
          file,
          type: "MIXED_MODULES",
          severity: "HIGH",
          description: `TypeScript file using CommonJS require() instead of ES6 imports: ${requireMatches.length} occurrences`,
        });
      }

      // Check for missing imports
      const errorRefs = content.match(/ReferenceError|Cannot resolve module/g);
      if (errorRefs) {
        issues.push({
          file,
          type: "MISSING_IMPORTS",
          severity: "HIGH",
          description: `File contains references to unresolved modules or missing imports`,
        });
      }
    });

    return issues;
  }

  // Check for incorrect URLs/endpoints
  scanEndpointIssues() {
    console.log("🔍 Scanning for incorrect endpoint configurations...");
    const tsFiles = this.findTsFiles();
    const issues = [];

    tsFiles.forEach((file) => {
      const content = fs.readFileSync(file, "utf8");

      // Check for Supabase URLs in ChromaDB files
      if (content.includes("chromadb") && content.includes("supabase.co")) {
        issues.push({
          file,
          type: "INCORRECT_ENDPOINT",
          severity: "CRITICAL",
          description:
            "ChromaDB configuration contains Supabase URLs - should use ChromaDB Cloud endpoints",
        });
      }

      // Check for old Qdrant URLs
      if (content.includes("qdrant") && content.includes("localhost:6333")) {
        issues.push({
          file,
          type: "OUTDATED_ENDPOINT",
          severity: "HIGH",
          description: "File contains outdated localhost Qdrant URLs",
        });
      }
    });

    return issues;
  }

  // Run all scans
  async runFullScan() {
    console.log("🚀 Starting comprehensive repository scan...\n");

    const allIssues = [
      ...this.scanMixedServiceCode(),
      ...this.scanImportIssues(),
      ...this.scanEndpointIssues(),
    ];

    // Add TypeScript compilation errors
    const tsErrors = this.checkTypeScriptErrors();
    if (tsErrors.trim().length > 0) {
      const errorCount = (tsErrors.match(/error TS\d+/g) || []).length;
      allIssues.push({
        file: "GLOBAL",
        type: "TYPESCRIPT_ERRORS",
        severity: "HIGH",
        description: `TypeScript compilation failed with ${errorCount} errors. Run 'npx tsc --noEmit' for details.`,
      });
    }

    return allIssues;
  }

  // Rank issues by criticality
  rankIssuesByPriority(issues) {
    const severityOrder = { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };

    return issues.sort((a, b) => {
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  // Export to CSV
  exportToCSV(issues, filename = "repository-issues.csv") {
    const headers = ["Priority", "Severity", "Type", "File", "Description"];
    const rows = [
      headers.join(","),
      ...issues.map((issue, index) =>
        [
          index + 1,
          issue.severity,
          issue.type,
          `"${issue.file}"`,
          `"${issue.description}"`,
        ].join(",")
      ),
    ];

    fs.writeFileSync(filename, rows.join("\n"));
    console.log(`📊 Issues exported to: ${filename}`);
  }
}

// Run the scan
async function main() {
  const scanner = new RepositoryScanner();

  try {
    const issues = await scanner.runFullScan();
    const rankedIssues = scanner.rankIssuesByPriority(issues);

    console.log(`\n📊 Found ${issues.length} potential issues`);
    console.log("=================================");

    // Summary by severity
    const severityCount = {};
    rankedIssues.forEach((issue) => {
      severityCount[issue.severity] = (severityCount[issue.severity] || 0) + 1;
    });

    Object.entries(severityCount).forEach(([severity, count]) => {
      console.log(`${severity}: ${count} issues`);
    });

    // Export to CSV
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    const csvFile = `repository-scan-${timestamp}.csv`;
    scanner.exportToCSV(rankedIssues, csvFile);

    console.log(`\n📋 Top 5 most critical issues:`);
    console.log("==================================");
    rankedIssues.slice(0, 5).forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.severity}] ${issue.type}`);
      console.log(`   File: ${issue.file}`);
      console.log(`   Description: ${issue.description}\n`);
    });
  } catch (error) {
    console.error("❌ Scan failed:", error.message);
  }
}

main().catch(console.error);
