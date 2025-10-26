"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClout = getClout;
exports.addClout = addClout;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dataDir = path_1.default.resolve(__dirname, '..', 'data');
const filePath = path_1.default.join(dataDir, 'clout.json');
function ensureFile() {
    if (!fs_1.default.existsSync(dataDir))
        fs_1.default.mkdirSync(dataDir, { recursive: true });
    if (!fs_1.default.existsSync(filePath))
        fs_1.default.writeFileSync(filePath, JSON.stringify({}), 'utf8');
}
function read() {
    ensureFile();
    try {
        const raw = fs_1.default.readFileSync(filePath, 'utf8');
        return JSON.parse(raw || '{}');
    }
    catch {
        return {};
    }
}
function write(map) {
    ensureFile();
    fs_1.default.writeFileSync(filePath, JSON.stringify(map, null, 2), 'utf8');
}
function getClout(wallet) {
    const map = read();
    return Number(map[wallet] || 0);
}
function addClout(wallet, delta) {
    const map = read();
    const cur = Number(map[wallet] || 0);
    const next = cur + Number(delta || 0);
    map[wallet] = next;
    write(map);
    return next;
}
