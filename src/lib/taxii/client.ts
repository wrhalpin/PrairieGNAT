import type { Bundle, StixObject } from '$lib/stix/types';

interface TAXIICollectionInfo {
  id: string;
  title: string;
  description?: string;
  created?: string;
  modified?: string;
}

interface TAXIIObjectsResponse {
  objects: StixObject[];
  more?: boolean;
  next?: string;
}

export class TAXIIClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  private async fetch(
    path: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const url = `${this.baseUrl}${path}`;
    const headers = new Headers(options.headers);

    if (this.apiKey) {
      headers.set('X-Api-Key', this.apiKey);
    }
    headers.set('Content-Type', 'application/stix+json');

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(
        `TAXII request failed: ${response.status} ${response.statusText}`,
      );
    }

    return response;
  }

  async getDiscovery(): Promise<any> {
    const response = await this.fetch('/taxii/discovery');
    return response.json();
  }

  async getCollections(): Promise<TAXIICollectionInfo[]> {
    try {
      const response = await this.fetch('/taxii/collections');
      const data = await response.json();
      return data.collections || [];
    } catch (error) {
      console.error('Failed to fetch TAXII collections:', error);
      return [];
    }
  }

  async getCollectionObjects(
    collectionId: string,
    limit = 100,
  ): Promise<TAXIIObjectsResponse> {
    const params = new URLSearchParams({ limit: limit.toString() });
    const response = await this.fetch(
      `/taxii/collections/${collectionId}/objects?${params}`,
    );
    return response.json();
  }

  async getObject(objectId: string): Promise<StixObject> {
    const response = await this.fetch(`/taxii/objects/${objectId}`);
    const data = await response.json();
    return data;
  }

  async fetchBundleFromUrl(url: string): Promise<Bundle> {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/stix+json',
        ...(this.apiKey && { 'X-Api-Key': this.apiKey }),
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch bundle: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    if (data.type !== 'bundle') {
      throw new Error('URL did not return a STIX bundle');
    }

    return data;
  }
}
