<script>
	import Api from '$lib/api/api';
	import { user } from '$lib/stores/user';
	import { sameUserId } from '$lib/questions/badgeCounts.js';

	export let question;
	export let onUpdated = (_q) => {};

	let reply = '';
	let saving = false;
	let error = '';
	let expanded = true;

	$: comments = question?.question_comments || [];
	$: canReply = !!$user && ($user.admin || sameUserId($user.id, question?.user_id));
	$: canResolve =
		!!question &&
		!question.resolved &&
		!!$user &&
		($user.admin || sameUserId($user.id, question.user_id));
	$: questionIsMine = sameUserId($user?.id, question?.user_id);

	function isMine(userId) {
		return sameUserId($user?.id, userId);
	}

	async function postReply() {
		const trimmed = (reply || '').trim();
		if (!trimmed || saving || !canReply) return;
		try {
			saving = true;
			error = '';
			const updated = await Api.post(`/questions/${question.id}/question_comments`, {
				question_comment: { body: trimmed }
			});
			reply = '';
			onUpdated(updated);
		} catch (err) {
			error =
				err?.response?.data?.errors?.join?.(', ') ||
				err?.response?.data?.error ||
				err?.message ||
				'Could not post reply.';
		} finally {
			saving = false;
		}
	}

	async function resolveQuestion() {
		if (saving || !canResolve) return;
		try {
			saving = true;
			error = '';
			const updated = await Api.post(`/questions/${question.id}/resolve`, {});
			onUpdated(updated);
		} catch (err) {
			error =
				err?.response?.data?.errors?.join?.(', ') ||
				err?.response?.data?.error ||
				err?.message ||
				'Could not resolve question.';
		} finally {
			saving = false;
		}
	}

	function formatWhen(iso) {
		if (!iso) return '';
		try {
			return new Date(iso).toLocaleString(undefined, {
				month: 'short',
				day: 'numeric',
				hour: 'numeric',
				minute: '2-digit'
			});
		} catch {
			return '';
		}
	}
</script>

<article class="thread" class:unresolved={!question.resolved} class:resolved={question.resolved}>
	<header class="head">
		<button type="button" class="toggle" on:click={() => (expanded = !expanded)}>
			<span class="chev" aria-hidden="true">{expanded ? '▾' : '▸'}</span>
			<span class="body-preview">{question.body}</span>
		</button>
		<div class="meta">
			{#if question.context_label && question.context_label !== 'General'}
				<span class="ctx">{question.context_label}</span>
			{/if}
			{#if question.resolved}
				<span class="badge resolved">Resolved</span>
			{:else}
				<span class="badge">Unresolved</span>
			{/if}
		</div>
	</header>

	{#if expanded}
		<div class="detail">
			<ul class="chat" aria-label="Conversation">
				<li class="row" class:mine={questionIsMine} class:theirs={!questionIsMine}>
					{#if !questionIsMine}
						<p class="who">
							{question.user_display_name || 'User'}
							{#if question.created_at}
								<span class="when">· {formatWhen(question.created_at)}</span>
							{/if}
						</p>
					{/if}
					<div class="bubble">
						<p class="c-body">{question.body}</p>
						{#if questionIsMine}
							<p class="who mine-meta">
								You
								{#if question.created_at}
									<span class="when">· {formatWhen(question.created_at)}</span>
								{/if}
							</p>
						{/if}
					</div>
				</li>

				{#each comments as c (c.id)}
					{@const mine = isMine(c.user_id)}
					<li class="row" class:mine class:theirs={!mine}>
						{#if !mine}
							<p class="who">
								{c.user_display_name || 'User'}
								{#if c.created_at}
									<span class="when">· {formatWhen(c.created_at)}</span>
								{/if}
							</p>
						{/if}
						<div class="bubble">
							<p class="c-body">{c.body}</p>
							{#if mine}
								<p class="who mine-meta">
									You
									{#if c.created_at}
										<span class="when">· {formatWhen(c.created_at)}</span>
									{/if}
								</p>
							{/if}
						</div>
					</li>
				{/each}
			</ul>

			{#if !comments.length}
				<p class="empty-c">No replies yet.</p>
			{/if}

			{#if canReply || canResolve}
				<form class="reply" on:submit|preventDefault={postReply}>
					{#if error}
						<p class="err" role="alert">{error}</p>
					{/if}
					{#if canReply}
						<textarea
							rows="2"
							placeholder="Write a reply…"
							bind:value={reply}
							disabled={saving}
						/>
					{/if}
					<div class="actions">
						{#if canReply}
							<button type="submit" disabled={saving || !(reply || '').trim()}>
								{saving ? 'Posting…' : 'Reply'}
							</button>
						{/if}
						{#if canResolve}
							<button
								type="button"
								class="resolve"
								disabled={saving}
								on:click={resolveQuestion}
							>
								Resolve
							</button>
						{/if}
					</div>
				</form>
			{/if}
		</div>
	{/if}
</article>

<style>
	.thread {
		border: 1px solid rgba(7, 65, 68, 0.12);
		border-radius: 10px;
		background: #fbfffe;
		overflow: hidden;
	}

	.thread.unresolved {
		border-color: rgba(245, 158, 11, 0.45);
	}

	.thread.resolved {
		border-color: rgba(7, 65, 68, 0.12);
	}

	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.5rem 0.75rem;
		padding: 0.75rem 0.85rem;
	}

	.toggle {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: flex-start;
		gap: 0.45rem;
		border: none;
		background: none;
		padding: 0;
		text-align: left;
		cursor: pointer;
		font: inherit;
		color: #071416;
	}

	.chev {
		flex-shrink: 0;
		color: #3a545c;
		line-height: 1.4;
	}

	.body-preview {
		font-family: GreyCliffCF-Regular, system-ui, sans-serif;
		font-size: 0.95rem;
		line-height: 1.4;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		align-items: center;
	}

	.ctx {
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: #0a5f63;
		background: rgba(10, 95, 99, 0.08);
		padding: 0.15rem 0.45rem;
		border-radius: 999px;
	}

	.badge {
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: #92400e;
		background: #fef3c7;
		padding: 0.15rem 0.45rem;
		border-radius: 999px;
	}

	.badge.resolved {
		color: #065f46;
		background: #d1fae5;
	}

	.detail {
		padding: 0.85rem 1.15rem 1.1rem;
		border-top: 1px solid rgba(7, 65, 68, 0.08);
	}

	.chat {
		list-style: none;
		margin: 0.35rem 0 1rem;
		padding: 0.35rem 0.35rem 0.15rem;
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}

	.row {
		display: flex;
		flex-direction: column;
		max-width: min(82%, 26rem);
	}

	.row.theirs {
		align-self: flex-start;
		align-items: flex-start;
		margin-right: 1.5rem;
	}

	.row.mine {
		align-self: flex-end;
		align-items: flex-end;
		margin-left: 1.5rem;
	}

	.who {
		margin: 0 0 0.3rem;
		padding: 0 0.35rem;
		font-size: 0.72rem;
		font-weight: 600;
		color: #3a545c;
	}

	.who.mine-meta {
		margin: 0.3rem 0 0;
		text-align: right;
		font-weight: 500;
		color: rgba(7, 65, 68, 0.65);
	}

	.when {
		font-weight: 500;
		opacity: 0.85;
	}

	.bubble {
		padding: 0.7rem 0.9rem;
		border-radius: 14px;
		max-width: 100%;
	}

	.row.theirs .bubble {
		background: #f3f6f5;
		border: 1px solid rgba(7, 65, 68, 0.1);
		border-bottom-left-radius: 4px;
	}

	.row.mine .bubble {
		background: #0a5f63;
		border: 1px solid #084a4d;
		border-bottom-right-radius: 4px;
	}

	.c-body {
		margin: 0;
		font-size: 0.92rem;
		line-height: 1.45;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.row.theirs .c-body {
		color: #071416;
	}

	.row.mine .c-body {
		color: #ffffff;
	}

	.row.theirs .who {
		color: #3a545c;
	}

	.row.mine .who.mine-meta {
		color: rgba(255, 255, 255, 0.85);
	}

	.empty-c {
		margin: 0 0 1rem;
		padding: 0 0.25rem;
		font-size: 0.88rem;
		color: #3a545c;
	}

	.reply {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
		margin-top: 0.15rem;
	}

	.reply textarea {
		width: 100%;
		box-sizing: border-box;
		padding: 0.5rem 0.65rem;
		border: 1px solid rgba(7, 65, 68, 0.18);
		border-radius: 8px;
		font: inherit;
		font-size: 0.9rem;
		color: #071416;
		background: #fff;
		resize: vertical;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.45rem;
	}

	.actions button {
		padding: 0.4rem 0.85rem;
		border: none;
		border-radius: 8px;
		background: #084a4d;
		color: #ffffff;
		font-weight: 700;
		font-size: 0.85rem;
		cursor: pointer;
	}

	.actions button.resolve {
		background: #fff;
		color: #084a4d;
		border: 1.5px solid #0a5f63;
	}

	.actions button.resolve:hover:not(:disabled) {
		background: rgba(10, 95, 99, 0.08);
	}

	.actions button:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.err {
		margin: 0;
		font-size: 0.85rem;
		color: #b02a37;
	}
</style>
