<script>
	import { onMount, onDestroy } from 'svelte';
	import { slide } from 'svelte/transition';
	import Api from '$lib/api/api';
	import { user } from '$lib/stores/user';
	import Swal from 'sweetalert2';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';

	export let element;
	export let elementType;

	let scripts = [];
	let loading = true;
	let error = '';
	let editingScriptId = null;
	let editForm = {
		title: '',
		linkedin_body: '',
		tiktok_body: '',
		youtube_title: '',
		youtube_body: '',
		body: ''
	};
	let editor;
	let editorElement;
	let activeTab = 'linkedin';

	onMount(async () => {
		await fetchScripts();
	});

	onDestroy(() => {
		if (editor) {
			editor.destroy();
		}
	});

	async function fetchScripts() {
		try {
			const response = await Api.get(`/${elementType.toLowerCase()}/${element.id}/scripts`);
			scripts = response;
			loading = false;
		} catch (err) {
			error = err?.message || 'Failed to fetch scripts';
			loading = false;
		}
	}

	function startEditing(script) {
		editingScriptId = script.id;
		editForm = {
			title: script.title,
			linkedin_body: script.linkedin_body || '',
			tiktok_body: script.tiktok_body || '',
			youtube_title: script.youtube_title || '',
			youtube_body: script.youtube_body || '',
			body: script.body || ''
		};

		// Initialize editor after DOM is updated
		setTimeout(() => {
			const content =
				activeTab === 'linkedin'
					? script.linkedin_body
					: activeTab === 'tiktok'
						? script.tiktok_body
						: activeTab === 'youtube'
							? script.youtube_body
							: activeTab === 'video'
								? script.body
								: '';

			editor = new Editor({
				element: editorElement,
				extensions: [StarterKit],
				content: content,
				onUpdate: ({ editor }) => {
					const html = editor.getHTML();
					if (activeTab === 'linkedin') editForm.linkedin_body = html;
					else if (activeTab === 'tiktok') editForm.tiktok_body = html;
					else if (activeTab === 'youtube') editForm.youtube_body = html;
					else if (activeTab === 'video') editForm.body = html;
				}
			});
		}, 0);
	}

	function switchTab(tab) {
		activeTab = tab;
		if (editor && editingScriptId) {
			const content =
				tab === 'linkedin'
					? editForm.linkedin_body
					: tab === 'tiktok'
						? editForm.tiktok_body
						: tab === 'youtube'
							? editForm.youtube_body
							: tab === 'video'
								? editForm.body
								: '';
			editor.commands.setContent(content);
		}
	}

	function cancelEditing() {
		if (editor) {
			editor.destroy();
			editor = null;
		}
		editingScriptId = null;
		editForm = {
			title: '',
			linkedin_body: '',
			tiktok_body: '',
			youtube_title: '',
			youtube_body: '',
			body: ''
		};
	}

	async function updateScript(scriptId) {
		try {
			await Api.patch(`/scripts/${scriptId}`, {
				script: editForm
			});
			await fetchScripts();
			if (editor) {
				editor.destroy();
				editor = null;
			}
			editingScriptId = null;
			Swal.fire({
				icon: 'success',
				title: 'Script updated successfully',
				toast: true,
				position: 'top-end',
				showConfirmButton: false,
				timer: 3000
			});
		} catch (err) {
			Swal.fire({
				icon: 'error',
				title: 'Failed to update script',
				text: err?.message || 'An error occurred',
				toast: true,
				position: 'top-end',
				showConfirmButton: false,
				timer: 3000
			});
		}
	}

	async function deleteScript(scriptId) {
		const result = await Swal.fire({
			title: 'Are you sure?',
			text: "You won't be able to revert this!",
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, delete it!'
		});

		if (result.isConfirmed) {
			try {
				await Api.delete(`/scripts/${scriptId}`);
				await fetchScripts();
				Swal.fire({
					icon: 'success',
					title: 'Script deleted successfully',
					toast: true,
					position: 'top-end',
					showConfirmButton: false,
					timer: 3000
				});
			} catch (err) {
				Swal.fire({
					icon: 'error',
					title: 'Failed to delete script',
					text: err?.message || 'An error occurred',
					toast: true,
					position: 'top-end',
					showConfirmButton: false,
					timer: 3000
				});
			}
		}
	}
</script>

<div class="scripts-container">
	{#if error}
		<div class="alert alert-danger" role="alert">
			{error}
		</div>
	{/if}

	{#if loading}
		<div class="loading">Loading scripts...</div>
	{:else if scripts.length > 0}
		<div class="scripts-list">
			{#each scripts as script}
				<div class="script-card">
					<div class="script-header">
						<h3>{script.title}</h3>
						{#if $user?.admin}
							<div class="script-actions">
								<button
									class="btn btn-sm btn-outline-primary"
									on:click={() => startEditing(script)}
								>
									<i class="fa fa-edit" />
								</button>
								<button
									class="btn btn-sm btn-outline-danger"
									on:click={() => deleteScript(script.id)}
								>
									<i class="fa fa-trash" />
								</button>
							</div>
						{/if}
					</div>

					{#if editingScriptId === script.id}
						<div class="edit-form" transition:slide>
							<div class="form-group">
								<label for="title">Title</label>
								<input
									type="text"
									class="form-control"
									id="title"
									bind:value={editForm.title}
									placeholder="Script title"
								/>
							</div>

							<div class="social-tabs">
								<button
									class="tab-btn"
									class:active={activeTab === 'video'}
									on:click={() => switchTab('video')}
								>
									<i class="fa fa-video" /> Video Script
								</button>
								<button
									class="tab-btn"
									class:active={activeTab === 'linkedin'}
									on:click={() => switchTab('linkedin')}
								>
									<i class="fab fa-linkedin" /> LinkedIn
								</button>
								<button
									class="tab-btn"
									class:active={activeTab === 'tiktok'}
									on:click={() => switchTab('tiktok')}
								>
									<i class="fab fa-tiktok" /> TikTok
								</button>
								<button
									class="tab-btn"
									class:active={activeTab === 'youtube'}
									on:click={() => switchTab('youtube')}
								>
									<i class="fab fa-youtube" /> YouTube
								</button>
							</div>

							{#if activeTab === 'youtube'}
								<div class="form-group">
									<label for="youtube_title">YouTube Title</label>
									<input
										type="text"
										class="form-control"
										id="youtube_title"
										bind:value={editForm.youtube_title}
										placeholder="YouTube video title"
									/>
								</div>
							{/if}

							<div class="form-group">
								<label for="body">Content</label>
								{#if editor}
									<div class="editor-toolbar">
										<button
											class="toolbar-btn"
											class:active={editor.isActive('heading', { level: 1 })}
											on:click={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
										>
											H1
										</button>
										<button
											class="toolbar-btn"
											class:active={editor.isActive('heading', { level: 2 })}
											on:click={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
										>
											H2
										</button>
										<button
											class="toolbar-btn"
											class:active={editor.isActive('bold')}
											on:click={() => editor.chain().focus().toggleBold().run()}
										>
											<i class="fa fa-bold" />
										</button>
										<button
											class="toolbar-btn"
											class:active={editor.isActive('italic')}
											on:click={() => editor.chain().focus().toggleItalic().run()}
										>
											<i class="fa fa-italic" />
										</button>
										<button
											class="toolbar-btn"
											class:active={editor.isActive('bulletList')}
											on:click={() => editor.chain().focus().toggleBulletList().run()}
										>
											<i class="fa fa-list-ul" />
										</button>
										<button
											class="toolbar-btn"
											class:active={editor.isActive('orderedList')}
											on:click={() => editor.chain().focus().toggleOrderedList().run()}
										>
											<i class="fa fa-list-ol" />
										</button>
										<button
											class="toolbar-btn"
											class:active={editor.isActive('code')}
											on:click={() => editor.chain().focus().toggleCode().run()}
										>
											<i class="fa fa-code" />
										</button>
										<button
											class="toolbar-btn"
											on:click={() => editor.chain().focus().undo().run()}
										>
											<i class="fa fa-undo" />
										</button>
										<button
											class="toolbar-btn"
											on:click={() => editor.chain().focus().redo().run()}
										>
											<i class="fa fa-redo" />
										</button>
									</div>
								{/if}
								<div class="editor-content" bind:this={editorElement} />
							</div>
							<div class="edit-actions">
								<button class="btn btn-secondary" on:click={cancelEditing}>Cancel</button>
								<button class="btn btn-primary" on:click={() => updateScript(script.id)}>
									Save Changes
								</button>
							</div>
						</div>
					{:else}
						<div class="social-tabs">
							<button
								class="tab-btn"
								class:active={activeTab === 'video'}
								on:click={() => switchTab('video')}
							>
								<i class="fa fa-video" /> Video Script
							</button>
							<button
								class="tab-btn"
								class:active={activeTab === 'linkedin'}
								on:click={() => switchTab('linkedin')}
							>
								<i class="fab fa-linkedin" /> LinkedIn
							</button>
							<button
								class="tab-btn"
								class:active={activeTab === 'tiktok'}
								on:click={() => switchTab('tiktok')}
							>
								<i class="fab fa-tiktok" /> TikTok
							</button>
							<button
								class="tab-btn"
								class:active={activeTab === 'youtube'}
								on:click={() => switchTab('youtube')}
							>
								<i class="fab fa-youtube" /> YouTube
							</button>
						</div>

						<div class="script-content">
							{#if activeTab === 'video'}
								<div class="content">
									{@html script.body || 'No video script content yet.'}
								</div>
							{:else if activeTab === 'linkedin'}
								<div class="content">
									{@html script.linkedin_body || 'No LinkedIn content yet.'}
								</div>
							{:else if activeTab === 'tiktok'}
								<div class="content">
									{@html script.tiktok_body || 'No TikTok content yet.'}
								</div>
							{:else if activeTab === 'youtube'}
								{#if script.youtube_title}
									<h4 class="youtube-title">{script.youtube_title}</h4>
								{/if}
								<div class="content">
									{@html script.youtube_body || 'No YouTube content yet.'}
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<div class="empty-state">
			<h3>No Scripts Available</h3>
			<p>Scripts generated from abstractions will appear here.</p>
		</div>
	{/if}
</div>

<style>
	.scripts-container {
		padding: 1rem;
	}

	.scripts-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.script-card {
		background: white;
		border-radius: 8px;
		padding: 1.5rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		transition: transform 0.2s;
		width: 100%;
	}

	.script-card:hover {
		transform: translateY(-2px);
	}

	.script-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
	}

	.script-header h3 {
		margin: 0;
		color: #333;
		font-size: 1.25rem;
	}

	.script-actions {
		display: flex;
		gap: 0.5rem;
	}

	.social-tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
		border-bottom: 1px solid #eee;
		padding-bottom: 0.5rem;
	}

	.tab-btn {
		padding: 0.5rem 1rem;
		border: none;
		background: none;
		cursor: pointer;
		border-radius: 4px;
		color: #666;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.tab-btn:hover {
		background: #f8f9fa;
		color: #333;
	}

	.tab-btn.active {
		background: #e9ecef;
		color: #007bff;
		font-weight: 500;
	}

	.youtube-title {
		margin: 0 0 1rem;
		color: #333;
		font-size: 1.1rem;
	}

	.script-content {
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 4px;
	}

	.content {
		color: #666;
		font-size: 1rem;
		line-height: 1.6;
	}

	.content :global(p) {
		margin-bottom: 1rem;
	}

	.content :global(h1),
	.content :global(h2),
	.content :global(h3),
	.content :global(h4),
	.content :global(h5),
	.content :global(h6) {
		margin: 1.5rem 0 1rem;
		color: #333;
	}

	.content :global(ul),
	.content :global(ol) {
		margin-bottom: 1rem;
		padding-left: 1.5rem;
	}

	.content :global(li) {
		margin-bottom: 0.5rem;
	}

	.content :global(pre),
	.content :global(code) {
		background: #f5f5f5;
		padding: 0.2em 0.4em;
		border-radius: 3px;
		font-family: monospace;
	}

	.editor-toolbar {
		display: flex;
		gap: 0.25rem;
		padding: 0.5rem;
		background: #f8f9fa;
		border: 1px solid #ddd;
		border-bottom: none;
		border-radius: 4px 4px 0 0;
	}

	.toolbar-btn {
		padding: 0.5rem;
		background: none;
		border: 1px solid transparent;
		border-radius: 4px;
		cursor: pointer;
		color: #666;
		font-size: 0.9rem;
	}

	.toolbar-btn:hover {
		background: #e9ecef;
		color: #333;
	}

	.toolbar-btn.active {
		background: #e9ecef;
		color: #007bff;
		border-color: #ddd;
	}

	.editor-content {
		border: 1px solid #ddd;
		border-radius: 0 0 4px 4px;
		padding: 1rem;
		min-height: 200px;
	}

	.editor-content :global(.ProseMirror) {
		outline: none;
	}

	.editor-content :global(.ProseMirror p) {
		margin: 0.5rem 0;
	}

	.edit-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
		margin-top: 1rem;
	}

	.loading {
		text-align: center;
		padding: 3rem;
		color: #666;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		background: #f8f9fa;
		border-radius: 8px;
		color: #666;
	}

	.empty-state h3 {
		margin: 0 0 0.5rem;
		color: #333;
	}

	.empty-state p {
		margin: 0;
	}

	@media (max-width: 640px) {
		.scripts-container {
			padding: 0.5rem;
		}

		.script-card {
			padding: 1rem;
		}

		.social-tabs {
			flex-wrap: wrap;
		}

		.tab-btn {
			flex: 1;
			justify-content: center;
		}

		.editor-toolbar {
			flex-wrap: wrap;
		}
	}
</style>
