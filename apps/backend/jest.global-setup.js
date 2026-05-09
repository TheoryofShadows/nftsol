/**
 * Jest global setup - runs before jest-environment-node initializes.
 * Node 22+ exposes localStorage/sessionStorage as globals but they throw
 * SecurityError unless --localstorage-file is passed. Stub them out so the
 * jest environment iterator doesn't blow up.
 */
module.exports = async function globalSetup() {
  const noop = () => undefined;
  const storage = {
    getItem: noop,
    setItem: noop,
    removeItem: noop,
    clear: noop,
    key: noop,
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
};
