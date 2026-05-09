/**
 * Runs in each test worker before the test environment is set up.
 * Node 22+ exposes localStorage/sessionStorage as globals that throw
 * SecurityError unless --localstorage-file is passed. Stub them out.
 */
const storage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
  clear: () => undefined,
  key: () => null,
  length: 0,
};

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  enumerable: true,
  get: () => storage,
});

Object.defineProperty(globalThis, 'sessionStorage', {
  configurable: true,
  enumerable: true,
  get: () => storage,
});
