/** Server-Sent Events wire format and the recovery decision of a reconnecting client. Pure. */

export type SseMessage = {
	/** Name of the event. */
	event: string;
	/** Identifier of a persisted event; it becomes the client's `Last-Event-ID`. */
	id?: string;
	data: unknown;
	/** Reconnection delay suggested to the browser, in milliseconds. */
	retry?: number;
};

/** Encodes one message as an SSE frame. Newlines in the data are split into several `data:` lines. */
export function frame(message: SseMessage): string {
	const lines: string[] = [];
	if (message.retry !== undefined) lines.push(`retry: ${message.retry}`);
	if (message.id) lines.push(`id: ${message.id}`);
	lines.push(`event: ${message.event}`);
	for (const line of JSON.stringify(message.data).split('\n')) lines.push(`data: ${line}`);
	return `${lines.join('\n')}\n\n`;
}

/** Most events replayed after a reconnection; above this the client reloads the whole state. */
export const MAX_REPLAY = 500;

export type ResetReason =
	'too_many_events' | 'unknown_event_id' | 'server_restarted' | 'access_changed';

export type RecoveryPlan =
	{ kind: 'none' } | { kind: 'replay'; fromId: string } | { kind: 'reset'; reason: ResetReason };

/**
 * What to do when a client connects.
 * - No `Last-Event-ID`: the client has just loaded the snapshot; only new events follow.
 * - A known id: replay what came after it.
 * - An id the diary of this run does not contain: the client must reload everything.
 */
export function planRecovery(lastEventId: string | undefined, knownInRun: boolean): RecoveryPlan {
	if (!lastEventId) return { kind: 'none' };
	return knownInRun
		? { kind: 'replay', fromId: lastEventId }
		: { kind: 'reset', reason: 'unknown_event_id' };
}
