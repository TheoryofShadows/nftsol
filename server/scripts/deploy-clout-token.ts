<<<<<<< HEAD
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export function deployCLOUTToken() {
  const module = require('../../scripts/deploy-clout-token.js') as {
    deployCLOUTToken?: () => Promise<unknown>;
  };

  if (typeof module.deployCLOUTToken !== 'function') {
    throw new Error('deployCLOUTToken export not found in scripts/deploy-clout-token.js');
  }

  return module.deployCLOUTToken();
}

=======
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export function deployCLOUTToken() {
  const module = require('../../scripts/deploy-clout-token.js') as {
    deployCLOUTToken?: () => Promise<unknown>;
  };

  if (typeof module.deployCLOUTToken !== 'function') {
    throw new Error('deployCLOUTToken export not found in scripts/deploy-clout-token.js');
  }

  return module.deployCLOUTToken();
}

>>>>>>> 9d48334 (Refine wallet flow and fix TypeScript build)
