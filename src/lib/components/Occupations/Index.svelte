<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import Api from '$lib/api/api';
	import {
		Container,
		Button,
		Card,
		CardBody,
		CardHeader,
		Form,
		FormGroup,
		Input,
		Label,
		Table
	} from 'sveltestrap';

	let occupations = [];
	let loading = true;
	let error = '';

	const emptyForm = () => ({
		title: '',
		subtitle: '',
		description: '',
		average_salary_range: ''
	});

	let newOccupation = emptyForm();
	let editingId = null;
	let editForm = emptyForm();

	async function loadOccupations() {
		try {
			loading = true;
			error = '';
			occupations = await Api.get('/occupations');
		} catch (err) {
			error = err?.response?.data?.error || err?.message || 'Failed to load occupations';
		} finally {
			loading = false;
		}
	}

	async function createOccupation() {
		try {
			error = '';
			const created = await Api.post('/occupations', { occupation: newOccupation });
			occupations = [...occupations, created];
			newOccupation = emptyForm();
		} catch (err) {
			error = err?.response?.data?.error || err?.message || 'Failed to create occupation';
		}
	}

	function startEdit(occupation) {
		editingId = occupation.id;
		editForm = {
			title: occupation.title || '',
			subtitle: occupation.subtitle || '',
			description: occupation.description || '',
			average_salary_range: occupation.average_salary_range || ''
		};
	}

	async function updateOccupation() {
		try {
			error = '';
			const updated = await Api.put(`/occupations/${editingId}`, { occupation: editForm });
			occupations = occupations.map((o) => (o.id === updated.id ? updated : o));
			editingId = null;
		} catch (err) {
			error = err?.response?.data?.error || err?.message || 'Failed to update occupation';
		}
	}

	async function deleteOccupation(occupation) {
		if (occupation.cohort_users_count > 0) {
			error = 'Cannot delete occupation with enrolled cohort users';
			return;
		}
		if (!confirm('Delete this occupation?')) return;
		try {
			error = '';
			await Api.delete(`/occupations/${occupation.id}`);
			occupations = occupations.filter((o) => o.id !== occupation.id);
		} catch (err) {
			const apiErrors = err?.response?.data?.errors;
			error =
				(apiErrors && apiErrors.join(', ')) ||
				err?.response?.data?.error ||
				err?.message ||
				'Failed to delete occupation';
		}
	}

	onMount(loadOccupations);
</script>

<div class="wrapper" in:fade>
	<Container class="py-4">
		{#if error}
			<div class="alert alert-danger" role="alert">{error}</div>
		{/if}

		<Card class="mb-4">
			<CardHeader>
				<h2 class="mb-0">Create Occupation</h2>
			</CardHeader>
			<CardBody>
				<Form
					on:submit={(e) => {
						e.preventDefault();
						createOccupation();
					}}
				>
					<FormGroup>
						<Label>Title</Label>
						<Input type="text" bind:value={newOccupation.title} required />
					</FormGroup>
					<FormGroup>
						<Label>Subtitle</Label>
						<Input type="text" bind:value={newOccupation.subtitle} />
					</FormGroup>
					<FormGroup>
						<Label>Description</Label>
						<Input type="textarea" bind:value={newOccupation.description} />
					</FormGroup>
					<FormGroup>
						<Label>Average Salary Range</Label>
						<Input type="text" bind:value={newOccupation.average_salary_range} />
					</FormGroup>
					<Button type="submit" color="primary">Create Occupation</Button>
				</Form>
			</CardBody>
		</Card>

		<Card>
			<CardHeader>
				<h2 class="mb-0">Occupations</h2>
			</CardHeader>
			<CardBody>
				{#if loading}
					<div class="py-4 text-center">Loading…</div>
				{:else if occupations.length === 0}
					<p class="text-muted py-4 text-center">No occupations yet.</p>
				{:else}
					<Table striped hover responsive>
						<thead>
							<tr>
								<th>Title</th>
								<th>Salary Range</th>
								<th>Cohort Users</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each occupations as occupation (occupation.id)}
								<tr>
									{#if editingId === occupation.id}
										<td colspan="4">
											<Form
												on:submit={(e) => {
													e.preventDefault();
													updateOccupation();
												}}
											>
												<FormGroup>
													<Label>Title</Label>
													<Input type="text" bind:value={editForm.title} required />
												</FormGroup>
												<FormGroup>
													<Label>Subtitle</Label>
													<Input type="text" bind:value={editForm.subtitle} />
												</FormGroup>
												<FormGroup>
													<Label>Description</Label>
													<Input type="textarea" bind:value={editForm.description} />
												</FormGroup>
												<FormGroup>
													<Label>Average Salary Range</Label>
													<Input type="text" bind:value={editForm.average_salary_range} />
												</FormGroup>
												<div class="d-flex gap-2">
													<Button type="submit" color="success" size="sm">Save</Button>
													<Button
														type="button"
														color="secondary"
														size="sm"
														on:click={() => (editingId = null)}>Cancel</Button
													>
												</div>
											</Form>
										</td>
									{:else}
										<td>
											<strong>{occupation.title}</strong>
											{#if occupation.subtitle}
												<div class="text-muted small">{occupation.subtitle}</div>
											{/if}
										</td>
										<td>{occupation.average_salary_range || '—'}</td>
										<td>{occupation.cohort_users_count ?? 0}</td>
										<td>
											<div class="d-flex gap-2">
												<Button
													color="info"
													size="sm"
													on:click={() => goto(`/occupations/${occupation.id}`)}
												>
													Manage Skills
												</Button>
												<Button color="primary" size="sm" on:click={() => startEdit(occupation)}>
													Edit
												</Button>
												<Button
													color="danger"
													size="sm"
													disabled={occupation.cohort_users_count > 0}
													on:click={() => deleteOccupation(occupation)}
												>
													Delete
												</Button>
											</div>
										</td>
									{/if}
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
	}
	.gap-2 {
		gap: 0.5rem;
	}
</style>
