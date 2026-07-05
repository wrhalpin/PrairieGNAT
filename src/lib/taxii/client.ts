import type { Bundle, StixObject } from '$lib/stix/types';

const TAXII_MEDIA_TYPE = 'application/taxii+json;version=2.1';
const DEFAULT_TIMEOUT_MS = 15000;

interface TAXIICollectionInfo {
  id: string;
  title: string;
  description?: string;
  created?: string;
  modified?: string;
}

interface TAXIIObjectsResponse {
  objects?: StixObject[];
  more?: boolean;
  next?: string;
}

export interface TAXIIDiscovery {
  title?: string;
  description?: string;
  default?: string;
  api_roots?: string[];
}

function assertSecureUrl(url: URL): void {
  const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (url.protocol !== 'https:' && !isLocal) {
    throw new Error('Only HTTPS URLs are allowed (or localhost for development)');
  }
}

// TAXII endpoints return an envelope ({objects: [...]}); plain endpoints
// return a bare bundle. Accept both, normalized to a bundle.
function toBundle(data: unknown): Bundle {
  const record = data as Record<string, unknown> | null;
  if (record && record.type === 'bundle' && Array.isArray(record.objects)) {
    return record as unknown as Bundle;
  }
  if (record && Array.isArray(record.objects)) {
    return {
      type: 'bundle',
      id: `bundle--${crypto.randomUUID()}`,
      objects: record.objects,
    } as unknown as Bundle;
  }
  throw new Error('Response is not a STIX bundle or TAXII envelope');
}

export class TAXIIClient {
  private baseUrl: string;
  private baseOrigin: string;
  private apiKey?: string;

  constructor(baseUrl: string, apiKey?: string) {
    const parsed = new URL(baseUrl); // throws a clear error on malformed input
    assertSecureUrl(parsed);
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.baseOrigin = parsed.origin;
    this.apiKey = apiKey;
  }

  private async requestJson(url: string): Promise<unknown> {
    const target = new URL(url);
    assertSecureUrl(target);

    const headers = new Headers({
      Accept: `${TAXII_MEDIA_TYPE}, application/stix+json, application/json`,
    });

    // Never leak the API key to a different origin than the one configured.
    if (this.apiKey && target.origin === this.baseOrigin) {
      headers.set('X-Api-Key', this.apiKey);
    }

    let response: Response;
    try {
      response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      });
    } catch (e) {
      if (e instanceof DOMException && e.name === 'TimeoutError') {
        throw new Error(`Request timed out after ${DEFAULT_TIMEOUT_MS / 1000}s`);
      }
      throw e;
    }

    if (!response.ok) {
      // TAXII error responses carry a JSON body with title/description
      let detail = '';
      try {
        const body = (await response.json()) as Record<string, unknown>;
        detail = String(body.title || body.description || '');
      } catch {
        // non-JSON error body; status line is all we have
      }
      throw new Error(
        `Request failed: ${response.status} ${response.statusText}${detail ? ` — ${detail}` : ''}`,
      );
    }

    const contentType = response.headers.get('Content-Type') || '';
    if (!contentType.includes('json')) {
      throw new Error(
        `Server returned ${contentType || 'an unknown content type'} instead of JSON — check the URL`,
      );
    }

    return response.json();
  }

  private requestPath(path: string): Promise<unknown> {
    return this.requestJson(`${this.baseUrl}${path}`);
  }

  async getDiscovery(): Promise<TAXIIDiscovery> {
    const data = (await this.requestPath('/taxii/discovery')) as TAXIIDiscovery | null;
    if (!data || typeof data !== 'object' || (!('title' in data) && !('api_roots' in data))) {
      throw new Error('Response is not a TAXII discovery document — is this a GNAT/TAXII server?');
    }
    return data;
  }

  async getCollections(): Promise<TAXIICollectionInfo[]> {
    // Errors (e.g. 401 bad key) propagate to the caller instead of being
    // swallowed into an empty list.
    const data = (await this.requestPath('/taxii/collections')) as {
      collections?: TAXIICollectionInfo[];
    };
    return data.collections || [];
  }

  async getCollectionObjects(collectionId: string, limit = 100): Promise<TAXIIObjectsResponse> {
    const params = new URLSearchParams({ limit: limit.toString() });
    return (await this.requestPath(
      `/taxii/collections/${encodeURIComponent(collectionId)}/objects?${params}`,
    )) as TAXIIObjectsResponse;
  }

  async getObject(objectId: string): Promise<Bundle> {
    const data = await this.requestPath(`/taxii/objects/${encodeURIComponent(objectId)}`);
    return toBundle(data);
  }

  async fetchBundleFromUrl(url: string): Promise<Bundle> {
    const data = await this.requestJson(url);
    return toBundle(data);
  }
}
