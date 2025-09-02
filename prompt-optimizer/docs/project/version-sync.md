# Version Synchronization Mechanism

## Overview

To ensure that the version numbers of all components in the project remain consistent, we have established an automatic version synchronization mechanism. This mechanism automatically synchronizes the version number from the root `package.json` to other files that require a version number.

## Automatically Synchronized Files

Currently, the files with automatically synchronized version numbers include:

-   `packages/extension/public/manifest.json` - Browser extension manifest file

## Usage

### Method 1: Use the pnpm version command (Recommended)

Use the standard pnpm version management command, and the version number will be synchronized automatically:

```bash
# Upgrade patch version (1.0.7 -> 1.0.8)
pnpm version patch

# Upgrade minor version (1.0.7 -> 1.1.0)
pnpm version minor

# Upgrade major version (1.0.7 -> 2.0.0)
pnpm version major
```

### Method 2: Manual Synchronization

If you have directly modified the version number in `package.json`, you can run the synchronization command manually:

```bash
pnpm run version:sync
```

## How It Works

1.  **`pnpm version` command**: Updates the version number in `package.json`.
2.  **`version` hook**: Runs the synchronization script and stages the changes before creating a commit.
    -   Executes `pnpm run version:sync` to synchronize the version numbers in other files.
    -   Executes `git add -A` to add all changes to the staging area.
3.  **Synchronization script**: `scripts/sync-versions.js` reads the new version number and updates other files.
4.  **`git commit`**: pnpm creates a commit and a tag that include all version number changes.

## Adding New Files for Synchronization

To add more files for version synchronization, edit the `versionFiles` array in the `scripts/sync-versions.js` file:

```javascript
const versionFiles = [
  {
    path: 'packages/extension/public/manifest.json',
    field: 'version',
    description: 'Browser extension manifest file'
  },
  {
    path: 'path/to/your/file.json',
    field: 'version',
    description: 'Your file description'
  }
];
```

## Notes

-   Ensure the target file is in a valid JSON format.
-   The version field must exist in the target file.
-   The script will exit and display an error message if an error occurs.
-   All version number changes will be logged to the console.

## Troubleshooting

If synchronization fails, please check:

1.  Whether the target file exists and is in the correct format.
2.  Whether the version field exists in the target file.
3.  If there are any file permission issues.
4.  If the Node.js version is compatible.

If you encounter problems, you can run the synchronization script directly for debugging:

```bash
node scripts/sync-versions.js
```
