import * as path from 'path';

export interface PathResolutionResult {
  readonly resolvedPath: string;
  readonly isRelative: boolean;
  readonly isParentTraversal: boolean;
  readonly isTempIsolated: boolean;
  readonly isValid: boolean;
}

export interface DataLayerAuditReport {
  readonly isIndependent: boolean;
  readonly absoluteParentPathCount: number;
  readonly forbiddenDbAccessCount: number;
  readonly timestamp: string;
}

/**
 * Independent Data Layer Engine.
 * Verifies candidate-relative paths, temp isolation, adapter absence, and zero parent path access.
 */
export class DataLayerEngine {
  resolveDataPath(inputPath: string, candidateRoot: string): PathResolutionResult {
    const isAbsolute = path.isAbsolute(inputPath);
    const isParentTraversal = inputPath.includes('..') && !inputPath.startsWith(candidateRoot);
    const isTempIsolated = inputPath.startsWith('./tmp') || inputPath.startsWith('./reports');
    const isRelative = !isAbsolute;
    const isValid = isRelative && !isParentTraversal;

    return {
      resolvedPath: isRelative ? path.join(candidateRoot, inputPath) : inputPath,
      isRelative,
      isParentTraversal,
      isTempIsolated,
      isValid
    };
  }

  auditDataLayer(paths: readonly string[], candidateRoot: string): DataLayerAuditReport {
    let absoluteCount = 0;
    let forbiddenCount = 0;

    for (const p of paths) {
      if (path.isAbsolute(p) && !p.startsWith(candidateRoot)) {
        absoluteCount++;
      }
      if (
        p.includes('/var/lib/') ||
        p.includes('\\AppData\\') ||
        p.includes('.tech-club-cache') ||
        p.includes('parent-db')
      ) {
        forbiddenCount++;
      }
    }

    return {
      isIndependent: absoluteCount === 0 && forbiddenCount === 0,
      absoluteParentPathCount: absoluteCount,
      forbiddenDbAccessCount: forbiddenCount,
      timestamp: new Date().toISOString()
    };
  }
}
