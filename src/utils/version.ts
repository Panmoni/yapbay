import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';

interface VersionInfo {
  version: string;
  gitCommitHash: string;
  gitCommitDate: string;
  gitBranch: string;
  buildDate: string;
  isDirty: boolean;
}

let cachedVersionInfo: VersionInfo | null = null;

export function getVersionInfo(): VersionInfo {
  if (cachedVersionInfo) {
    return cachedVersionInfo;
  }

  try {
    // Get package.json version
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    const version = packageJson.version || 'unknown';

    // Get git information
    let gitCommitHash = 'unknown';
    let gitCommitDate = 'unknown';
    let gitBranch = 'unknown';
    let isDirty = false;

    try {
      // Get current commit hash (short)
      gitCommitHash = execSync('git rev-parse --short HEAD', { 
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'ignore']
      }).trim();

      // Get commit date
      gitCommitDate = execSync('git log -1 --format=%cI', {
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'ignore']
      }).trim();

      // Get current branch
      gitBranch = execSync('git rev-parse --abbrev-ref HEAD', {
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'ignore']
      }).trim();

      // Check if repository is dirty (has uncommitted changes)
      const gitStatus = execSync('git status --porcelain', {
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'ignore']
      }).trim();
      isDirty = gitStatus.length > 0;

    } catch (gitError) {
      // Git commands failed, probably not in a git repository
      console.warn('Could not retrieve git information:', (gitError as Error).message);
    }

    cachedVersionInfo = {
      version,
      gitCommitHash,
      gitCommitDate,
      gitBranch,
      buildDate: new Date().toISOString(),
      isDirty
    };

    return cachedVersionInfo;

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

export function getVersionString(): string {
  const info = getVersionInfo();
  const dirtyIndicator = info.isDirty ? '-dirty' : '';
  return `${info.version}+${info.gitCommitHash}${dirtyIndicator}`;
} 