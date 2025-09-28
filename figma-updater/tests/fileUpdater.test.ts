import path from 'node:path';
import os from 'node:os';

import fs from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { applyTextDiffs, resolveProjectFiles } from '../src/fileUpdater.js';
import type { TextDiff } from '../src/types.js';

let tempDir: string;

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'figma-updater-text-'));
});

afterEach(async () => {
  await fs.remove(tempDir);
});

describe('resolveProjectFiles', () => {
  it('throws when root directory does not exist', async () => {
    await expect(
      resolveProjectFiles({
        rootDir: path.join(tempDir, 'missing'),
        includeGlobs: ['**/*.ts']
      })
    ).rejects.toThrow('Project root directory does not exist');
  });

  it('throws when include globs do not match files', async () => {
    await expect(
      resolveProjectFiles({
        rootDir: tempDir,
        includeGlobs: ['**/*.md']
      })
    ).rejects.toThrow('No files matched include globs');
  });

  it('returns file list for valid globs', async () => {
    const filePath = path.join(tempDir, 'example.ts');
    await fs.writeFile(filePath, 'const foo = "bar";');

    const files = await resolveProjectFiles({
      rootDir: tempDir,
      includeGlobs: ['**/*.ts']
    });

    expect(files).toHaveLength(1);
    expect(files[0]).toContain('example.ts');
  });
});

describe('applyTextDiffs', () => {
  it('replaces occurrences and reports matches', async () => {
    const filePath = path.join(tempDir, 'copy.txt');
    await fs.writeFile(filePath, 'Hello world! Hello world!');

    const diffs: TextDiff[] = [
      {
        nodeId: '1',
        nodeName: 'Greeting',
        previousText: 'Hello',
        currentText: 'Привет'
      }
    ];

    const results = await applyTextDiffs(diffs, {
      rootDir: tempDir,
      includeGlobs: ['**/*.txt']
    });

    expect(results[0].matchedFiles).toHaveLength(1);
    expect(results[0].matchedFiles[0].replacements).toBe(2);

    const updated = await fs.readFile(filePath, 'utf8');
    expect(updated).toBe('Привет world! Привет world!');
  });

  it('honours dry-run mode without writing changes', async () => {
    const filePath = path.join(tempDir, 'copy.txt');
    await fs.writeFile(filePath, 'Status: draft');

    const diffs: TextDiff[] = [
      {
        nodeId: '2',
        nodeName: 'Status',
        previousText: 'draft',
        currentText: 'published'
      }
    ];

    const results = await applyTextDiffs(diffs, {
      rootDir: tempDir,
      includeGlobs: ['**/*.txt'],
      dryRun: true
    });

    expect(results[0].matchedFiles[0].replacements).toBe(1);
    const updated = await fs.readFile(filePath, 'utf8');
    expect(updated).toBe('Status: draft');
  });
});
