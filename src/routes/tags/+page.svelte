<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import Api from '$lib/api/api';
	import {
		Container,
		Row,
		Col,
		Button,
		Card,
		CardBody,
		CardHeader,
		Form,
		FormGroup,
		Input,
		Table
	} from 'sveltestrap';

	let tags = [];
	let loading = true;
	let error = '';
	let newTag = { title: '' };
	let editingTag = null;

	async function loadTags() {
		try {
			loading = true;
			tags = await Api.get('/tags');
		} catch (err: any) {
			error = err?.message || 'Failed to load tags';
		} finally {
			loading = false;
		}
	}

	async function createTag() {
		try {
			const createdTag = await Api.post('/tags', { tag: newTag });
			tags = [...tags, createdTag];
			newTag = { title: '' };
		} catch (err: any) {
			error = err?.message || 'Failed to create tag';
		}
	}

	async function updateTag(tag: Tag) {
		if (!tag) return;

		try {
			const updatedTag = await Api.put(`/tags/${tag.id}`, { tag });
			tags = tags.map((t) => (t.id === updatedTag.id ? updatedTag : t));
			editingTag = null;
		} catch (err: any) {
			error = err?.message || 'Failed to update tag';
		}
	}

	async function deleteTag(id: number) {
		if (!confirm('Are you sure you want to delete this tag?')) return;

		try {
			await Api.delete(`/tags/${id}`);
			tags = tags.filter((t) => t.id !== id);
		} catch (err: any) {
			error = err?.message || 'Failed to delete tag';
		}
	}

	onMount(loadTags);
</script>

<div class="wrapper" in:fade>
	<Container class="py-4">
		{#if error}
			<div class="alert alert-danger" role="alert">
				<p class="font-medium">{error}</p>
			</div>
		{/if}

		<Card class="mb-4">
			<CardHeader>
				<h2 class="mb-0">Create New Tag</h2>
			</CardHeader>
			<CardBody>
				<Form
					on:submit={(e) => {
						e.preventDefault();
						createTag();
					}}
				>
					<FormGroup>
						<Input type="text" bind:value={newTag.title} placeholder="Enter tag name..." required />
					</FormGroup>
					<Button type="submit" color="primary">Create Tag</Button>
				</Form>
			</CardBody>
		</Card>

		<Card>
			<CardHeader>
				<h2 class="mb-0">Tags</h2>
			</CardHeader>
			<CardBody>
				{#if loading}
					<div class="py-4 text-center">
						<div class="spinner-border text-primary" role="status">
							<span class="visually-hidden">Loading...</span>
						</div>
					</div>
				{:else if tags.length === 0}
					<p class="text-muted py-4 text-center">No tags found.</p>
				{:else}
					<Table striped hover responsive>
						<thead>
							<tr>
								<th>Name</th>
								<th>Created</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each tags as tag (tag.id)}
								<tr>
									<td>
										{#if editingTag?.id === tag.id}
											<Form
												class="d-flex gap-2"
												on:submit={(e) => {
													e.preventDefault();
													updateTag(editingTag);
												}}
											>
												<Input
													type="text"
													bind:value={editingTag.title}
													placeholder="Tag name"
													required
												/>
												<Button type="submit" color="success" size="sm">Save</Button>
												<Button color="secondary" size="sm" on:click={() => (editingTag = null)}>
													Cancel
												</Button>
											</Form>
										{:else}
											{tag.title}
										{/if}
									</td>
									<td>
										{new Date(tag.created_at).toLocaleDateString()}
									</td>
									<td>
										<div class="d-flex gap-2">
											<Button color="primary" size="sm" on:click={() => (editingTag = { ...tag })}>
												<i class="fa fa-edit" />
											</Button>
											<Button color="danger" size="sm" on:click={() => deleteTag(tag.id)}>
												<i class="fa fa-trash" />
											</Button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</Table>
				{/if}
			</CardBody>
		</Card>
	</Container>
</div>

<style>
	.wrapper {
		background: #fff;
		padding: 30px;
		border-radius: 10px;
		position: relative;
	}

	:global(.card) {
		border: none;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	:global(.card-header) {
		background-color: transparent;
		border-bottom: 1px solid #eee;
		padding: 1.5rem;
	}

	:global(.card-body) {
		padding: 1.5rem;
	}

	.gap-2 {
		gap: 0.5rem;
	}

	@media (max-width: 480px) {
		.wrapper {
			padding: 15px;
		}
	}
</style>
