import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// We test getAuthScope by mocking window.location.pathname
// The function is exported from axios.js but depends on window.location

describe('getAuthScope', () => {
  let originalPathname;

  beforeEach(() => {
    originalPathname = window.location.pathname;
  });

  afterEach(() => {
    // Restore using pushState to avoid navigation
    window.history.pushState({}, '', originalPathname);
  });

  function setPath(path) {
    window.history.pushState({}, '', path);
  }

  // We import fresh each time because getAuthScope reads window.location at call time
  async function getScope() {
    const { getAuthScope } = await import('./axios.js');
    return getAuthScope();
  }

  it('returns corporate scope for /login path', async () => {
    setPath('/login');
    const scope = await getScope();
    expect(scope).toBe('corporate');
  });

  it('returns corporate scope for /corporate path', async () => {
    setPath('/corporate/dashboard');
    const scope = await getScope();
    expect(scope).toBe('corporate');
  });

  it('returns club scope for /portal path', async () => {
    setPath('/portal/my-club');
    const scope = await getScope();
    expect(scope).toBe('club');
  });

  it('returns club scope for /club path', async () => {
    setPath('/club/dashboard');
    const scope = await getScope();
    expect(scope).toBe('club');
  });

  it('returns club scope for /coach path', async () => {
    setPath('/coach/sessions');
    const scope = await getScope();
    expect(scope).toBe('club');
  });
});
