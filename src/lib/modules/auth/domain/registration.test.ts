import { describe, expect, it } from 'vitest';
import { decideRegistration, isRegistrationMode } from './registration';

describe('decideRegistration', () => {
	it('lets anyone in when open, even with a bad token', () => {
		expect(decideRegistration('open', 'none')).toBe('allow');
		expect(decideRegistration('open', 'invalid')).toBe('allow');
		expect(decideRegistration('open', 'valid')).toBe('allow');
	});

	it('needs a valid invite when on invitation', () => {
		expect(decideRegistration('invite', 'valid')).toBe('allow');
		expect(decideRegistration('invite', 'none')).toBe('invite_invalid');
		expect(decideRegistration('invite', 'invalid')).toBe('invite_invalid');
	});

	it('refuses everyone when closed, invite or not', () => {
		for (const invite of ['none', 'valid', 'invalid'] as const) {
			expect(decideRegistration('closed', invite)).toBe('registration_closed');
		}
	});

	it('recognises the three modes', () => {
		expect(['open', 'invite', 'closed'].every(isRegistrationMode)).toBe(true);
		expect(isRegistrationMode('everyone')).toBe(false);
	});
});
