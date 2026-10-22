import { describe, expect, it } from 'vitest';
import { runSteps, STEPS, succeeded, type Step } from './verify.ts';

const step = (name: string, required = true, skip?: () => string | undefined): Step => ({
	name,
	command: 'x',
	args: [],
	required,
	skip
});
const runnerFor = (codes: Record<string, number>) => (s: Step) => ({ code: codes[s.name] ?? 0 });

describe('runSteps', () => {
	it('runs every step when all pass', () => {
		const steps = [step('a'), step('b')];
		const results = runSteps(steps, runnerFor({}));
		expect(results.map((r) => r.status)).toEqual(['passed', 'passed']);
		expect(succeeded(results, steps)).toBe(true);
	});

	it('stops at the first failing required step', () => {
		const steps = [step('a'), step('b'), step('c')];
		const results = runSteps(steps, runnerFor({ b: 1 }));
		expect(results.map((r) => [r.name, r.status])).toEqual([
			['a', 'passed'],
			['b', 'failed']
		]);
		expect(succeeded(results, steps)).toBe(false);
	});

	it('only warns for a failing step that is not required', () => {
		const steps = [step('a'), step('audit', false), step('z')];
		const results = runSteps(steps, runnerFor({ audit: 1 }));
		expect(results.map((r) => r.status)).toEqual(['passed', 'warned', 'passed']);
		expect(succeeded(results, steps)).toBe(true);
	});

	it('skips a step with a reason and does not run it', () => {
		const ran: string[] = [];
		const steps = [step('image', true, () => 'Docker is not available')];
		const results = runSteps(steps, (s) => (ran.push(s.name), { code: 0 }));
		expect(ran).toEqual([]);
		expect(results[0]).toMatchObject({ status: 'skipped', detail: 'Docker is not available' });
		expect(succeeded(results, steps)).toBe(true);
	});

	it('measures the time of each step', () => {
		let now = 0;
		const results = runSteps(
			[step('a')],
			() => ((now += 2500), { code: 0 }),
			() => now
		);
		expect(results[0]?.seconds).toBe(2.5);
	});
});

describe('the verification of the project', () => {
	it('covers lint, types, tests, build, image and a non-blocking audit', () => {
		expect(STEPS.map((s) => s.name)).toEqual([
			'lint',
			'types',
			'unit and integration tests',
			'app build',
			'system tests',
			'container image',
			'security audit (warning only)'
		]);
		expect(STEPS.find((s) => s.name.startsWith('security'))?.required).toBe(false);
		expect(STEPS.filter((s) => s.required)).toHaveLength(6);
	});
});
