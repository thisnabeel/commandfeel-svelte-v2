<script>
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Api from '$lib/api/api';

	export let occupationSkillId;
	export let onNotePresence = (_id, _hasNote) => {};

	const dispatch = createEventDispatcher();

	let loading = true;
	let error = '';
	let note = null;
	let saving = false;
	let editor;
	let editorElement;
	let editorReady = false;
	let timer;

	function noteHasContent(body) {
		if (!body || typeof body !== 'string') return false;
		return body.replace(/<[^>]*>/g, '').trim().length > 0;
	}

	function emitPresence(body) {
		const hasNote = noteHasContent(body);
		onNotePresence(occupationSkillId, hasNote);
		dispatch('presence', {
			occupationSkillId,
			hasNote
		});
	}

	async function load() {
		loading = true;
		error = '';
		try {
			note = await Api.get(
				`/occupation_skills/${occupationSkillId}/occupation_skill_user_notes.json`
			);
			emitPresence(note?.body);
		} catch (err) {
			error = err?.response?.data?.error || err?.message || 'Failed to load notes';
		} finally {
			loading = false;
		}
	}

	async function upsert(html) {
		saving = true;
		try {
			if (note?.id) {
				note = await Api.put(`/occupation_skill_user_notes/${note.id}.json`, { body: html });
			} else {
				note = await Api.post(
					`/occupation_skills/${occupationSkillId}/occupation_skill_user_notes.json`,
					{ body: html }
				);
			}
			emitPresence(html);
		} catch (err) {
			error = err?.response?.data?.error || err?.message || 'Failed to save notes';
		} finally {
			saving = false;
		}
	}

	function scheduleSave(html) {
		clearTimeout(timer);
		timer = setTimeout(() => upsert(html), 800);
	}

	function initEditor() {
		if (loading || !editorElement || editor) return;

		editor = new Editor({
			element: editorElement,
			extensions: [StarterKit],
			content: note?.body || '<p></p>',
			onUpdate: ({ editor: ed }) => {
				scheduleSave(ed.getHTML());
			}
		});
		editorReady = true;
	}

	$: if (!loading && editorElement) initEditor();

	onMount(load);

	onDestroy(() => {
		clearTimeout(timer);
		if (editor) {
			editor.destroy();
			editor = null;
		}
	});
</script>

<div class="my-notes">
	{#if loading}
		<p class="status">Loading notes…</p>
	{:else if error && !editorReady}
		<p class="status error">{error}</p>
	{:else}
		{#if editorReady && editor}
			<div class="editor-toolbar">
				<button
					type="button"
					class="toolbar-btn"
					class:active={editor.isActive('heading', { level: 2 })}
					on:click={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
				>
					H2
				</button>
				<button
					type="button"
					class="toolbar-btn"
					class:active={editor.isActive('bold')}
					on:click={() => editor.chain().focus().toggleBold().run()}
				>
					<i class="fa fa-bold" />
				</button>
				<button
					type="button"
					class="toolbar-btn"
					class:active={editor.isActive('italic')}
					on:click={() => editor.chain().focus().toggleItalic().run()}
				>
					<i class="fa fa-italic" />
				</button>
				<button
					type="button"
					class="toolbar-btn"
					class:active={editor.isActive('bulletList')}
					on:click={() => editor.chain().focus().toggleBulletList().run()}
				>
					<i class="fa fa-list-ul" />
				</button>
				<button
					type="button"
					class="toolbar-btn"
					class:active={editor.isActive('orderedList')}
					on:click={() => editor.chain().focus().toggleOrderedList().run()}
				>
					<i class="fa fa-list-ol" />
				</button>
			</div>
		{/if}
		<div class="editor-content" bind:this={editorElement} />
		{#if error}
			<p class="status error">{error}</p>
		{/if}
		<p class="save-hint" class:saving>{saving ? 'Saving…' : 'Notes save automatically'}</p>
	{/if}
</div>

<style>
	.my-notes {
		padding: 0.15rem 0 0.25rem;
	}

	.status {
		margin: 0;
		font-family: GreyCliffCF-Regular, 'GreycliffCF-Regular', system-ui, sans-serif;
		font-size: 0.9rem;
		color: #64748b;
	}

	.status.error {
		color: #b91c1c;
		margin-top: 0.4rem;
	}

	.editor-toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
		margin-bottom: 0.65rem;
	}

	.toolbar-btn {
		border: 1px solid rgba(15, 118, 110, 0.2);
		background: #fff;
		color: #334155;
		border-radius: 6px;
		padding: 0.28rem 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		min-width: 1.85rem;
	}

	.toolbar-btn.active,
	.toolbar-btn:hover {
		background: #0f172a;
		border-color: #0f172a;
		color: #fff;
	}

	.editor-content {
		min-height: 8rem;
		padding: 0.85rem 1rem;
		border-radius: 10px;
		background: #faf8f5;
		border: 1px solid rgba(15, 118, 110, 0.14);
	}

	.editor-content :global(.ProseMirror) {
		outline: none;
		min-height: 7rem;
		font-family: GreyCliffCF-Regular, 'GreycliffCF-Regular', Georgia, serif;
		font-size: 0.95rem;
		line-height: 1.6;
		color: #1e293b;
	}

	.editor-content :global(.ProseMirror p) {
		margin: 0 0 0.65rem;
	}

	.editor-content :global(.ProseMirror p:last-child) {
		margin-bottom: 0;
	}

	.save-hint {
		margin: 0.45rem 0 0;
		font-family: 'Space Grotesk', sans-serif;
		font-size: 0.72rem;
		font-weight: 500;
		letter-spacing: 0.03em;
		color: #94a3b8;
	}

	.save-hint.saving {
		color: #0f766e;
	}
</style>
