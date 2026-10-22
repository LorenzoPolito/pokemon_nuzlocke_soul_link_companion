<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';

	let { data, form } = $props();

	const roleLabel = (role: string) =>
		role === 'owner'
			? m.runs_role_owner()
			: role === 'player'
				? m.runs_role_player()
				: m.runs_role_spectator();
	const onOff = (value: boolean) => (value ? m.runs_rules_on() : m.runs_rules_off());
	const errorText = (code: string) =>
		code === 'already_member'
			? m.runs_error_already_member()
			: code === 'run_not_active'
				? m.runs_error_run_not_active()
				: m.runs_error_invite_invalid();

	const gameName = (names: { en: string; it: string }) =>
		getLocale() === 'it' ? names.it : names.en;
</script>

<h1>{m.runs_invite_title()}</h1>

{#if data.state === 'invalid'}
	<p class="error" role="alert">{m.runs_invite_invalid()}</p>
{:else if data.state === 'app'}
	<p>{m.runs_invite_app()}</p>
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- resolve() plus the invitation token -->
	<a class="button" href={`${resolve('/register')}?invite=${data.token}`}
		>{m.runs_invite_register()}</a
	>
{:else}
	{@const preview = data.preview}
	<h2>{preview.runName}</h2>
	<p class="hint">
		{gameName(data.gameNames)}{preview.settings.difficulty
			? ` · ${
					preview.settings.difficulty === 'easy'
						? m.runs_difficulty_easy()
						: preview.settings.difficulty === 'challenge'
							? m.runs_difficulty_challenge()
							: m.runs_difficulty_normal()
				}`
			: ''}
	</p>
	<p>{m.runs_invite_as({ role: roleLabel(preview.role) })}</p>
	{#if preview.seatName}<p>{m.runs_invite_seat({ name: preview.seatName })}</p>{/if}

	<h2>{m.runs_members()}</h2>
	<ul>
		{#each preview.members as member (member.name + member.role)}
			<li>
				{member.name} · {roleLabel(member.role)}{member.pending ? ` · ${m.runs_pending()}` : ''}
			</li>
		{/each}
	</ul>

	<h2>{m.runs_rules()}</h2>
	<ul>
		<li>{m.runs_rule_dupes()}: {onOff(preview.settings.dupesClause)}</li>
		<li>{m.runs_rule_type()}: {onOff(preview.settings.typeClause)}</li>
		<li>{m.runs_rule_gifts()}: {onOff(preview.settings.separateGifts)}</li>
		<li>{m.runs_rule_rooms()}: {onOff(preview.settings.separateRooms)}</li>
		<li>{m.runs_rule_randomizer()}: {onOff(preview.settings.randomizer)}</li>
		<li>{m.runs_rule_calculator()}: {onOff(preview.settings.damageCalculator)}</li>
	</ul>

	{#if form?.error}<p class="error" role="alert">{errorText(form.error)}</p>{/if}
	{#if form?.declined}
		<p role="status">{m.runs_invite_declined()}</p>
	{:else if data.alreadyIn}
		<p role="status">{m.runs_invite_already()}</p>
		<a class="button" href={resolve('/runs/[id]', { id: data.alreadyIn })}>{m.runs_open_run()}</a>
	{:else if data.signedIn}
		<form method="post" action="?/accept" class="form">
			<button class="button" type="submit">{m.runs_invite_accept()}</button>
		</form>
		{#if preview.seatName}
			<form method="post" action="?/decline" class="form">
				<button class="button secondary" type="submit">{m.runs_invite_decline()}</button>
			</form>
		{/if}
	{:else}
		<p>
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- resolve() plus the way back to this invitation -->
			<a class="button" href={`${resolve('/login')}?next=/invite/${data.token}`}
				>{m.runs_invite_login()}</a
			>
		</p>
		<p>
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- resolve() plus the invitation token and the way back -->
			<a href={`${resolve('/register')}?invite=${data.token}&next=/invite/${data.token}`}
				>{m.runs_invite_register()}</a
			>
		</p>
	{/if}
{/if}

<style>
	.button {
		display: inline-flex;
		align-items: center;
		text-decoration: none;
	}
</style>
