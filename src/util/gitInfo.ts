import { execSync } from 'child_process';

export function getGitInfo() {
  try {
    return {
      branch: execSync('git rev-parse --abbrev-ref HEAD').toString().trim(),
      commit: execSync('git rev-parse --short HEAD').toString().trim(),
    };
  } catch (e) {
    return {
      branch: 'unknown',
      commit: 'unknown',
    };
  }
}
