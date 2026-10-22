<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';

	let { data } = $props();

	const filters = $derived([
		{ value: 'all', label: m.runs_filter_all() },
		{ value: 'active', label: m.runs_filter_active() },
		{ value: 'ended', label: m.runs_filter_ended() }
	] as const);

	const statusLabel = (status: string) =>
		status === 'active'
			? m.runs_status_active()
			: status === 'lost'
				? m.runs_status_lost()
				: m.runs_status_completed();
	const roleLabel = (role: string) =>
		role === 'owner'
			? m.runs_role_owner()
			: role === 'player'
				? m.runs_role_player()
				: m.runs_role_spectator();
	const gameName = (id: string) => data.games[id]?.[getLocale() === 'it' ? 'it' : 'en'] ?? id;
</script>

<div class="head">
	<h1>{m.runs_title()}</h1>
	<a class="button" href={resolve('/runs/new')}>{m.runs_new()}</a>
</div>

<form class="filters" method="get" role="group" aria-label={m.runs_filter_label()}>
	{#each filters as f (f.value)}
		<button class="chip" name="filter" value={f.value} aria-pressed={data.filter === f.value}
			>{f.label}</button
		>
	{/each}
</form>

{#if data.runs.length === 0}
	<p>{data.filter === 'all' ? m.runs_empty() : m.runs_none_in_filter()}</p>
{:else}
	<ul class="list">
		{#each data.runs as item (item.id)}
			<li>
				<a class="card" href={resolve('/runs/[id]', { id: item.id })}>
					<strong>{item.name}</strong>
					<span class="hint">
						{gameName(item.gameId)} · {m.runs_players({ count: item.players })} · {statusLabel(
							item.status
						)} · {roleLabel(item.role)}{item.randomizer ? ` · ${m.runs_randomizer()}` : ''}
					</span>
					<span class="hint"
						>{m.runs_summary({
							badges: item.summary.badges,
							alive: item.summary.alive,
							dead: item.summary.dead
						})}</span
					>
				</a>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
	}

	.head .button {
		display: inline-flex;
		align-items: center;
		text-decoration: none;
	}

	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
	}

	.chip {
		display: inline-flex;
		align-items: center;
		min-height: 48px;
		padding: 0 var(--space-4);
		border: 1px solid var(--color-ink-muted);
		border-radius: var(--radius-full);
		background: transparent;
		color: var(--color-ink);
		font: inherit;
		cursor: pointer;
	}

	.chip[aria-pressed='true'] {
		background: var(--color-primary-container);
		border-color: transparent;
		color: var(--color-on-primary-container);
	}

	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--space-2);
	}

	.card {
		display: grid;
		gap: var(--space-1);
		padding: var(--space-3);
		border-radius: var(--radius-md);
		background: var(--color-surface-raised);
		color: var(--color-ink);
		text-decoration: none;
	}
</style>
