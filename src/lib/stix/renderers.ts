import type { StixObject } from './types';
import { defangValue } from './defang';

export interface RenderField {
  label: string;
  value: string | string[] | number;
  type?: 'text' | 'list' | 'chip' | 'code' | 'copyable';
  defanged?: string; // Defanged version for copyable fields
}

export function getObjectFields(obj: StixObject): RenderField[] {
  const fields: RenderField[] = [];
  const data = obj as any;

  // Type-specific fields
  switch (obj.type) {
    case 'indicator':
      if (data.pattern) fields.push({ label: 'Pattern', value: data.pattern, type: 'code' });
      if (data.pattern_type) fields.push({ label: 'Pattern Type', value: data.pattern_type });
      if (data.valid_from) fields.push({ label: 'Valid From', value: new Date(data.valid_from).toLocaleString() });
      if (data.valid_until) fields.push({ label: 'Valid Until', value: new Date(data.valid_until).toLocaleString() });
      if (data.kill_chain_phases?.length) {
        fields.push({
          label: 'Kill Chain Phases',
          value: data.kill_chain_phases.map((k: any) => k.phase_name),
          type: 'chip',
        });
      }
      break;

    case 'malware':
      if (data.aliases?.length) fields.push({ label: 'Aliases', value: data.aliases, type: 'list' });
      if (data.capabilities?.length) fields.push({ label: 'Capabilities', value: data.capabilities, type: 'chip' });
      if (data.is_family !== undefined) fields.push({ label: 'Family', value: data.is_family ? 'Yes' : 'No' });
      break;

    case 'threat-actor':
      if (data.aliases?.length) fields.push({ label: 'Aliases', value: data.aliases, type: 'list' });
      if (data.goals?.length) fields.push({ label: 'Goals', value: data.goals, type: 'list' });
      if (data.sophistication) fields.push({ label: 'Sophistication', value: data.sophistication });
      if (data.resource_level) fields.push({ label: 'Resource Level', value: data.resource_level });
      if (data.primary_motivation) fields.push({ label: 'Primary Motivation', value: data.primary_motivation });
      break;

    case 'campaign':
      if (data.description) fields.push({ label: 'Description', value: data.description });
      if (data.first_seen) fields.push({ label: 'First Seen', value: new Date(data.first_seen).toLocaleString() });
      if (data.last_seen) fields.push({ label: 'Last Seen', value: new Date(data.last_seen).toLocaleString() });
      if (data.objective) fields.push({ label: 'Objective', value: data.objective });
      break;

    case 'intrusion-set':
      if (data.aliases?.length) fields.push({ label: 'Aliases', value: data.aliases, type: 'list' });
      if (data.goals?.length) fields.push({ label: 'Goals', value: data.goals, type: 'list' });
      if (data.first_seen) fields.push({ label: 'First Seen', value: new Date(data.first_seen).toLocaleString() });
      if (data.last_seen) fields.push({ label: 'Last Seen', value: new Date(data.last_seen).toLocaleString() });
      break;

    case 'attack-pattern':
      if (data.external_references?.length) {
        const ref = data.external_references[0];
        if (ref.external_id) fields.push({ label: 'MITRE ID', value: ref.external_id });
        if (ref.url) fields.push({ label: 'Reference', value: ref.url });
      }
      if (data.kill_chain_phases?.length) {
        fields.push({
          label: 'Kill Chain',
          value: data.kill_chain_phases.map((k: any) => k.phase_name),
          type: 'chip',
        });
      }
      break;

    case 'report':
      if (data.report_types?.length) fields.push({ label: 'Report Types', value: data.report_types, type: 'chip' });
      if (data.published) fields.push({ label: 'Published', value: new Date(data.published).toLocaleString() });
      if (data.object_refs?.length) fields.push({ label: 'Objects', value: `${data.object_refs.length} items` });
      break;

    case 'vulnerability':
      if (data.external_references?.length) {
        const ref = data.external_references[0];
        if (ref.external_id) fields.push({ label: 'CVE', value: ref.external_id });
      }
      break;

    case 'course-of-action':
      if (data.action_type) fields.push({ label: 'Action Type', value: data.action_type });
      break;

    case 'identity':
      if (data.identity_class) fields.push({ label: 'Class', value: data.identity_class });
      if (data.sectors?.length) fields.push({ label: 'Sectors', value: data.sectors, type: 'chip' });
      if (data.contact_information) fields.push({ label: 'Contact', value: data.contact_information });
      break;

    case 'observed-data':
      if (data.first_observed) fields.push({ label: 'First Observed', value: new Date(data.first_observed).toLocaleString() });
      if (data.last_observed) fields.push({ label: 'Last Observed', value: new Date(data.last_observed).toLocaleString() });
      if (data.number_observed) fields.push({ label: 'Count', value: data.number_observed });
      if (data.object_refs?.length) fields.push({ label: 'Objects', value: `${data.object_refs.length} observables` });
      break;

    case 'sighting':
      if (data.first_seen) fields.push({ label: 'First Seen', value: new Date(data.first_seen).toLocaleString() });
      if (data.last_seen) fields.push({ label: 'Last Seen', value: new Date(data.last_seen).toLocaleString() });
      if (data.count) fields.push({ label: 'Count', value: data.count });
      break;

    case 'relationship':
      if (data.relationship_type) fields.push({ label: 'Type', value: data.relationship_type });
      if (data.description) fields.push({ label: 'Description', value: data.description });
      break;

    case 'domain-name':
    case 'ipv4-addr':
    case 'ipv6-addr':
      if (data.value) {
        const defangedValue = defangValue(obj.type, data.value);
        fields.push({
          label: 'Value',
          value: data.value,
          type: 'copyable',
          defanged: defangedValue !== data.value ? defangedValue : undefined,
        });
      }
      if (data.resolves_to_refs?.length) fields.push({ label: 'Resolves To', value: data.resolves_to_refs, type: 'list' });
      break;

    case 'url':
    case 'email-addr':
      if (data.value) {
        const defangedValue = defangValue(obj.type, data.value);
        fields.push({
          label: 'Value',
          value: data.value,
          type: 'copyable',
          defanged: defangedValue !== data.value ? defangedValue : undefined,
        });
      }
      break;

    case 'file':
      if (data.name) fields.push({ label: 'Name', value: data.name });
      if (data.size) fields.push({ label: 'Size', value: `${data.size} bytes` });
      if (data.hashes) {
        Object.entries(data.hashes).forEach(([algo, hash]) => {
          fields.push({ label: `${algo.toUpperCase()}`, value: hash as string, type: 'code' });
        });
      }
      break;

    case 'process':
      if (data.pid) fields.push({ label: 'PID', value: data.pid });
      if (data.name) fields.push({ label: 'Name', value: data.name });
      if (data.command_line) fields.push({ label: 'Command Line', value: data.command_line, type: 'code' });
      break;

    case 'windows-registry-key':
      if (data.key) fields.push({ label: 'Registry Key', value: data.key, type: 'code' });
      break;

    case 'note':
      if (data.content) fields.push({ label: 'Content', value: data.content });
      break;

    case 'opinion':
      if (data.opinion) fields.push({ label: 'Opinion', value: data.opinion });
      break;
  }

  return fields;
}

export function getTypeBgColor(type: string): string {
  const colors: { [key: string]: string } = {
    'sdo': 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
    'sro': 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800',
    'sco': 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
    'meta': 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800',
  };

  if (type === 'indicator' || type === 'malware' || type === 'campaign') return colors.sdo;
  if (type === 'relationship' || type === 'sighting') return colors.sro;
  if (
    type === 'domain-name' ||
    type === 'ipv4-addr' ||
    type === 'ipv6-addr' ||
    type === 'url' ||
    type === 'email-addr' ||
    type === 'file'
  )
    return colors.sco;
  if (type === 'note' || type === 'opinion') return colors.meta;
  return colors.sdo;
}
