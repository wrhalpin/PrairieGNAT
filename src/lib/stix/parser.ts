import type { Bundle, StixObject } from './types';

export interface ParsedBundle {
  bundle: Bundle;
  objectsById: Map<string, StixObject>;
  relationshipsBy: Map<string, string[]>; // target_ref -> source_refs
  objectsByType: Map<string, StixObject[]>;
}

export function parseBundle(jsonString: string): ParsedBundle {
  const data = JSON.parse(jsonString);

  if (!data.type || data.type !== 'bundle') {
    throw new Error('Invalid STIX bundle: missing or incorrect type');
  }

  if (!Array.isArray(data.objects)) {
    throw new Error('Invalid STIX bundle: objects must be an array');
  }

  const bundle = data as Bundle;
  const objectsById = new Map<string, StixObject>();
  const relationshipsBy = new Map<string, string[]>();
  const objectsByType = new Map<string, StixObject[]>();

  for (const obj of bundle.objects) {
    if (!obj.id) {
      console.warn('Skipping STIX object without id', obj);
      continue;
    }

    objectsById.set(obj.id, obj);

    // Index by type
    if (!objectsByType.has(obj.type)) {
      objectsByType.set(obj.type, []);
    }
    objectsByType.get(obj.type)!.push(obj);

    // Build relationship index
    if (obj.type === 'relationship') {
      const targetRef = (obj as any).target_ref;
      if (targetRef) {
        if (!relationshipsBy.has(targetRef)) {
          relationshipsBy.set(targetRef, []);
        }
        relationshipsBy.get(targetRef)!.push(obj.id);
      }
    }
  }

  return {
    bundle,
    objectsById,
    relationshipsBy,
    objectsByType,
  };
}

export function getRelatedObjects(
  objectId: string,
  parsed: ParsedBundle,
): StixObject[] {
  const relationshipIds = parsed.relationshipsBy.get(objectId) || [];
  const relatedObjects: StixObject[] = [];

  for (const relId of relationshipIds) {
    const rel = parsed.objectsById.get(relId) as any;
    if (rel && rel.source_ref) {
      const sourceObj = parsed.objectsById.get(rel.source_ref);
      if (sourceObj) {
        relatedObjects.push(sourceObj);
      }
    }
  }

  return relatedObjects;
}
