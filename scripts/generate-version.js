import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

function getVersionInfo() {
  try {
    // Get package.json version
    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    const version = packageJson.version || 'unknown';

    // Get git information
    let gitCommitHash = 'unknown';
    let gitCommitDate = 'unknown';
    let gitBranch = 'unknown';
    let isDirty = false;

    try {
      // Get current commit hash (short)
      gitCommitHash = execSync('git rev-parse --short HEAD').toString().trim();

      // Get commit date
      gitCommitDate = execSync('git log -1 --format=%cI').toString().trim();

      // Get current branch
      gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();

      // Check if repository is dirty (has uncommitted changes)
      const gitStatus = execSync('git status --porcelain').toString().trim();
      isDirty = gitStatus.length > 0;

    } catch (gitError) {
      console.warn('Could not retrieve git information:', gitError.message);
    }

    return {
      version,
      gitCommitHash,
      gitCommitDate,
      gitBranch,
      buildDate: new Date().toISOString(),
      isDirty
    };

  } catch (error) {
    console.error('Error getting version info:', error);
    
    // Return fallback version info
    return {
      version: 'unknown',
      gitCommitHash: 'unknown',
      gitCommitDate: 'unknown',
      gitBranch: 'unknown',
      buildDate: new Date().toISOString(),
      isDirty: false
    };
  }
}

// Generate version info
const versionInfo = getVersionInfo();

// Create the version.ts file
const versionFileContent = `// This file is auto-generated. Do not edit manually.
export const versionInfo = ${JSON.stringify(versionInfo, null, 2)};
`;

// Write to src/utils/version.ts
writeFileSync(
  join(process.cwd(), 'src', 'utils', 'version.ts'),
  versionFileContent
);

console.log('Version info generated successfully'); 