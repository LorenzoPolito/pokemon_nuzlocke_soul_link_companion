import { randomBytes } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The secret that signs sessions: `AUTH_SECRET` when set, otherwise a random one generated
 * on first start and kept in `<dataDir>/auth-secret` (readable by the owner only), so a
 * default installation needs no configuration.
 */
export function loadAuthSecret(configured: string | undefined, dataDir: string): string {
	if (configured) return configured;
	const file = join(dataDir, 'auth-secret');
	if (existsSync(file)) return readFileSync(file, 'utf8').trim();
	mkdirSync(dataDir, { recursive: true });
	const secret = randomBytes(48).toString('base64url');
	writeFileSync(file, `${secret}\n`, { mode: 0o600 });
	chmodSync(file, 0o600);
	return secret;
}
