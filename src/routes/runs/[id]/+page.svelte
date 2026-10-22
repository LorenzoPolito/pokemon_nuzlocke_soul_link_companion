<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';

	let { data, form } = $props();

	let copied = $state(false);

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
	const statusLabel = (status: string) =>
		status === 'valid'
			? m.runs_invite_status_valid()
			: status === 'revoked'
				? m.runs_invite_status_revoked()
				: status === 'expired'
					? m.runs_invite_status_expired()
					: m.runs_invite_status_used();
	const confirmWith = (text: string) => (e: Event) => {
		if (!confirm(text)) e.preventDefault();
	};
	const copy = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
		} catch {
			// the link stays visible in the field to copy by hand
		}
	};
</script>

<h1>{data.run.name}</h1>
<p class="hint">
	{gameName}{s.difficulty ? ` · ${difficulty}` : ''} · {m.runs_created_on({
		date: new Date(data.run.createdAt).toLocaleDateString()
	})}
</p>

{#if data.role === 'spectator'}<p class="hint" role="note">{m.runs_spectator_banner()}</p>{/if}
{#if data.run.status !== 'active'}<p class="hint" role="note">{m.runs_ended_banner()}</p>{/if}
{#if form?.memberError}
	<p class="error" role="alert">
		{form.memberError === 'last_owner' ? m.runs_error_last_owner() : m.runs_error_member()}
	</p>
{/if}

<section>
	<h2>{m.runs_members()}</h2>
	<ul class="list">
		{#each data.run.members as member (member.id)}
			<li>
				<span>
					<strong>{member.name}</strong>
					<span class="hint">
						· {roleLabel(member.role)}{member.pending
							? ` · ${m.runs_pending()}`
							: ''}{member.role === 'owner' && member.seat === null
							? ` · ${m.runs_member_not_playing()}`
							: ''}
					</span>
				</span>
				{#if data.run.status === 'active'}
					<form method="post" action="?/member" class="actions">
						<input type="hidden" name="memberId" value={member.id} />
						{#if data.canManage && member.role !== 'owner'}
							{#if member.role === 'player'}
								<button class="button secondary" name="op" value="spectator"
									>{m.runs_member_make_spectator()}</button
								>
							{:else}
								<button class="button secondary" name="op" value="player"
									>{m.runs_member_make_player()}</button
								>
							{/if}
							{#if member.role === 'player' && !member.pending}
								<button
									class="button secondary"
									name="op"
									value="transfer"
									onclick={confirmWith(m.runs_member_transfer_confirm())}
									>{m.runs_member_transfer()}</button
								>
							{/if}
							<button
								class="button secondary"
								name="op"
								value="remove"
								onclick={confirmWith(m.runs_member_remove_confirm())}
								>{m.runs_member_remove()}</button
							>
						{/if}
						{#if member.userId === data.me && member.role !== 'owner'}
							<button
								class="button secondary"
								name="op"
								value="leave"
								onclick={confirmWith(m.runs_member_leave_confirm())}>{m.runs_member_leave()}</button
							>
						{/if}
					</form>
				{/if}
			</li>
		{/each}
	</ul>
</section>

{#if data.canManage}
	<section>
		<h2>{m.runs_invites()}</h2>
		<form method="post" action="?/invite" class="form">
			{#if form?.inviteError}<p class="error" role="alert">{m.runs_error_invite_form()}</p>{/if}
			<label class="field"
				>{m.runs_seat_role()}
				<select name="role">
					<option value="player">{m.runs_role_player()}</option>
					<option value="spectator">{m.runs_role_spectator()}</option>
				</select></label
			>
			<label class="field"
				>{m.runs_invite_seat_name()}<input name="seatName" maxlength="40" /></label
			>
			<label class="field"
				>{m.runs_invite_uses()}<input
					name="maxUses"
					type="number"
					min="1"
					max="20"
					value="1"
				/></label
			>
			<button class="button" type="submit">{m.runs_invite_create()}</button>
		</form>
		{#if form?.link}
			<p role="status">{m.runs_invite_link_once()}</p>
			<input class="link" readonly value={form.link} aria-label={m.runs_invites()} />
			<button class="button secondary" type="button" onclick={() => copy(form.link)}
				>{copied ? m.runs_copied() : m.runs_copy()}</button
			>
		{/if}
		<ul class="list">
			{#each data.invites as item (item.id)}
				<li>
					<span class="hint">
						{item.seatName ? `${item.seatName} · ` : ''}{m.runs_invite_row({
							role: roleLabel(item.role),
							used: item.uses,
							max: item.maxUses,
							date: new Date(item.expiresAt).toLocaleDateString()
						})} · {statusLabel(item.status)}
					</span>
					{#if item.status === 'valid'}
						<form method="post" action="?/revoke">
							<input type="hidden" name="inviteId" value={item.id} />
							<button class="button secondary" type="submit">{m.runs_invite_revoke()}</button>
						</form>
					{/if}
				</li>
			{/each}
		</ul>
	</section>
{/if}

<section>
	<h2>{m.runs_rules()}</h2>
	<ul>
		{#each rules as [label, value] (label)}
			<li>{label}: {onOff(value)}</li>
		{/each}
	</ul>
</section>

<a href={resolve('/')}>{m.runs_back()}</a>

<style>
	section {
		margin-bottom: var(--space-6);
	}

	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--space-2);
	}

	.list li {
		display: grid;
		gap: var(--space-2);
		padding: var(--space-3);
		border-radius: var(--radius-md);
		background: var(--color-surface-raised);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.link {
		width: 100%;
	}
</style>
