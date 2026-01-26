import type { DeviceInfo } from './types';

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `sess_${timestamp}_${randomPart}`;
}

/**
 * Generate a unique device ID and persist it
 */
export function getDeviceId(): string {
  const storageKey = 'nadi_device_id';

  try {
    let deviceId = localStorage.getItem(storageKey);
    if (!deviceId) {
      deviceId = `dev_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem(storageKey, deviceId);
    }
    return deviceId;
  } catch {
    // localStorage not available
    return `dev_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 15)}`;
  }
}

/**
 * Detect browser information
 */
export function getBrowserInfo(): { name: string; version: string } {
  const ua = navigator.userAgent;

  const browsers: { name: string; regex: RegExp }[] = [
    { name: 'Chrome', regex: /Chrome\/(\d+)/ },
    { name: 'Firefox', regex: /Firefox\/(\d+)/ },
    { name: 'Safari', regex: /Version\/(\d+).*Safari/ },
    { name: 'Edge', regex: /Edg\/(\d+)/ },
    { name: 'Opera', regex: /OPR\/(\d+)/ },
    { name: 'IE', regex: /MSIE (\d+)/ },
  ];

  for (const browser of browsers) {
    const match = ua.match(browser.regex);
    if (match) {
      return { name: browser.name, version: match[1] };
    }
  }

  return { name: 'Unknown', version: '0' };
}

/**
 * Detect operating system
 */
export function getOSInfo(): { name: string; version: string } {
  const ua = navigator.userAgent;

  if (/Windows NT 10/.test(ua)) return { name: 'Windows', version: '10' };
  if (/Windows NT 6.3/.test(ua)) return { name: 'Windows', version: '8.1' };
  if (/Windows NT 6.2/.test(ua)) return { name: 'Windows', version: '8' };
  if (/Windows NT 6.1/.test(ua)) return { name: 'Windows', version: '7' };
  if (/Mac OS X (\d+[._]\d+)/.test(ua)) {
    const match = ua.match(/Mac OS X (\d+[._]\d+)/);
    return { name: 'macOS', version: match ? match[1].replace('_', '.') : '' };
  }
  if (/Android (\d+)/.test(ua)) {
    const match = ua.match(/Android (\d+)/);
    return { name: 'Android', version: match ? match[1] : '' };
  }
  if (/iPhone OS (\d+)/.test(ua)) {
    const match = ua.match(/iPhone OS (\d+)/);
    return { name: 'iOS', version: match ? match[1] : '' };
  }
  if (/Linux/.test(ua)) return { name: 'Linux', version: '' };

  return { name: 'Unknown', version: '' };
}

/**
 * Detect device type
 */
export function getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  const ua = navigator.userAgent;

  if (/Tablet|iPad/i.test(ua)) return 'tablet';
  if (/Mobile|Android|iPhone/i.test(ua)) return 'mobile';
  return 'desktop';
}

/**
 * Get connection type if available
 */
export function getConnectionType(): string | undefined {
  const connection =
    (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
  return connection?.effectiveType;
}

/**
 * Get complete device information
 */
export function getDeviceInfo(): DeviceInfo {
  const browser = getBrowserInfo();
  const os = getOSInfo();

  return {
    browser: browser.name,
    browserVersion: browser.version,
    os: os.name,
    osVersion: os.version,
    deviceType: getDeviceType(),
    connectionType: getConnectionType(),
    screenWidth: typeof screen !== 'undefined' ? screen.width : undefined,
    screenHeight: typeof screen !== 'undefined' ? screen.height : undefined,
  };
}

/**
 * Get current page URL
 */
export function getPageUrl(): string {
  return typeof window !== 'undefined' ? window.location.href : '';
}

/**
 * Extract route pattern from URL (removes query params and IDs)
 */
export function getRoutePattern(): string {
  if (typeof window === 'undefined') return '';

  const path = window.location.pathname;
  // Replace numeric IDs with :id
  return path.replace(/\/\d+/g, '/:id');
}

/**
 * Simple debounce function
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Check if we should sample this event
 */
export function shouldSample(sampleRate: number): boolean {
  return Math.random() < sampleRate;
}
