import path from 'node:path';
import os from 'node:os';

import fs from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { applyAssetDiffs } from '../src/assetUpdater.js';
import type { AssetDiff } from '../src/types.js';

let tempDir: string;

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'figma-updater-asset-'));
});

afterEach(async () => {
  await fs.remove(tempDir);
});

describe('applyAssetDiffs', () => {
  it('writes base64 encoded assets to disk', async () => {
    const payload = Buffer.from('asset-data');
    const diffs: AssetDiff[] = [
      {
        nodeId: 'asset-1',
        nodeName: 'Icon',
        assetPath: 'icons/icon.svg',
        base64Data: payload.toString('base64'),
        mimeType: 'image/svg+xml'
      }
    ];

    const results = await applyAssetDiffs(diffs, {
      rootDir: tempDir
    });

    const writtenFile = path.join(tempDir, 'icons/icon.svg');
    expect(await fs.pathExists(writtenFile)).toBe(true);
    expect(await fs.readFile(writtenFile)).toEqual(payload);
    expect(results[0].status).toBe('written');
  });

  it('uses provided fetcher for remote downloads', async () => {
    const fetcher = vi.fn(async () => Buffer.from('fetched'));
    const diffs: AssetDiff[] = [
      {
        nodeId: 'asset-2',
        assetPath: 'images/banner.png',
        downloadUrl: 'https://example.com/banner.png',
        sha256: '0c7fcf412c36e9e1cfc3cca37cec9afedcfca86e1943f6827c36e88dfda41642'
      }
    ];

    const results = await applyAssetDiffs(diffs, {
      rootDir: tempDir,
      fetcher
    });

    expect(fetcher).toHaveBeenCalledOnce();
    const writtenFile = path.join(tempDir, 'images/banner.png');
    expect(await fs.pathExists(writtenFile)).toBe(true);
    expect((await fs.readFile(writtenFile)).toString()).toBe('fetched');
    expect(results[0].status).toBe('written');
  });

  it('reports dry-run status without writing', async () => {
    const diffs: AssetDiff[] = [
      {
        nodeId: 'asset-3',
        assetPath: 'images/banner.png',
        downloadUrl: 'https://example.com/banner.png'
      }
    ];

    const results = await applyAssetDiffs(diffs, {
      rootDir: tempDir,
      dryRun: true
    });

    expect(results[0].status).toBe('dry-run');
    expect(await fs.pathExists(path.join(tempDir, 'images/banner.png'))).toBe(false);
  });
});
