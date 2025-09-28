import path from 'node:path';
import { createHash } from 'node:crypto';

import axios from 'axios';
import fs from 'fs-extra';

import type { AssetDiff, AssetDiffResult } from './types.js';

export interface ApplyAssetDiffOptions {
  rootDir: string;
  assetsDir?: string;
  dryRun?: boolean;
  fetcher?: (url: string) => Promise<Buffer>;
}

const defaultFetcher = async (url: string): Promise<Buffer> => {
  const response = await axios.get<ArrayBuffer>(url, {
    responseType: 'arraybuffer'
  });

  return Buffer.from(response.data);
};

export async function applyAssetDiffs(
  diffs: AssetDiff[],
  options: ApplyAssetDiffOptions
): Promise<AssetDiffResult[]> {
  const { rootDir, assetsDir, dryRun = false, fetcher = defaultFetcher } = options;
  const baseDir = assetsDir ? path.resolve(rootDir, assetsDir) : rootDir;
  const results: AssetDiffResult[] = [];

  for (const diff of diffs) {
    const relativePath = diff.assetPath;
    if (!relativePath) {
      results.push({
        ...diff,
        outputPath: '',
        status: 'skipped',
        reason: 'Asset path was not provided in diff payload.'
      });
      continue;
    }

    const outputPath = path.resolve(baseDir, relativePath);
    const outputRelative = path.relative(rootDir, outputPath);

    if (!diff.downloadUrl && !diff.base64Data) {
      results.push({
        ...diff,
        outputPath: outputRelative,
        status: 'skipped',
        reason: 'Neither downloadUrl nor base64Data were provided.'
      });
      continue;
    }

    if (dryRun) {
      results.push({
        ...diff,
        outputPath: outputRelative,
        status: 'dry-run'
      });
      continue;
    }

    try {
      await fs.ensureDir(path.dirname(outputPath));

      let data: Buffer;
      if (diff.base64Data) {
        data = Buffer.from(diff.base64Data, 'base64');
      } else {
        data = await fetcher(diff.downloadUrl!);
      }

      if (diff.sha256) {
        const checksum = createHash('sha256').update(data).digest('hex');
        if (checksum !== diff.sha256) {
          throw new Error('Downloaded asset did not match expected checksum.');
        }
      }

      await fs.writeFile(outputPath, data);

      results.push({
        ...diff,
        outputPath: outputRelative,
        status: 'written'
      });
    } catch (error) {
      results.push({
        ...diff,
        outputPath: outputRelative,
        status: 'skipped',
        reason: (error as Error).message
      });
    }
  }

  return results;
}
