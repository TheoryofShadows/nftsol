import fs from 'fs';
import path from 'path';

const dataDir = path.resolve(__dirname, '..', 'data');
const filePath = path.join(dataDir, 'clout.json');

type CloutMap = Record<string, number>;

function ensureFile() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify({}), 'utf8');
}

function read(): CloutMap {
  ensureFile();
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw || '{}') as CloutMap;
  } catch {
    return {};
  }
}

function write(map: CloutMap) {
  ensureFile();
  fs.writeFileSync(filePath, JSON.stringify(map, null, 2), 'utf8');
}

export function getClout(wallet: string): number {
  const map = read();
  return Number(map[wallet] || 0);
}

export function addClout(wallet: string, delta: number): number {
  const map = read();
  const cur = Number(map[wallet] || 0);
  const next = cur + Number(delta || 0);
  map[wallet] = next;
  write(map);
  return next;
}
