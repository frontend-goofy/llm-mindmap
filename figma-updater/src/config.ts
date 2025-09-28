import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { z } from 'zod';

import type { FigmaUpdaterConfig } from './types.js';

const configSchema = z.object({
  figma: z.object({
    apiToken: z.string().min(1, 'Figma API token is required'),
    baseUrl: z.string().url().optional()
  }),
  elizaApi: z.object({
    baseUrl: z.string().url('Eliza API base URL must be a valid URL'),
    apiKey: z.string().optional()
  }),
  project: z.object({
    rootDir: z.string().default(process.cwd()),
    includeGlobs: z.array(z.string()).optional(),
    excludeGlobs: z.array(z.string()).optional(),
    assetRootDir: z.string().optional()
  })
});

const cache = new Map<string, FigmaUpdaterConfig>();

export async function loadConfig(configPath = path.resolve(process.cwd(), 'figma-updater.config.js')): Promise<FigmaUpdaterConfig> {
  const resolvedPath = path.isAbsolute(configPath) ? configPath : path.resolve(process.cwd(), configPath);

  const cached = cache.get(resolvedPath);
  if (cached) {
    return cached;
  }

  let userConfig: unknown;

  try {
    const fileUrl = pathToFileURL(resolvedPath).href;
    const module = await import(fileUrl);
    userConfig = module.default ?? module.config ?? module;
  } catch (error) {
    throw new Error(`Unable to load configuration at ${resolvedPath}: ${(error as Error).message}`);
  }

  const parsed = configSchema.safeParse(userConfig);

  if (!parsed.success) {
    throw new Error(`Configuration is invalid: ${parsed.error.toString()}`);
  }

  const projectRoot = parsed.data.project.rootDir
    ? path.resolve(process.cwd(), parsed.data.project.rootDir)
    : process.cwd();

  const normalized: FigmaUpdaterConfig = {
    figma: {
      baseUrl: 'https://api.figma.com',
      ...parsed.data.figma
    },
    elizaApi: parsed.data.elizaApi,
    project: {
      ...parsed.data.project,
      rootDir: projectRoot,
      assetRootDir: parsed.data.project.assetRootDir
        ? path.resolve(projectRoot, parsed.data.project.assetRootDir)
        : undefined
    }
  };

  cache.set(resolvedPath, normalized);
  return normalized;
}
