import { json } from '@sveltejs/kit';

/** Liveness and readiness probe used by the container healthcheck. */
export const GET = () => json({ ok: true });
