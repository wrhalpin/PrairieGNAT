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

  it('accepts a bundle with objects omitted (optional per STIX 2.1)', () => {
    const bundle = { type: 'bundle', id: 'bundle--123' };
    const result = parseBundle(JSON.stringify(bundle));
    expect(result.objectsById.size).toBe(0);
  });

  it('throws on non-array objects field', () => {
    const invalid = { type: 'bundle', id: 'bundle--123', objects: 'nope' };
    expect(() => parseBundle(JSON.stringify(invalid))).toThrow(
      'objects must be an array',
    );
  });

  it('throws a clean error on JSON null instead of crashing', () => {
    expect(() => parseBundle('null')).toThrow('Invalid STIX bundle');
  });

  it('rejects a bundle without an id (required by spec, and our storage key)', () => {
    expect(() => parseBundle(JSON.stringify({ type: 'bundle' }))).toThrow(
      'missing required id',
    );
  });

  it('skips malformed entries without failing the whole bundle', () => {
    const bundle = {
      type: 'bundle',
      id: 'bundle--123',
      objects: [
        null,
        42,
        { type: 'indicator' }, // no id
        { id: 'mystery--1' }, // no type
        { type: 'malware', id: 'malware--1', name: 'Wiper', is_family: false },
      ],
    };

    const result = parseBundle(JSON.stringify(bundle));
    expect(result.objectsById.size).toBe(1);
    expect(result.objectsByType.get('malware')).toHaveLength(1);
    expect(result.objectsByType.has('undefined')).toBe(false);
  });

  it('indexes relationships from both endpoints', () => {
    const bundle = {
      type: 'bundle',
      id: 'bundle--123',
      objects: [
        { type: 'indicator', id: 'indicator--1', pattern: "[url:value = 'x']" },
        { type: 'malware', id: 'malware--1', name: 'Wiper', is_family: false },
        {
          type: 'relationship',
          id: 'relationship--1',
          relationship_type: 'indicates',
          source_ref: 'indicator--1',
          target_ref: 'malware--1',
        },
      ],
    };

    const result = parseBundle(JSON.stringify(bundle));
    expect(result.relationshipsBy.get('malware--1')).toEqual(['relationship--1']);
    expect(result.relationshipsBy.get('indicator--1')).toEqual(['relationship--1']);
  });

  it('indexes sightings against their referenced objects', () => {
    const bundle = {
      type: 'bundle',
      id: 'bundle--123',
      objects: [
        { type: 'indicator', id: 'indicator--1', pattern: "[url:value = 'x']" },
        {
          type: 'sighting',
          id: 'sighting--1',
          sighting_of_ref: 'indicator--1',
          where_sighted_refs: ['identity--1'],
        },
      ],
    };

    const result = parseBundle(JSON.stringify(bundle));
    expect(result.relationshipsBy.get('indicator--1')).toEqual(['sighting--1']);
    expect(result.relationshipsBy.get('identity--1')).toEqual(['sighting--1']);
  });
});
