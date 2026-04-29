import type { Bundle, StixObject, Indicator, ThreatActor, Malware, Campaign } from './types';

export interface ParsedBundle {
  bundle: Bundle;
  objectsById: Map<string, StixObject>;
  relationshipsBy: Map<string, string[]>; // target_ref -> source_refs
  objectsByType: Map<string, StixObject[]>;
  markingsById: Map<string, any>;
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
  const markingsById = new Map<string, any>();

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

    // Index marking definitions
    if (obj.type === 'marking-definition') {
      markingsById.set(obj.id, obj);
    }
  }

  return {
    bundle,
    objectsById,
    relationshipsBy,
    objectsByType,
    markingsById,
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

export function getTLPColor(marking: any): string {
  if (!marking) return '#ffffff'; // default white/clear

  const definition = marking.definition;
  if (!definition || !definition.tlp) return '#ffffff';

  const tlp = definition.tlp.toLowerCase();
  const colors: { [key: string]: string } = {
    'tlp:clear': '#ffffff',
    'tlp:green': '#33cc33',
    'tlp:amber': '#ffcc00',
    'tlp:amber+strict': '#cc6600',
    'tlp:red': '#ff3333',
    clear: '#ffffff',
    green: '#33cc33',
    amber: '#ffcc00',
    red: '#ff3333',
  };

  return colors[tlp] || '#ffffff';
}

export function getObjectName(obj: StixObject): string {
  if ((obj as any).name) return (obj as any).name;
  if ((obj as any).title) return (obj as any).title;
  if ((obj as any).value) return (obj as any).value;
  return obj.id.split('--')[1] || obj.id;
}

export function getObjectDescription(obj: StixObject): string | undefined {
  return (obj as any).description || (obj as any).pattern;
}

export function getObjectLabels(obj: StixObject): string[] {
  return (obj as any).labels || [];
}

export function getObjectIcon(type: string): string {
  const icons: { [key: string]: string } = {
    indicator: '🎯',
    'threat-actor': '👤',
    malware: '🦠',
    campaign: '📋',
    'intrusion-set': '👥',
    'attack-pattern': '⚔️',
    report: '📄',
    vulnerability: '🔓',
    'course-of-action': '🛡️',
    'observed-data': '👁️',
    identity: '🪪',
    'domain-name': '🌐',
    'ipv4-addr': '📍',
    'ipv6-addr': '📍',
    url: '🔗',
    email: '✉️',
    file: '📁',
    relationship: '🔗',
    'marking-definition': '🏷️',
  };
  return icons[type] || '📌';
}
