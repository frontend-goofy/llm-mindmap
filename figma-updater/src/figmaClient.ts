import axios, { AxiosInstance } from 'axios';

import type { VersionDescriptor } from './types.js';

export interface FigmaClientOptions {
  apiToken: string;
  baseUrl?: string;
}

export class FigmaClient {
  private readonly http: AxiosInstance;

  constructor(private readonly options: FigmaClientOptions) {
    this.http = axios.create({
      baseURL: options.baseUrl ?? 'https://api.figma.com',
      headers: {
        'X-Figma-Token': options.apiToken
      }
    });
  }

  async listVersions(fileKey: string): Promise<VersionDescriptor[]> {
    const response = await this.http.get(`/v1/files/${fileKey}/versions`);
    const versions = response.data?.versions ?? [];

    return versions.map((version: any) => ({
      id: String(version.id ?? version.versionId ?? version.label ?? version.created_at),
      label: version.label ?? version.description ?? version.id ?? 'Unnamed version',
      createdAt: version.created_at ?? new Date().toISOString(),
      description: version.description ?? undefined
    }));
  }
}
