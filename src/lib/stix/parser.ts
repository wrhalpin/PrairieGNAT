import type {
  Bundle,
  StixObject,
  Indicator,
  ThreatActor,
  Malware,
  Campaign,
} from './types';

export interface ParsedBundle {
  bundle: Bundle;
  objectsById: Map<string, StixObject>;
  // object id -> ids of relationship/sighting objects that reference it
  // (both directions, so an indicator's page shows what it indicates and
  // a malware's page shows what indicates it)
  relationshipsBy: Map<string, string[]>;
  objectsByType: Map<string, StixObject[]>;
  markingsById: Map<string, any>;
}

export function parseBundle(jsonString: string): ParsedBundle {
  const data = JSON.parse(jsonString);

  if (!data || typeof data !== 'object' || data.type !== 'bundle') {
    throw new Error('Invalid STIX bundle: missing or incorrect type');
  }

  if (typeof data.id !== 'string' || !data.id) {
    throw new Error('Invalid STIX bundle: missing required id');
  }

  // The STIX 2.1 spec makes `objects` optional on a bundle; treat a missing
  // list as empty rather than rejecting the bundle.
  if (data.objects === undefined) {
    data.objects = [];
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
    // A single malformed entry (null, non-object, missing id/type) must not
    // make the whole bundle unloadable — skip it.
    if (!obj || typeof obj !== 'object' || !obj.id || !obj.type) {
      continue;
    }

    objectsById.set(obj.id, obj);

    // Index by type
    if (!objectsByType.has(obj.type)) {
      objectsByType.set(obj.type, []);
    }
    objectsByType.get(obj.type)!.push(obj);

    // Build relationship index (both endpoints, plus sighting refs)
    const rel = obj as any;
    const refs = new Set<string>();
    if (obj.type === 'relationship') {
      if (rel.source_ref) refs.add(rel.source_ref);
      if (rel.target_ref) refs.add(rel.target_ref);
    } else if (obj.type === 'sighting') {
      if (rel.sighting_of_ref) refs.add(rel.sighting_of_ref);
      for (const r of rel.observed_data_refs || []) refs.add(r);
      for (const r of rel.where_sighted_refs || []) refs.add(r);
    }
    for (const ref of refs) {
      if (!relationshipsBy.has(ref)) {
        relationshipsBy.set(ref, []);
      }
      relationshipsBy.get(ref)!.push(obj.id);
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

export function getTLPColor(marking: any): string {
  if (!marking) return '#ffffff'; // default white/clear

  const definition = marking.definition;
  if (!definition || typeof definition.tlp !== 'string') return '#ffffff';

  const tlp = definition.tlp.toLowerCase().replace(/^tlp:/, '');
  const colors: { [key: string]: string } = {
    clear: '#ffffff',
    white: '#ffffff', // TLP 1.0 name for CLEAR
    green: '#33cc33',
    amber: '#ffcc00',
    'amber+strict': '#cc6600',
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
    'email-addr': '✉️',
    'email-message': '📧',
    file: '📁',
    process: '⚙️',
    software: '💿',
    mutex: '🔒',
    'network-traffic': '🚦',
    'windows-registry-key': '🔑',
    'x509-certificate': '📜',
    relationship: '🔗',
    sighting: '👁️',
    'marking-definition': '🏷️',
    note: '📝',
    opinion: '💭',
    tool: '🔧',
    infrastructure: '🏗️',
    grouping: '🗂️',
    location: '🗺️',
    'malware-analysis': '🔬',
    incident: '🚨',
  };
  return icons[type] || '📌';
}

export function getObjectSubtitle(obj: StixObject): string {
  const type = obj.type;
  const data = obj as any;

  if (type === 'indicator') return data.labels?.[0] || 'Detection pattern';
  if (type === 'malware') return data.labels?.[0] || 'Malicious software';
  if (type === 'threat-actor') return data.resource_level || 'Threat actor';
  if (type === 'campaign') return data.objective || 'Campaign';
  if (type === 'report')
    return `${data.report_types?.[0] || 'Report'} • ${data.object_refs?.length || 0} objects`;
  if (type === 'attack-pattern')
    return data.external_references?.[0]?.external_id || 'ATT&CK technique';
  if (type === 'vulnerability')
    return data.labels?.[0] || 'Security vulnerability';
  if (type === 'observed-data')
    return `${data.object_refs?.length || 0} observations`;
  if (type === 'identity') return data.identity_class || 'Identity';
  if (type === 'course-of-action') return 'Mitigation';
  if (type === 'intrusion-set') return data.goals?.[0] || 'Intrusion set';
  if (type === 'sighting') return `Seen ${data.count ?? 1} time(s)`;
  if (type === 'relationship') return (data as any).relationship_type;
  if (
    type === 'domain-name' ||
    type === 'ipv4-addr' ||
    type === 'ipv6-addr' ||
    type === 'url' ||
    type === 'email-addr'
  ) {
    return data.value || type.replace(/-/g, ' ');
  }

  return type.replace(/-/g, ' ');
}

export function getObjectCategory(
  type: string
): 'sdo' | 'sro' | 'sco' | 'meta' {
  const sdos = [
    'attack-pattern',
    'campaign',
    'course-of-action',
    'grouping',
    'identity',
    'incident',
    'indicator',
    'infrastructure',
    'intrusion-set',
    'location',
    'malware',
    'malware-analysis',
    'note',
    'observed-data',
    'opinion',
    'report',
    'threat-actor',
    'tool',
    'vulnerability',
  ];
  const sros = ['relationship', 'sighting'];
  const scos = [
    'artifact',
    'autonomous-system',
    'directory',
    'domain-name',
    'email-addr',
    'email-message',
    'file',
    'ipv4-addr',
    'ipv6-addr',
    'mac-addr',
    'mutex',
    'network-traffic',
    'process',
    'software',
    'url',
    'user-account',
    'windows-registry-key',
    'x509-certificate',
  ];

  if (sdos.includes(type)) return 'sdo';
  if (sros.includes(type)) return 'sro';
  if (scos.includes(type)) return 'sco';
  return 'meta';
}
