/** Names of the events of the stream (docs/progetto/16-Architettura-e-API.md, P2-10). */

/** Rows of the diary: they carry an `id` and can be recovered after a reconnection. */
export const PERSISTENT_EVENT_TYPES = [
	'run.created',
	'run.deleted',
	'run.restored',
	'run.settings_changed',
	'run.status_changed',
	'run.owner_changed',
	'levelcap.override_set',
	'member.joined',
	'member.declined',
	'member.role_changed',
	'member.removed',
	'group.created',
	'group.linked',
	'group.skipped',
	'group.moved',
	'group.died',
	'group.death_corrected',
	'encounter.recorded',
	'encounter.corrected',
	'encounter.deleted',
	'specimen.created',
	'specimen.updated',
	'specimen.evolved',
	'specimen.corrected',
	'milestone.reached',
	'milestone.revoked',
	'override.set',
	'override.cleared'
] as const;

/** Not stored: connection control, locks and conflict notices. */
export const EPHEMERAL_EVENT_TYPES = [
	'hello',
	'ping',
	'reset',
	'locks.snapshot',
	'lock.taken',
	'lock.renewed',
	'lock.released',
	'conflict.overwritten',
	'session.expired'
] as const;

export type PersistentEventType = (typeof PERSISTENT_EVENT_TYPES)[number];
export type EphemeralEventType = (typeof EPHEMERAL_EVENT_TYPES)[number];
export type StreamEventType = PersistentEventType | EphemeralEventType;

export const ALL_EVENT_TYPES: readonly StreamEventType[] = [
	...PERSISTENT_EVENT_TYPES,
	...EPHEMERAL_EVENT_TYPES
];
