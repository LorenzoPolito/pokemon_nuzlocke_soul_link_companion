import type { AccessPolicy } from '../application/hub';

/**
 * Who may follow which run. The run tables (and so the members) arrive with the tracker
 * (phase 4, P4-02), where this reads `run_member`; until then no run exists, so nobody may follow one.
 */
export const noRunsYet: AccessPolicy = { canStream: async () => false };
