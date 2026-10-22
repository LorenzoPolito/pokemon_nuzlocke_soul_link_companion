/**
 * The local verification (docs/progetto/04, decision 13): everything that must be green before a push.
 * Usage: npm run verify
 *
 * Steps, in order: lint (formatting, ESLint, translations), types, tests, app build, system tests
 * (when `tests/system` exists), container image (when Docker is available), then a security audit
 * that only warns. The first failing required step stops the run with a non-zero exit code.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

export type Step = {
	name: string;
	command: string;
	args: string[];
	/** A failure stops the verification. Warnings never do. */
	required: boolean;
	/** Why the step is not run, or `undefined` to run it. */
	skip?: () => string | undefined;
};

export type StepResult = {
	name: string;
	status: 'passed' | 'failed' | 'skipped' | 'warned';
	detail?: string;
	seconds: number;
};

export type Runner = (step: Step) => { code: number };

/** Runs the steps in order and stops at the first failing required one. */
export function runSteps(
	steps: Step[],
	runner: Runner,
	clock: () => number = Date.now
): StepResult[] {
	const results: StepResult[] = [];
	for (const step of steps) {
		const reason = step.skip?.();
		if (reason) {
			results.push({ name: step.name, status: 'skipped', detail: reason, seconds: 0 });
			continue;
		}
		const started = clock();
		const { code } = runner(step);
		const seconds = (clock() - started) / 1000;
		if (code === 0) results.push({ name: step.name, status: 'passed', seconds });
		else if (step.required) {
			results.push({ name: step.name, status: 'failed', seconds });
			break;
		} else
			results.push({ name: step.name, status: 'warned', detail: `exit code ${code}`, seconds });
	}
	return results;
}

/** True when every required step passed (skipped and warned steps do not count against it). */
export const succeeded = (results: StepResult[], steps: Step[]): boolean =>
	results.length === steps.length && results.every((r) => r.status !== 'failed');

const dockerAvailable = () => spawnSync('docker', ['info'], { stdio: 'ignore' }).status === 0;

export const STEPS: Step[] = [
	{ name: 'lint', command: 'npm', args: ['run', 'lint'], required: true },
	{ name: 'types', command: 'npm', args: ['run', 'check'], required: true },
	{ name: 'unit and integration tests', command: 'npm', args: ['test'], required: true },
	{ name: 'app build', command: 'npm', args: ['run', 'build'], required: true },
	{
		name: 'system tests',
		command: 'npm',
		args: ['run', 'test:system'],
		required: true,
		skip: () => (existsSync('tests/system') ? undefined : 'no system tests yet (arrive with P7-02)')
	},
	{
		name: 'container image',
		command: 'docker',
		// Environments behind a proxy can add options: VERIFY_DOCKERFILE and VERIFY_IMAGE_ARGS.
		args: [
			'build',
			...(process.env.VERIFY_DOCKERFILE ? ['-f', process.env.VERIFY_DOCKERFILE] : []),
			...(process.env.VERIFY_IMAGE_ARGS?.split(' ').filter(Boolean) ?? []),
			'-t',
			'nuzlocke-soullink-companion:verify',
			'.'
		],
		required: true,
		skip: () =>
			process.env.VERIFY_SKIP_IMAGE === '1'
				? 'VERIFY_SKIP_IMAGE=1'
				: dockerAvailable()
					? undefined
					: 'Docker is not available: the image was NOT verified'
	},
	{
		// A warning only: it needs the network and a new advisory must not block a push.
		name: 'security audit (warning only)',
		command: 'npm',
		args: ['audit', '--audit-level=high'],
		required: false
	}
];

const icon = {
	passed: 'ok     ',
	failed: 'FAILED ',
	skipped: 'skipped',
	warned: 'warning'
} as const;

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
	const results = runSteps(STEPS, (step) => {
		console.log(`\n=== ${step.name} ===`);
		return { code: spawnSync(step.command, step.args, { stdio: 'inherit' }).status ?? 1 };
	});
	console.log('\n=== verification ===');
	for (const r of results) {
		console.log(
			`${icon[r.status]}  ${r.name}${r.detail ? ` (${r.detail})` : ''}${r.seconds ? `  ${r.seconds.toFixed(1)} s` : ''}`
		);
	}
	const ok = succeeded(results, STEPS);
	console.log(ok ? '\nVerification passed.' : '\nVerification FAILED.');
	process.exit(ok ? 0 : 1);
}
