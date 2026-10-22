<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';

	let { data, form } = $props();

	const errorText = (code: string) =>
		({
			last_admin: m.admin_error_last_admin(),
			self: m.admin_error_self(),
			deleted: m.admin_error_deleted(),
			not_found: m.admin_error_not_found(),
			validation: m.auth_error_validation()
		})[code] ?? code;

	const modes = $derived([
		{ value: 'open', label: m.admin_mode_open() },
		{ value: 'invite', label: m.admin_mode_invite() },
		{ value: 'closed', label: m.admin_mode_closed() }
	] as const);

	const date = (ms: number) => new Date(ms).toLocaleDateString();
</script>

<h1>{m.admin_title()}</h1>

{#if data.insecure}
	<p class="error" role="alert">{m.admin_http_warning()}</p>
{/if}
{#if form?.error}<p class="error" role="alert">{errorText(form.error)}</p>{/if}

<section>
	<h2>{m.admin_registration()}</h2>
	<form method="post" action="?/mode" class="form">
		{#each modes as mode (mode.value)}
			<label class="choice"
				><input type="radio" name="mode" value={mode.value} checked={data.mode === mode.value} />
				{mode.label}</label
			>
		{/each}
		{#if form?.modeSaved}<p role="status">{m.profile_saved()}</p>{/if}
		<button class="button" type="submit">{m.profile_save()}</button>
	</form>
</section>

<section>
	<h2>{m.admin_invites()}</h2>
	<form method="post" action="?/invite" class="form">
		<label class="field"
			>{m.admin_invite_uses()}<input
				name="maxUses"
				type="number"
				min="1"
				max="100"
				value="1"
			/></label
		>
		<button class="button" type="submit">{m.admin_invite_create()}</button>
	</form>
	{#if form?.link}
		<p role="status">{m.admin_invite_once()}</p>
		<input class="link" readonly value={form.link} aria-label={m.admin_invite_link()} />
	{/if}
	<ul class="list">
		{#each data.invites as invite (invite.id)}
			<li>
				<span>
					{m.admin_invite_row({
						used: invite.uses,
						max: invite.maxUses,
						date: date(invite.expiresAt)
					})}
					{#if invite.revoked}· {m.admin_invite_revoked()}{:else if invite.expiresAt < data.now}· {m.admin_invite_expired()}{/if}
				</span>
				{#if !invite.revoked}
					<form method="post" action="?/revokeInvite">
						<input type="hidden" name="id" value={invite.id} />
						<button class="button secondary" type="submit">{m.admin_invite_revoke()}</button>
					</form>
				{/if}
			</li>
		{/each}
	</ul>
</section>

<section>
	<h2>{m.admin_users({ count: data.users.length })}</h2>
	{#if form?.temporaryPassword}
		<p class="error" role="status">
			{m.admin_temporary_password({ password: form.temporaryPassword })}
		</p>
	{/if}
	<ul class="list">
		{#each data.users as account (account.id)}
			<li>
				<span>
					<strong>{account.deleted ? m.admin_deleted_user() : account.name}</strong>
					{#if !account.deleted}<span class="hint"> {account.email}</span>{/if}
					<span class="hint">
						· {account.isAdmin ? m.admin_role_admin() : m.admin_role_user()} ·
						{account.deleted
							? m.admin_state_deleted()
							: account.disabled
								? m.admin_state_disabled()
								: m.admin_state_active()}
					</span>
				</span>
				{#if !account.deleted}
					<form method="post" action="?/user" class="actions">
						<input type="hidden" name="id" value={account.id} />
						<button class="button secondary" name="op" value="reset"
							>{m.admin_action_reset()}</button
						>
						<button
							class="button secondary"
							name="op"
							value={account.disabled ? 'enable' : 'disable'}
							>{account.disabled ? m.admin_action_enable() : m.admin_action_disable()}</button
						>
						<button
							class="button secondary"
							name="op"
							value={account.isAdmin ? 'demote' : 'promote'}
							>{account.isAdmin ? m.admin_action_demote() : m.admin_action_promote()}</button
						>
						<button class="button secondary" name="op" value="delete"
							>{m.admin_action_delete()}</button
						>
					</form>
				{/if}
			</li>
		{/each}
	</ul>
</section>

<section>
	<h2>{m.admin_data()}</h2>
	{#if data.pokedex}
		<p>
			{m.admin_pokedex({
				commit: data.pokedex.apiDataCommit.slice(0, 7),
				date: data.pokedex.generatedAt.slice(0, 10)
			})}
		</p>
	{:else}
		<p>{m.admin_pokedex_missing()}</p>
	{/if}
</section>

<style>
	section {
		margin-bottom: var(--space-6);
	}

	.choice {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-height: 48px;
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
