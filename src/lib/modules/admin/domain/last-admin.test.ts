import { describe, expect, it } from 'vitest';
import { leavesNoAdmin, type AccountSummary } from './last-admin';

const admin = (id: string, disabled = false): AccountSummary => ({ id, isAdmin: true, disabled });
const user = (id: string): AccountSummary => ({ id, isAdmin: false, disabled: false });

describe('leavesNoAdmin', () => {
	it('protects the only administrator', () => {
		expect(leavesNoAdmin([admin('a'), user('u')], 'a')).toBe(true);
	});

	it('allows the change when another active administrator remains', () => {
		expect(leavesNoAdmin([admin('a'), admin('b')], 'a')).toBe(false);
	});

	it('does not count a disabled administrator as a remaining one', () => {
		expect(leavesNoAdmin([admin('a'), admin('b', true)], 'a')).toBe(true);
	});

	it('never blocks a change to a regular account', () => {
		expect(leavesNoAdmin([admin('a'), user('u')], 'u')).toBe(false);
		expect(leavesNoAdmin([admin('a')], 'missing')).toBe(false);
	});
});
