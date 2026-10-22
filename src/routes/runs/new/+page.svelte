<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';

	let { data, form } = $props();

	const DRAFT_KEY = 'nuzlocke-new-run-draft';
	const DRAFT_TTL = 24 * 60 * 60 * 1000;

	let name = $state('');
	let gameId = $state('black');
	let difficulty = $state('normal');
	let rules = $state({
		dupesClause: true,
		typeClause: false,
		separateGifts: true,
		separateRooms: true,
		randomizer: false,
		damageCalculator: true
	});
	let restored = $state(false);
	let ready = false;

	const game = $derived(data.games.find((g) => g.id === gameId));
	const gameName = (names: { en: string; it: string }) =>
		getLocale() === 'it' ? names.it : names.en;

	// The draft stays in the browser for 24 hours (ADR 0002); nothing is saved on the server before "Create".
	onMount(() => {
		try {
			const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null');
			if (saved && Date.now() - saved.at < DRAFT_TTL) {
				name = saved.name ?? name;
				gameId = data.games.some((g) => g.id === saved.gameId) ? saved.gameId : gameId;
				difficulty = saved.difficulty ?? difficulty;
				rules = { ...rules, ...saved.rules };
				restored = true;
			}
		} catch {
			// no storage or a broken draft: start from the defaults
		}
		ready = true;
	});

	$effect(() => {
		const draft = { at: Date.now(), name, gameId, difficulty, rules: { ...rules } };
		if (!ready) return;
		try {
			localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
		} catch {
			// the draft is a convenience only
		}
	});

	const clearDraft = () => {
		try {
			localStorage.removeItem(DRAFT_KEY);
		} catch {
			// nothing to clear
		}
	};

	const ruleRows = $derived([
		{ id: 'dupesClause', label: m.runs_rule_dupes(), hint: m.runs_rule_dupes_hint() },
		{ id: 'typeClause', label: m.runs_rule_type(), hint: m.runs_rule_type_hint() },
		{ id: 'separateGifts', label: m.runs_rule_gifts(), hint: m.runs_rule_gifts_hint() },
		{ id: 'separateRooms', label: m.runs_rule_rooms(), hint: m.runs_rule_rooms_hint() },
		{ id: 'randomizer', label: m.runs_rule_randomizer(), hint: m.runs_rule_randomizer_hint() },
		{ id: 'damageCalculator', label: m.runs_rule_calculator(), hint: m.runs_rule_calculator_hint() }
	] as const);
</script>

<h1>{m.runs_create_title()}</h1>

<form method="post" class="form" onsubmit={clearDraft}>
	<input type="hidden" name="key" value={data.key} />
	{#if form?.error}
		<p class="error" role="alert">
			{form.error === 'difficulty' ? m.runs_error_difficulty() : m.runs_error_validation()}
		</p>
	{/if}
	{#if restored}<p class="hint" role="status">{m.runs_draft_restored()}</p>{/if}

	<label class="field"
		>{m.runs_name()}<input name="name" bind:value={name} maxlength="60" required /></label
	>
	<label class="field"
		>{m.runs_game()}
		<select name="gameId" bind:value={gameId}>
			{#each data.games as g (g.id)}
				<option value={g.id}>{gameName(g.names)}</option>
			{/each}
		</select></label
	>
	{#if game?.hasDifficulty}
		<label class="field"
			>{m.runs_difficulty()}
			<select name="difficulty" bind:value={difficulty}>
				<option value="easy">{m.runs_difficulty_easy()}</option>
				<option value="normal">{m.runs_difficulty_normal()}</option>
				<option value="challenge">{m.runs_difficulty_challenge()}</option>
			</select></label
		>
	{/if}

	<fieldset>
		<legend>{m.runs_rules()}</legend>
		<p class="hint">{m.runs_always_on()}</p>
		{#each ruleRows as rule (rule.id)}
			<label class="rule">
				<input type="checkbox" name={rule.id} bind:checked={rules[rule.id]} />
				<span>
					{rule.label}
					<span class="hint">{rule.hint}</span>
				</span>
			</label>
		{/each}
		<p class="hint">{m.runs_locked_notice()}</p>
	</fieldset>

	<button class="button" type="submit">{m.runs_create()}</button>
	<a href={resolve('/')}>{m.runs_back()}</a>
</form>

<style>
	fieldset {
		display: grid;
		gap: var(--space-2);
		margin: 0;
		padding: var(--space-3);
		border: 1px solid var(--color-outline);
		border-radius: var(--radius-md);
	}

	legend {
		padding: 0 var(--space-1);
		font-weight: 600;
	}

	.rule {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		min-height: 48px;
		padding: var(--space-2) 0;
	}

	.rule input {
		flex: none;
		width: 24px;
		min-height: 24px;
		height: 24px;
		margin-top: var(--space-1);
		padding: 0;
		accent-color: var(--color-primary);
	}

	.rule span {
		display: grid;
		gap: var(--space-1);
	}
</style>
