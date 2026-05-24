import { homedir } from 'node:os';
import { join } from 'node:path';

export const CONFIG_DIR = join(homedir(), '.was-meta-mcp');
export const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
