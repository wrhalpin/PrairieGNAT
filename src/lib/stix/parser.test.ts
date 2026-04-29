import { describe, it, expect } from 'vitest';
import { parseBundle } from './parser';

describe('STIX Parser', () => {
  it('parses a valid bundle', () => {
    const bundle = {
      type: 'bundle',
      id: 'bundle--123',
      objects: [
        {
          type: 'indicator',
          id: 'indicator--456',
          pattern: "[file:hashes.MD5 = 'd41d8cd98f00b204e9800998ecf8427e']",
          valid_from: '2024-01-01T00:00:00Z',
          labels: ['malicious-activity'],
        },
      ],
    };

    const result = parseBundle(JSON.stringify(bundle));

    expect(result.bundle.type).toBe('bundle');
    expect(result.objectsById.size).toBe(1);
    expect(result.objectsByType.get('indicator')).toHaveLength(1);
  });

  it('throws on invalid bundle type', () => {
    const invalid = {
      type: 'malware',
      id: 'malware--123',
    };

    expect(() => parseBundle(JSON.stringify(invalid))).toThrow(
      'Invalid STIX bundle',
    );
  });

  it('throws on missing objects array', () => {
    const invalid = {
      type: 'bundle',
      id: 'bundle--123',
    };

    expect(() => parseBundle(JSON.stringify(invalid))).toThrow(
      'objects must be an array',
    );
  });
});
