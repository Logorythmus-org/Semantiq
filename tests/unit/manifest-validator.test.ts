import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { ExtractionManifest } from '../../packages/semantiq/src/manifest-validator.js';
import { ManifestValidatorEngine } from '../../packages/semantiq/src/manifest-validator.js';

describe('Extraction Manifest Finalization (Prompt 11.2)', () => {
  const validator = new ManifestValidatorEngine();
  const manifestPath = path.resolve(process.cwd(), 'products/semantiq/extraction-manifest.json');
  const manifest: ExtractionManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  it('validates canonical finalized extraction manifest cleanly', () => {
    const report = validator.validateManifest(manifest);
    expect(report.isValid).toBe(true);
    expect(report.errors).toHaveLength(0);
  });

  it('detects path traversal attempt error', () => {
    const badManifest: ExtractionManifest = {
      ...manifest,
      includedPaths: [...manifest.includedPaths, '../secret_folder']
    };
    const report = validator.validateManifest(badManifest);
    expect(report.isValid).toBe(false);
    expect(report.errors).toContain('path_traversal_attempt');
  });

  it('detects parent .git inclusion error', () => {
    const badManifest: ExtractionManifest = {
      ...manifest,
      includedPaths: [...manifest.includedPaths, '.git/config']
    };
    const report = validator.validateManifest(badManifest);
    expect(report.isValid).toBe(false);
    expect(report.errors).toContain('parent_git_included');
  });

  it('detects secret file inclusion error', () => {
    const badManifest: ExtractionManifest = {
      ...manifest,
      includedPaths: [...manifest.includedPaths, 'config/.env.local']
    };
    const report = validator.validateManifest(badManifest);
    expect(report.isValid).toBe(false);
    expect(report.errors).toContain('secret_file_included');
  });
});
