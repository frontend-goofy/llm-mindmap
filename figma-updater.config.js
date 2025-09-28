/**
 * Configuration template for figma-updater.
 * Fill in your API credentials and project settings.
 */

export default {
  figma: {
    apiToken: process.env.FIGMA_API_TOKEN ?? 'replace-with-figma-token',
    baseUrl: 'https://api.figma.com'
  },
  elizaApi: {
    baseUrl: 'https://eliza.example.com',
    apiKey: process.env.ELIZA_API_KEY ?? ''
  },
  project: {
    rootDir: process.cwd(),
    includeGlobs: ['web/src/**/*.{ts,tsx,js,jsx,html,css}'],
    excludeGlobs: ['**/node_modules/**', '**/dist/**'],
    assetRootDir: 'web/public/assets'
  }
};
