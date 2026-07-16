<script>
	import { onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Api from '$lib/api/api';

	export let user;
	export let history;
	export let removeHistory = () => {};

	let editor;
	let editorElement;
	let timer;
	let editorReady = false;

	const destroy = () => {
		removeHistory(history);
	};

	function scheduleSave(html) {
		clearTimeout(timer);
		timer = setTimeout(async () => {
			await Api.put('/skill_histories/' + history.id + '.json', { body: html });
			history.body = html;
		}, 800);
	}

	function initEditor() {
		if (!user?.admin || !editorElement || editor) return;

		editor = new Editor({
			element: editorElement,
			extensions: [StarterKit],
			content: history.body || '<p></p>',
			onUpdate: ({ editor: ed }) => {
				scheduleSave(ed.getHTML());
			}
		});
		editorReady = true;
	}

	$: if (editorElement) initEditor();

	onDestroy(() => {
		clearTimeout(timer);
		if (editor) {
			editor.destroy();
			editor = null;
		}
	});
</script>

<article class="post">
	{#if user && user.admin}
		<button type="button" class="delete" on:click={destroy} title="Delete history" aria-label="Delete">
			<span class="fa fa-trash" />
		</button>
		{#if editorReady && editor}
			<div class="editor-toolbar">
				<button
					type="button"
					class="toolbar-btn"
					class:active={editor.isActive('heading', { level: 1 })}
					on:click={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
				>
					H1
				</button>
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
					class:active={editor.isActive('heading', { level: 3 })}
					on:click={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
				>
					H3
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
				<button
					type="button"
					class="toolbar-btn"
					class:active={editor.isActive('blockquote')}
					on:click={() => editor.chain().focus().toggleBlockquote().run()}
				>
					<i class="fa fa-quote-left" />
				</button>
				<button
					type="button"
					class="toolbar-btn"
					on:click={() => editor.chain().focus().undo().run()}
				>
					<i class="fa fa-undo" />
				</button>
				<button
					type="button"
					class="toolbar-btn"
					on:click={() => editor.chain().focus().redo().run()}
				>
					<i class="fa fa-redo" />
				</button>
			</div>
		{/if}
		<div class="editor-content prose" bind:this={editorElement} />
	{:else}
		<div class="prose">
			{@html history.body}
		</div>
	{/if}
</article>

<style>
	.post {
		position: relative;
		background: #faf8f5;
		border: 1px solid rgba(15, 23, 42, 0.08);
		border-radius: 12px;
		padding: 1.75rem 2rem 2rem;
		margin-bottom: 1.5rem;
		box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
	}

	.delete {
		position: absolute;
		top: 0.85rem;
		right: 0.85rem;
		border: none;
		background: transparent;
		color: #b91c1c;
		cursor: pointer;
		padding: 0.35rem 0.45rem;
		border-radius: 6px;
		line-height: 1;
	}

	.delete:hover {
		background: rgba(185, 28, 28, 0.08);
	}

	.editor-toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-bottom: 0.85rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid rgba(15, 23, 42, 0.1);
	}

	.toolbar-btn {
		border: 1px solid rgba(15, 23, 42, 0.15);
		background: #fff;
		color: #334155;
		border-radius: 6px;
		padding: 0.3rem 0.55rem;
		font-size: 0.78rem;
		font-weight: 600;
		cursor: pointer;
		min-width: 2rem;
	}

	.toolbar-btn.active,
	.toolbar-btn:hover {
		background: #0f172a;
		border-color: #0f172a;
		color: #fff;
	}

	.editor-content {
		min-height: 12rem;
	}

	.editor-content :global(.ProseMirror) {
		outline: none;
		min-height: 12rem;
	}

	.prose,
	.editor-content :global(.ProseMirror) {
		font-family: GreyCliffCF-Regular, 'GreycliffCF-Regular', Georgia, 'Times New Roman', serif;
		font-size: 1.05rem;
		line-height: 1.7;
		color: #1e293b;
	}

	.prose :global(h1),
	.editor-content :global(.ProseMirror h1) {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.75rem;
		font-weight: 700;
		line-height: 1.25;
		margin: 0 0 0.85rem;
		color: #0f172a;
	}

	.prose :global(h2),
	.editor-content :global(.ProseMirror h2) {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.35rem;
		font-weight: 700;
		line-height: 1.3;
		margin: 1.5rem 0 0.65rem;
		color: #0f172a;
	}

	.prose :global(h3),
	.editor-content :global(.ProseMirror h3) {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.15rem;
		font-weight: 600;
		margin: 1.25rem 0 0.5rem;
		color: #1e293b;
	}

	.prose :global(p),
	.editor-content :global(.ProseMirror p) {
		margin: 0 0 1rem;
	}

	.prose :global(p:last-child),
	.editor-content :global(.ProseMirror p:last-child) {
		margin-bottom: 0;
	}

	.prose :global(ul),
	.prose :global(ol),
	.editor-content :global(.ProseMirror ul),
	.editor-content :global(.ProseMirror ol) {
		margin: 0 0 1rem;
		padding-left: 1.4rem;
	}

	.prose :global(li),
	.editor-content :global(.ProseMirror li) {
		margin-bottom: 0.35rem;
	}

	.prose :global(blockquote),
	.editor-content :global(.ProseMirror blockquote) {
		margin: 1rem 0;
		padding: 0.35rem 0 0.35rem 1rem;
		border-left: 3px solid #0f766e;
		color: #475569;
		font-style: italic;
	}

	.prose :global(strong),
	.editor-content :global(.ProseMirror strong) {
		font-weight: 700;
		color: #0f172a;
	}
</style>
