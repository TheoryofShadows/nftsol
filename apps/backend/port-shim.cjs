const net = require('node:net');
const cp  = require('node:child_process');
const path = require('node:path');
const SHIM = path.resolve(__filename);

// 1) redirect any server.listen(3002) to 3004
const originalListen = net.Server.prototype.listen;
net.Server.prototype.listen = function (...args) {
  const sec = Number(process.env.SECONDARY_PORT) || 3004;
  if (typeof args[0] === 'number' && args[0] === 3002) args[0] = sec;
  else if (typeof args[0] === 'object' && args[0] && args[0].port === 3002) args[0].port = sec;
  return originalListen.apply(this, args);
};

// 2) ensure all child Node procs also load this shim and prefer 3004 for admin/metrics
function ensureShim(env, cmd, argv) {
  env = env || process.env;
  env.SECONDARY_PORT  = env.SECONDARY_PORT  || '3004';
  env.ADMIN_PORT      = env.ADMIN_PORT      || env.SECONDARY_PORT;
  env.METRICS_PORT    = env.METRICS_PORT    || env.SECONDARY_PORT;
  env.MANAGEMENT_PORT = env.MANAGEMENT_PORT || env.SECONDARY_PORT;
  env.PORT2           = env.PORT2           || env.SECONDARY_PORT;
  env.HEALTH_PORT     = env.HEALTH_PORT     || env.SECONDARY_PORT;

  const isNode = /(^|[\\/])node(\.exe)?$/.test(cmd) ||
    (argv && argv[0] && /(^|[\\/])node(\.exe)?$/.test(argv[0]));

  if (isNode) {
    const a = Array.isArray(argv) ? argv.slice() : [];
    const already = a.includes('--require') && a.includes(SHIM);
    if (!already) a.unshift('--require', SHIM);
    return { env, argv: a };
  }
  return { env, argv };
}

const origSpawn = cp.spawn;
cp.spawn = function (cmd, argv, options = {}) {
  const { env, argv: a } = ensureShim(options.env, cmd, argv);
  return origSpawn.call(this, cmd, a, { ...options, env });
};

const origFork = cp.fork;
cp.fork = function (modulePath, args = [], options = {}) {
  const node = process.execPath;
  const { env, argv: a } = ensureShim(options.env, node, [node, modulePath, ...args]);
  return origFork.call(this, modulePath, a.filter(x => x !== node), { ...options, env });
};
