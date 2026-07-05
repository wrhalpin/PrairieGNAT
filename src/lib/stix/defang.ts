// Defanging renders IOCs inert so they can't be clicked or auto-linked when
// pasted into chats and reports. Conventions: bracket every dot, hxxp/hxxps
// (preserving the TLS distinction), [:] for IPv6 colons, [at] for emails.

export function defangDots(value: string): string {
  return value.replace(/\./g, '[.]');
}

export function defangUrl(value: string): string {
  return value
    .replace(/^https:\/\//i, 'hxxps://')
    .replace(/^http:\/\//i, 'hxxp://')
    .replace(/^ftp:\/\//i, 'fxp://')
    .replace(/\./g, '[.]');
}

export function defangIpv6(value: string): string {
  return value.replace(/:/g, '[:]');
}

export function defangEmail(value: string): string {
  return defangDots(value.replace(/@/g, '[at]'));
}

/**
 * Defang a STIX cyber-observable value by object type.
 * Returns undefined for types that have no defanging convention.
 */
export function defangValue(type: string, value: string): string | undefined {
  switch (type) {
    case 'url':
      return defangUrl(value);
    case 'ipv4-addr':
    case 'domain-name':
      return defangDots(value);
    case 'ipv6-addr':
      return defangIpv6(value);
    case 'email-addr':
      return defangEmail(value);
    default:
      return undefined;
  }
}
