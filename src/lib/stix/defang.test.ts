import { describe, it, expect } from 'vitest';
import { defangValue, defangUrl, defangDots, defangIpv6, defangEmail } from './defang';

describe('defang', () => {
  it('brackets every dot in an IPv4 address', () => {
    expect(defangValue('ipv4-addr', '192.168.10.55')).toBe('192[.]168[.]10[.]55');
  });

  it('defangs domain names', () => {
    expect(defangValue('domain-name', 'evil-c2.example.com')).toBe('evil-c2[.]example[.]com');
  });

  it('brackets colons in IPv6 addresses', () => {
    expect(defangValue('ipv6-addr', '2001:db8::1')).toBe('2001[:]db8[:][:]1');
  });

  it('preserves the TLS distinction for URLs', () => {
    expect(defangValue('url', 'https://evil.com/payload')).toBe('hxxps://evil[.]com/payload');
    expect(defangValue('url', 'http://evil.com/payload')).toBe('hxxp://evil[.]com/payload');
  });

  it('defangs ftp URLs', () => {
    expect(defangUrl('ftp://evil.com/drop')).toBe('fxp://evil[.]com/drop');
  });

  it('leaves no live dots in a defanged URL host or path', () => {
    const defanged = defangValue('url', 'https://a.b.c.evil.com/x.php')!;
    expect(defanged).not.toMatch(/(?<!\[)\.(?!\])/);
  });

  it('defangs email addresses', () => {
    expect(defangValue('email-addr', 'phisher@evil.com')).toBe('phisher[at]evil[.]com');
  });

  it('returns undefined for types without a defanging convention', () => {
    expect(defangValue('file', 'notes.txt')).toBeUndefined();
    expect(defangValue('mutex', 'Global\\x')).toBeUndefined();
  });

  it('is idempotent-safe on already-bracketed dots via helpers', () => {
    expect(defangDots('1.2')).toBe('1[.]2');
    expect(defangIpv6('::1')).toBe('[:][:]1');
    expect(defangEmail('a@b.c')).toBe('a[at]b[.]c');
  });
});
