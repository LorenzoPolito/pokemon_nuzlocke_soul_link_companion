<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';

	let { data } = $props();

	const gameName = $derived(getLocale() === 'it' ? data.gameNames.it : data.gameNames.en);
	const roleLabel = (role: string) =>
		role === 'owner'
			? m.runs_role_owner()
			: role === 'player'
				? m.runs_role_player()
				: m.runs_role_spectator();
	const onOff = (value: boolean) => (value ? m.runs_rules_on() : m.runs_rules_off());
	const s = $derived(data.run.settings);
	const rules = $derived([
		[m.runs_rule_dupes(), s.dupesClause],
		[m.runs_rule_type(), s.typeClause],
		[m.runs_rule_gifts(), s.separateGifts],
		[m.runs_rule_rooms(), s.separateRooms],
		[m.runs_rule_randomizer(), s.randomizer],
		[m.runs_rule_calculator(), s.damageCalculator]
	] as const);
	const difficulty = $derived(
		s.difficulty === 'easy'
			? m.runs_difficulty_easy()
			: s.difficulty === 'challenge'
				? m.runs_difficulty_challenge()
				: m.runs_difficulty_normal()
	);
</script>

<h1>{data.run.name}</h1>
<p class="hint">
	{gameName}{s.difficulty ? ` · ${difficulty}` : ''} · {m.runs_created_on({
		date: new Date(data.run.createdAt).toLocaleDateString()
	})}
</p>

{#if data.role === 'spectator'}<p class="hint" role="note">{m.runs_spectator_banner()}</p>{/if}
{#if data.run.status !== 'active'}<p class="hint" role="note">{m.runs_ended_banner()}</p>{/if}

<section>
	<h2>{m.runs_members()}</h2>
	<ul>
		{#each data.run.members as member (member.id)}
			<li>
				{member.name} · {roleLabel(member.role)}{member.pending ? ` · ${m.runs_pending()}` : ''}
			</li>
		{/each}
	</ul>
</section>

<section>
	<h2>{m.runs_rules()}</h2>
	<ul>
		{#each rules as [label, value] (label)}
			<li>{label}: {onOff(value)}</li>
		{/each}
	</ul>
</section>

<a href={resolve('/')}>{m.runs_back()}</a>
