// STIX 2.1 Type Definitions

export interface StixObject {
  type: string;
  id: string;
  created?: string;
  modified?: string;
  [key: string]: any;
}

export interface Indicator extends StixObject {
  type: 'indicator';
  pattern: string;
  valid_from: string;
  valid_until?: string;
  labels?: string[];
  kill_chain_phases?: KillChainPhase[];
}

export interface ThreatActor extends StixObject {
  type: 'threat-actor';
  name: string;
  description?: string;
  aliases?: string[];
  goals?: string[];
  sophistication?: string;
  resource_level?: string;
  primary_motivation?: string;
  labels?: string[];
}

export interface Malware extends StixObject {
  type: 'malware';
  name: string;
  description?: string;
  labels?: string[];
  aliases?: string[];
  capabilities?: string[];
  is_family?: boolean;
}

export interface Campaign extends StixObject {
  type: 'campaign';
  name: string;
  description?: string;
  created?: string;
  first_seen?: string;
  last_seen?: string;
  objective?: string;
}

export interface IntrusionSet extends StixObject {
  type: 'intrusion-set';
  name: string;
  description?: string;
  aliases?: string[];
  goals?: string[];
  first_seen?: string;
  last_seen?: string;
}

export interface AttackPattern extends StixObject {
  type: 'attack-pattern';
  name: string;
  description?: string;
  external_references?: ExternalReference[];
  kill_chain_phases?: KillChainPhase[];
}

export interface Report extends StixObject {
  type: 'report';
  name: string;
  published: string;
  report_types: string[];
  object_refs: string[];
  description?: string;
  labels?: string[];
}

export interface Relationship extends StixObject {
  type: 'relationship';
  source_ref: string;
  target_ref: string;
  relationship_type: string;
  description?: string;
}

export interface Sighting extends StixObject {
  type: 'sighting';
  sighting_of_ref: string;
  observed_data_refs?: string[];
  where_sighted_refs?: string[];
  first_seen?: string;
  last_seen?: string;
  count?: number;
}

// SCOs (Cyber Observables)
export interface IPv4Address extends StixObject {
  type: 'ipv4-addr';
  value: string;
  resolves_to_refs?: string[];
}

export interface Domain extends StixObject {
  type: 'domain-name';
  value: string;
}

export interface Url extends StixObject {
  type: 'url';
  value: string;
}

export interface Email extends StixObject {
  type: 'email-addr';
  value: string;
}

export interface File extends StixObject {
  type: 'file';
  name?: string;
  hashes?: { [algorithm: string]: string };
  size?: number;
}

// Marking Definition
export interface MarkingDefinition extends StixObject {
  type: 'marking-definition';
  definition_type: string;
  definition: { tlp?: string; [key: string]: any };
  name?: string;
}

export interface KillChainPhase {
  kill_chain_name: string;
  phase_name: string;
}

export interface ExternalReference {
  source_name: string;
  url?: string;
  external_id?: string;
  description?: string;
}

export interface Bundle {
  type: 'bundle';
  id: string;
  objects: StixObject[];
}
