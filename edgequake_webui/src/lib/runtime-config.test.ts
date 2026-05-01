import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getRuntimeApiBaseUrl,
  getRuntimeConfig,
  getRuntimeServerBaseUrl,
} from './runtime-config';

const envKeys = [
  'EDGEQUAKE_API_URL',
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_AUTH_ENABLED',
  'NEXT_PUBLIC_DISABLE_DEMO_LOGIN',
] as const;

const originalEnv = new Map(envKeys.map((key) => [key, process.env[key]]));

function restoreEnv(): void {
  for (const key of envKeys) {
    const originalValue = originalEnv.get(key);
    if (originalValue === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalValue;
    }
  }
}

describe('runtime config', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    for (const key of envKeys) {
      delete process.env[key];
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    restoreEnv();
  });

  it('prefers browser-injected runtime config over env fallbacks', () => {
    process.env.EDGEQUAKE_API_URL = 'http://localhost:8080';
    process.env.NEXT_PUBLIC_AUTH_ENABLED = 'false';

    vi.stubGlobal('window', {
      __EDGEQUAKE_RUNTIME_CONFIG__: {
        apiUrl: 'http://49.12.69.73:8080/',
        authEnabled: true,
        disableDemoLogin: true,
      },
    });

    expect(getRuntimeConfig()).toEqual({
      apiUrl: 'http://49.12.69.73:8080',
      authEnabled: true,
      disableDemoLogin: true,
    });
  });

  it('uses EDGEQUAKE_API_URL at runtime and trims a trailing slash', () => {
    process.env.EDGEQUAKE_API_URL = 'http://49.12.69.73:8080/';

    expect(getRuntimeServerBaseUrl()).toBe('http://49.12.69.73:8080');
    expect(getRuntimeApiBaseUrl()).toBe('http://49.12.69.73:8080/api/v1');
  });

  it('falls back to relative API paths when no server URL is configured', () => {
    expect(getRuntimeServerBaseUrl()).toBe('');
    expect(getRuntimeApiBaseUrl()).toBe('/api/v1');
  });
});
