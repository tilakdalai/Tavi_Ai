import { URL } from 'url';

/**
 * SSRF and URL Safety Validator
 * Prevents internal network access, cloud metadata endpoints (169.254.169.254),
 * localhost probing, and dangerous schemes.
 */
export function validateAndSanitizeUrl(targetUrl) {
  if (!targetUrl || typeof targetUrl !== 'string') {
    throw new Error('Invalid URL provided.');
  }

  let parsed;
  try {
    parsed = new URL(targetUrl.trim());
  } catch {
    throw new Error('Malformed URL format.');
  }

  // 1. Enforce HTTP and HTTPS only
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`Unsupported protocol: ${parsed.protocol}. Only HTTP and HTTPS are permitted.`);
  }

  const hostname = parsed.hostname.toLowerCase();

  // 2. Block localhost and loopbacks
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '0.0.0.0' ||
    hostname.startsWith('127.') ||
    hostname.startsWith('0.')
  ) {
    throw new Error('Access to localhost or loopback addresses is prohibited.');
  }

  // 3. Block Private IPv4 Ranges (RFC 1918)
  const ipParts = hostname.split('.').map(Number);
  if (ipParts.length === 4 && ipParts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
    // 10.0.0.0 - 10.255.255.255
    if (ipParts[0] === 10) throw new Error('Access to private network range (10.x.x.x) is blocked.');
    // 172.16.0.0 - 172.31.255.255
    if (ipParts[0] === 172 && ipParts[1] >= 16 && ipParts[1] <= 31)
      throw new Error('Access to private network range (172.16-31.x.x) is blocked.');
    // 192.168.0.0 - 192.168.255.255
    if (ipParts[0] === 192 && ipParts[1] === 168)
      throw new Error('Access to private network range (192.168.x.x) is blocked.');
    // AWS / Cloud Metadata: 169.254.169.254
    if (ipParts[0] === 169 && ipParts[1] === 254)
      throw new Error('Access to link-local cloud metadata is blocked.');
  }

  // 4. Block common internal DNS / AWS metadata names
  if (
    hostname.endsWith('.internal') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.lan') ||
    hostname.includes('metadata.google')
  ) {
    throw new Error('Access to internal hostnames is prohibited.');
  }

  return parsed.toString();
}

/**
 * Extracts clean domain and favicon URL
 */
export function getDomainAndFavicon(urlString) {
  try {
    const parsed = new URL(urlString);
    const domain = parsed.hostname.replace(/^www\./, '');
    const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    return { domain, favicon };
  } catch {
    return { domain: 'web', favicon: '' };
  }
}
