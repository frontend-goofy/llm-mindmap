export interface VersionDescriptor {
  id: string;
  label: string;
  createdAt: string;
  description?: string;
}

export interface TextDiff {
  nodeId: string;
  nodeName: string;
  previousText: string;
  currentText: string;
}

export interface TextDiffWithContext extends TextDiff {
  matchedFiles: Array<{
    filePath: string;
    replacements: number;
  }>;
}

export interface AssetDiff {
  nodeId: string;
  nodeName?: string;
  assetPath: string;
  downloadUrl?: string;
  base64Data?: string;
  mimeType?: string;
  sha256?: string;
}

export interface AssetDiffResult extends AssetDiff {
  outputPath: string;
  status: 'skipped' | 'written' | 'dry-run';
  reason?: string;
}

export interface DiffResponse {
  fileKey: string;
  fromVersion: VersionDescriptor;
  toVersion: VersionDescriptor;
  diffs: TextDiff[];
  assetDiffs: AssetDiff[];
}

export interface FigmaUpdaterConfig {
  figma: {
    apiToken: string;
    baseUrl?: string;
  };
  elizaApi: {
    baseUrl: string;
    apiKey?: string;
  };
  project: {
    rootDir: string;
    includeGlobs?: string[];
    excludeGlobs?: string[];
    assetRootDir?: string;
  };
}
