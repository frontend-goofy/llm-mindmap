import path from 'node:path';

import fs from 'fs-extra';
import { globby } from 'globby';

import type { TextDiff, TextDiffWithContext } from './types.js';

export interface ProjectFileQuery {
  rootDir: string;
  includeGlobs?: string[];
  excludeGlobs?: string[];
}

export interface ApplyTextDiffOptions extends ProjectFileQuery {
  dryRun?: boolean;
  files?: string[];
}

const DEFAULT_INCLUDE = ['**/*.{ts,tsx,js,jsx,vue,svelte,css,scss,md,html,json}'];
const DEFAULT_EXCLUDE = ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'];

export async function resolveProjectFiles(query: ProjectFileQuery): Promise<string[]> {
  const { rootDir, includeGlobs = DEFAULT_INCLUDE, excludeGlobs = DEFAULT_EXCLUDE } = query;

  const exists = await fs.pathExists(rootDir);
  if (!exists) {
    throw new Error(`Project root directory does not exist: ${rootDir}`);
  }

  const files = await globby(includeGlobs, {
    cwd: rootDir,
    ignore: excludeGlobs,
    absolute: true
  });

  if (files.length === 0) {
    throw new Error(
      `No files matched include globs ${JSON.stringify(includeGlobs)} under ${rootDir}.`
    );
  }

  return files;
}

export async function applyTextDiffs(
  diffs: TextDiff[],
  options: ApplyTextDiffOptions
): Promise<TextDiffWithContext[]> {
  const {
    rootDir,
    includeGlobs = DEFAULT_INCLUDE,
    excludeGlobs = DEFAULT_EXCLUDE,
    dryRun = false,
    files = undefined
  } = options;

  const resolvedFiles = files ?? (await resolveProjectFiles({ rootDir, includeGlobs, excludeGlobs }));

  const results: TextDiffWithContext[] = [];

  for (const diff of diffs) {
    const matchedFiles: TextDiffWithContext['matchedFiles'] = [];

    if (!diff.previousText || diff.previousText === diff.currentText) {
      results.push({ ...diff, matchedFiles });
      continue;
    }

    for (const file of resolvedFiles) {
      const content = await fs.readFile(file, 'utf8');

      if (!content.includes(diff.previousText)) {
        continue;
      }

      const replacements = content.split(diff.previousText).length - 1;
      matchedFiles.push({
        filePath: path.relative(rootDir, file),
        replacements
      });

      if (!dryRun && replacements > 0) {
        const updated = content.replaceAll(diff.previousText, diff.currentText);
        await fs.writeFile(file, updated, 'utf8');
      }
    }

    results.push({ ...diff, matchedFiles });
  }

  return results;
}
