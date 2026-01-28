import type { TransportOptions } from './types';

/**
 * Send data to the Nadi API
 * Uses sendBeacon for reliability on page unload, falls back to fetch
 */
export function send(options: TransportOptions): Promise<boolean> {
  const { url, headers, data, useBeacon = false } = options;
  const body = JSON.stringify(data);

  // Use sendBeacon for page unload scenarios
  if (useBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' });
    const success = navigator.sendBeacon(url, blob);
    return Promise.resolve(success);
  }

  // Use fetch for normal requests
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body,
    keepalive: true, // Allow request to outlive the page
  })
    .then((response) => response.ok)
    .catch(() => false);
}

/**
 * Create headers for Nadi API requests
 * @param apiKey - Sanctum personal access token for authentication
 * @param token - Application identifier token from Nadi dashboard
 * @param apiVersion - API version (default: 'v1')
 * @throws Error if apiKey or token is invalid
 */
export function createHeaders(
  apiKey: string,
  token: string,
  apiVersion: string = 'v1'
): Record<string, string> {
  // Defensive validation to catch misconfiguration early
  if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
    throw new Error('[Nadi] Cannot create request headers: apiKey is missing or invalid');
  }
  if (!token || token === 'undefined' || token === 'null') {
    throw new Error('[Nadi] Cannot create request headers: token is missing or invalid');
  }

  return {
    Authorization: `Bearer ${apiKey}`,
    'Nadi-App-Token': token,
    'Nadi-API-Version': apiVersion,
    'Content-Type': 'application/json',
  };
}

/**
 * Build full API URL
 */
export function buildUrl(baseUrl: string, endpoint: string): string {
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
}
