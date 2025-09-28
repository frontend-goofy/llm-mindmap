import axios from 'axios';

import type { AssetDiff, DiffResponse, TextDiff } from './types.js';

export interface DiffServiceOptions {
  baseUrl: string;
  apiKey?: string;
}

export class DiffService {
  constructor(private readonly options: DiffServiceOptions) {}

  async getTextDiffs(fileKey: string, fromVersion: string, toVersion: string): Promise<DiffResponse> {
    const response = await axios.get(`${this.options.baseUrl.replace(/\/$/, '')}/figma/diffs`, {
      params: {
        fileKey,
        fromVersion,
        toVersion
      },
      headers: this.options.apiKey
        ? {
            Authorization: `Bearer ${this.options.apiKey}`
          }
        : undefined
    });

    const data = response.data as Partial<DiffResponse> & {
      diffs?: TextDiff[];
      assetDiffs?: AssetDiff[];
    };

    if ('fileKey' in data && data.fileKey) {
      return {
        ...data,
        diffs: data.diffs ?? [],
        assetDiffs: data.assetDiffs ?? []
      } as DiffResponse;
    }

    return {
      fileKey,
      fromVersion: { id: fromVersion, label: fromVersion, createdAt: '' },
      toVersion: { id: toVersion, label: toVersion, createdAt: '' },
      diffs: data.diffs ?? [],
      assetDiffs: data.assetDiffs ?? []
    };
  }
}
