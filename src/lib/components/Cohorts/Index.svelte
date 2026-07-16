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
		Collapse,
		Form,
		FormGroup,
		Input,
		Label,
		Table
	} from 'sveltestrap';

	let cohorts = [];
	let occupations = [];
	let loading = true;
	let error = '';
	let createOpen = false;
	let editingId = null;
	let slotsCohortId = null;
	let slots = [];
	let slotsLoading = false;
	let slotsError = '';
	let newSlotOccupationId = '';
	let assignEmails = {};
	let enteringCohortId = null;

	const emptyForm = () => ({
		title: '',
		subtitle: '',
		description: '',
		video_url: '',
		start_date: '',
		end_date: '',
		seed_sprints_count: 6
	});

	let newCohort = emptyForm();
	let editForm = emptyForm();
	let editingSprints = [];
	let sprintBusyId = null;

	function parseDate(value) {
		if (!value) return null;
		const d = new Date(`${value}T12:00:00`);
		return Number.isNaN(d.getTime()) ? null : d;
	}

	function monthDay(d) {
		return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
	}

	function fullDate(d) {
		return d.toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatDateRange(start, end) {
		const a = parseDate(start);
		const b = parseDate(end);
		if (a && b) {
			if (a.getFullYear() === b.getFullYear()) {
				return {
					kind: 'sameYear',
					months: `${monthDay(a)} – ${monthDay(b)}`,
					year: String(a.getFullYear())
				};
			}
			return { kind: 'crossYear', text: `${fullDate(a)} – ${fullDate(b)}` };
		}
		if (a) return { kind: 'single', text: fullDate(a) };
		if (b) return { kind: 'single', text: fullDate(b) };
		return { kind: 'empty', text: '—' };
	}

	function sprintNodesFor(sprints) {
		const list = Array.isArray(sprints) ? sprints : [];
		return list.map((s, i) => ({
			id: s.id,
			n: String(s.position ?? i + 1).padStart(2, '0'),
			label: `Sprint ${s.position ?? i + 1}`,
			active: !!s.active,
			goal: s.goal || ''
		}));
	}

	function replaceCohortSprints(cohortId, sprints) {
		cohorts = cohorts.map((c) =>
			c.id === cohortId
				? { ...c, cohort_sprints: sprints, sprints_count: sprints.length }
				: c
		);
		if (editingId === cohortId) editingSprints = sprints.map((s) => ({ ...s }));
	}

	function apiError(err, fallback) {
		return (
			err?.response?.data?.error ||
			err?.response?.data?.errors?.join?.(', ') ||
			(Array.isArray(err?.response?.data?.errors)
				? err.response.data.errors.join(', ')
				: null) ||
			err?.message ||
			fallback
		);
	}

	async function loadCohorts() {
		try {
			loading = true;
			error = '';
			cohorts = await Api.get('/cohorts');
		} catch (err) {
			error = apiError(err, 'Failed to load cohorts');
		} finally {
			loading = false;
		}
	}

	async function loadOccupations() {
		try {
			occupations = await Api.get('/occupations');
		} catch (err) {
			error = apiError(err, 'Failed to load occupations');
		}
	}

	async function createCohort() {
		try {
			error = '';
			const payload = {
				title: newCohort.title,
				subtitle: newCohort.subtitle,
				description: newCohort.description,
				video_url: newCohort.video_url,
				start_date: newCohort.start_date,
				end_date: newCohort.end_date,
				seed_sprints_count: newCohort.seed_sprints_count
			};
			const created = await Api.post('/cohorts', { cohort: payload });
			cohorts = [created, ...cohorts];
			newCohort = emptyForm();
			createOpen = false;
		} catch (err) {
			error = apiError(err, 'Failed to create cohort');
		}
	}

	function startEdit(cohort) {
		editingId = cohort.id;
		editForm = {
			title: cohort.title || '',
			subtitle: cohort.subtitle || '',
			description: cohort.description || '',
			video_url: cohort.video_url || '',
			start_date: cohort.start_date || '',
			end_date: cohort.end_date || ''
		};
		editingSprints = (cohort.cohort_sprints || []).map((s) => ({ ...s }));
	}

	async function updateCohort() {
		try {
			error = '';
			const payload = {
				title: editForm.title,
				subtitle: editForm.subtitle,
				description: editForm.description,
				video_url: editForm.video_url,
				start_date: editForm.start_date,
				end_date: editForm.end_date
			};
			const updated = await Api.put(`/cohorts/${editingId}`, { cohort: payload });
			cohorts = cohorts.map((c) => (c.id === updated.id ? updated : c));
			editingId = null;
			editingSprints = [];
		} catch (err) {
			error = apiError(err, 'Failed to update cohort');
		}
	}

	async function activateSprint(sprint) {
		try {
			sprintBusyId = sprint.id;
			error = '';
			const sprints = await Api.post(`/cohort_sprints/${sprint.id}/activate`, {});
			replaceCohortSprints(sprint.cohort_id || editingId, sprints);
		} catch (err) {
			error = apiError(err, 'Failed to activate sprint');
		} finally {
			sprintBusyId = null;
		}
	}

	async function saveSprintGoal(sprint) {
		try {
			sprintBusyId = sprint.id;
			error = '';
			const updated = await Api.put(`/cohort_sprints/${sprint.id}`, {
				cohort_sprint: { goal: sprint.goal || '' }
			});
			const cohortId = updated.cohort_id || editingId;
			const current =
				cohorts.find((c) => c.id === cohortId)?.cohort_sprints || editingSprints;
			const next = current.map((s) => (s.id === updated.id ? updated : s));
			replaceCohortSprints(cohortId, next);
		} catch (err) {
			error = apiError(err, 'Failed to update sprint goal');
		} finally {
			sprintBusyId = null;
		}
	}

	async function addSprint() {
		if (!editingId) return;
		try {
			error = '';
			const created = await Api.post(`/cohorts/${editingId}/cohort_sprints`, {
				cohort_sprint: { goal: '' }
			});
			const current = cohorts.find((c) => c.id === editingId)?.cohort_sprints || [];
			replaceCohortSprints(editingId, [...current, created]);
		} catch (err) {
			error = apiError(err, 'Failed to add sprint');
		}
	}

	async function removeSprint(sprint) {
		if (!confirm('Delete this sprint?')) return;
		try {
			sprintBusyId = sprint.id;
			error = '';
			const sprints = await Api.delete(`/cohort_sprints/${sprint.id}`);
			replaceCohortSprints(sprint.cohort_id || editingId, sprints);
		} catch (err) {
			error = apiError(err, 'Failed to delete sprint');
		} finally {
			sprintBusyId = null;
		}
	}

	async function deleteCohort(id) {
		if (!confirm('Delete this cohort?')) return;
		try {
			error = '';
			await Api.delete(`/cohorts/${id}`);
			cohorts = cohorts.filter((c) => c.id !== id);
			if (slotsCohortId === id) {
				slotsCohortId = null;
				slots = [];
			}
		} catch (err) {
			error = apiError(err, 'Failed to delete cohort');
		}
	}

	async function toggleSlots(cohortId) {
		if (slotsCohortId === cohortId) {
			slotsCohortId = null;
			slots = [];
			return;
		}
		slotsCohortId = cohortId;
		newSlotOccupationId = '';
		await loadSlots(cohortId);
	}

	async function openDashboard(cohortId) {
		try {
			enteringCohortId = cohortId;
			error = '';
			await Api.post(`/cohorts/${cohortId}/enter_as_admin`);
			await goto(`/cohorts/${cohortId}/dashboard`);
		} catch (err) {
			error = apiError(err, 'Failed to open cohort dashboard');
		} finally {
			enteringCohortId = null;
		}
	}

	async function loadSlots(cohortId) {
		try {
			slotsLoading = true;
			slotsError = '';
			slots = await Api.get(`/cohort_users?cohort_id=${cohortId}`);
		} catch (err) {
			slotsError = apiError(err, 'Failed to load slots');
			slots = [];
		} finally {
			slotsLoading = false;
		}
	}

	async function createSlot() {
		if (!newSlotOccupationId || !slotsCohortId) return;
		try {
			slotsError = '';
			const created = await Api.post('/cohort_users', {
				cohort_user: {
					cohort_id: slotsCohortId,
					occupation_id: Number(newSlotOccupationId)
				}
			});
			slots = [...slots, created];
			newSlotOccupationId = '';
		} catch (err) {
			slotsError = apiError(err, 'Failed to create slot');
		}
	}

	async function acceptSlot(slot) {
		try {
			slotsError = '';
			const updated = await Api.put(`/cohort_users/${slot.id}`, {
				intent: 'accept',
				cohort_user: {}
			});
			slots = slots.map((s) => (s.id === updated.id ? updated : s));
		} catch (err) {
			slotsError = apiError(err, 'Failed to accept application');
		}
	}

	async function assignSlot(slot) {
		const email = (assignEmails[slot.id] || '').trim();
		if (!email) {
			slotsError = 'Enter a user email to assign';
			return;
		}
		try {
			slotsError = '';
			const updated = await Api.put(`/cohort_users/${slot.id}`, {
				intent: 'assign',
				cohort_user: { email }
			});
			slots = slots.map((s) => (s.id === updated.id ? updated : s));
			assignEmails = { ...assignEmails, [slot.id]: '' };
		} catch (err) {
			slotsError = apiError(err, 'Failed to assign user');
		}
	}

	async function clearSlot(slot) {
		if (!confirm('Clear this seat back to open?')) return;
		try {
			slotsError = '';
			const updated = await Api.put(`/cohort_users/${slot.id}`, {
				intent: 'clear',
				cohort_user: {}
			});
			slots = slots.map((s) => (s.id === updated.id ? updated : s));
		} catch (err) {
			slotsError = apiError(err, 'Failed to clear seat');
		}
	}

	async function deleteSlot(slot) {
		if (!confirm('Delete this slot?')) return;
		try {
			slotsError = '';
			await Api.delete(`/cohort_users/${slot.id}`);
			slots = slots.filter((s) => s.id !== slot.id);
		} catch (err) {
			slotsError = apiError(err, 'Failed to delete slot');
		}
	}

	onMount(async () => {
		await Promise.all([loadCohorts(), loadOccupations()]);
	});
</script>

<svelte:head>
	<link
		href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="wrapper" in:fade>
	<Container class="py-4">
		{#if error}
			<div class="alert alert-danger" role="alert">{error}</div>
		{/if}

		<Card class="mb-4">
			<CardHeader
				class="create-toggle"
				role="button"
				tabindex="0"
				aria-expanded={createOpen}
				on:click={() => (createOpen = !createOpen)}
				on:keydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						createOpen = !createOpen;
					}
				}}
			>
				<h2 class="mb-0 d-flex justify-content-between align-items-center">
					<span>Create Cohort</span>
					<span class="toggle-hint">{createOpen ? '−' : '+'}</span>
				</h2>
			</CardHeader>
			<Collapse isOpen={createOpen}>
				<CardBody>
					<Form
						on:submit={(e) => {
							e.preventDefault();
							createCohort();
						}}
					>
						<FormGroup>
							<Label>Title</Label>
							<Input type="text" bind:value={newCohort.title} required />
						</FormGroup>
						<FormGroup>
							<Label>Subtitle</Label>
							<Input type="text" bind:value={newCohort.subtitle} />
						</FormGroup>
						<FormGroup>
							<Label>Description</Label>
							<Input type="textarea" bind:value={newCohort.description} />
						</FormGroup>
						<FormGroup>
							<Label>Video URL</Label>
							<Input type="url" bind:value={newCohort.video_url} />
						</FormGroup>
						<FormGroup>
							<Label>Start Date</Label>
							<Input type="date" bind:value={newCohort.start_date} />
						</FormGroup>
						<FormGroup>
							<Label>End Date</Label>
							<Input type="date" bind:value={newCohort.end_date} />
						</FormGroup>
					<FormGroup>
						<Label>Initial sprints</Label>
						<Input
							type="number"
							bind:value={newCohort.seed_sprints_count}
							min="1"
							max="24"
						/>
						<small class="text-muted">Creates this many sprints; the first is active.</small>
					</FormGroup>
					<Button type="submit" color="primary">Create Cohort</Button>
					</Form>
				</CardBody>
			</Collapse>
		</Card>

		<section class="cohorts-section">
			<h2 class="section-title">Cohorts</h2>
			{#if loading}
				<div class="py-4 text-center">Loading…</div>
			{:else if cohorts.length === 0}
				<p class="text-muted py-4 text-center">No cohorts yet.</p>
			{:else}
				<div class="cohort-cards">
					{#each cohorts as cohort (cohort.id)}
						{@const dateDisplay = formatDateRange(cohort.start_date, cohort.end_date)}
						{@const sprintNodes = sprintNodesFor(cohort.cohort_sprints)}
						<article class="seat-card">
							{#if editingId === cohort.id}
								<div class="edit-panel">
									<Form
										on:submit={(e) => {
											e.preventDefault();
											updateCohort();
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
											<Label>Video URL</Label>
											<Input type="url" bind:value={editForm.video_url} />
										</FormGroup>
										<FormGroup>
											<Label>Start Date</Label>
											<Input type="date" bind:value={editForm.start_date} />
										</FormGroup>
										<FormGroup>
											<Label>End Date</Label>
											<Input type="date" bind:value={editForm.end_date} />
										</FormGroup>
										<div class="d-flex gap-2 mb-3">
											<Button type="submit" color="success" size="sm">Save</Button>
											<Button
												type="button"
												color="secondary"
												size="sm"
												on:click={() => {
													editingId = null;
													editingSprints = [];
												}}>Cancel</Button
											>
										</div>
									</Form>

									<div class="sprint-editor">
										<div class="sprint-editor-head">
											<h4>Sprints</h4>
											<Button type="button" color="primary" size="sm" on:click={addSprint}>
												Add sprint
											</Button>
										</div>
										{#each editingSprints as sprint (sprint.id)}
											<div class="sprint-row" class:active={sprint.active}>
												<div class="sprint-row-top">
													<span class="sprint-pos">
														{String(sprint.position).padStart(2, '0')}
													</span>
													{#if sprint.active}
														<span class="active-badge">Active</span>
													{:else}
														<Button
															type="button"
															color="secondary"
															size="sm"
															disabled={sprintBusyId === sprint.id}
															on:click={() => activateSprint(sprint)}
														>
															Set active
														</Button>
													{/if}
													{#if editingSprints.length > 1}
														<button
															type="button"
															class="icon-btn danger sm"
															title="Delete sprint"
															aria-label="Delete sprint"
															disabled={sprintBusyId === sprint.id}
															on:click={() => removeSprint(sprint)}
														>
															<i class="fa fa-trash" aria-hidden="true" />
														</button>
													{/if}
												</div>
												<Label class="mb-1">Goal</Label>
												<Input
													type="textarea"
													rows="2"
													value={sprint.goal || ''}
													on:input={(e) => {
														editingSprints = editingSprints.map((s) =>
															s.id === sprint.id
																? { ...s, goal: e.currentTarget.value }
																: s
														);
													}}
												/>
												<Button
													type="button"
													color="success"
													size="sm"
													class="mt-2"
													disabled={sprintBusyId === sprint.id}
													on:click={() =>
														saveSprintGoal(
															editingSprints.find((s) => s.id === sprint.id)
														)}
												>
													Save goal
												</Button>
											</div>
										{/each}
									</div>
								</div>
							{:else}
								<div class="seat-top">
									<div class="seat-copy">
										<p class="seat-kicker">Cohort</p>
										<h3 class="cohort-name">{cohort.title || 'Untitled cohort'}</h3>
										{#if cohort.subtitle}
											<p class="cohort-sub">{cohort.subtitle}</p>
										{/if}
									</div>
									<div class="card-actions">
										<button
											type="button"
											class="icon-btn"
											title="Edit cohort"
											aria-label="Edit cohort"
											on:click={() => startEdit(cohort)}
										>
											<i class="fa fa-pencil" aria-hidden="true" />
										</button>
										<button
											type="button"
											class="icon-btn danger"
											title="Delete cohort"
											aria-label="Delete cohort"
											on:click={() => deleteCohort(cohort.id)}
										>
											<i class="fa fa-trash" aria-hidden="true" />
										</button>
									</div>
								</div>

								{#if dateDisplay.kind !== 'empty'}
									<div class="seat-foot">
										<div class="stat dates-stat">
											<span class="stat-label">Dates</span>
											{#if dateDisplay.kind === 'sameYear'}
												<span class="stat-value date-months">{dateDisplay.months}</span>
												<span class="date-year">{dateDisplay.year}</span>
											{:else}
												<span class="stat-value">{dateDisplay.text}</span>
											{/if}
										</div>
										<div class="foot-actions">
											<button
												type="button"
												class="slots-btn primary"
												disabled={enteringCohortId === cohort.id}
												on:click={() => openDashboard(cohort.id)}
											>
												{enteringCohortId === cohort.id ? 'Opening…' : 'Open dashboard'}
											</button>
											<button
												type="button"
												class="slots-btn"
												on:click={() => toggleSlots(cohort.id)}
											>
												{slotsCohortId === cohort.id ? 'Hide slots' : 'Manage slots'}
											</button>
										</div>
									</div>
								{:else}
									<div class="seat-foot">
										<div class="foot-actions">
											<button
												type="button"
												class="slots-btn primary"
												disabled={enteringCohortId === cohort.id}
												on:click={() => openDashboard(cohort.id)}
											>
												{enteringCohortId === cohort.id ? 'Opening…' : 'Open dashboard'}
											</button>
											<button
												type="button"
												class="slots-btn"
												on:click={() => toggleSlots(cohort.id)}
											>
												{slotsCohortId === cohort.id ? 'Hide slots' : 'Manage slots'}
											</button>
										</div>
									</div>
								{/if}

								{#if sprintNodes.length}
									<div class="sprint-band" aria-label="{sprintNodes.length} sprints">
										<p class="sprint-kicker">Sprints</p>
										<div class="track">
											{#each sprintNodes as sprint, i}
												<div class="node" class:is-active={sprint.active}>
													<span class="node-n">{sprint.n}</span>
													<span class="node-label">{sprint.label}</span>
												</div>
												{#if i < sprintNodes.length - 1}
													<div class="connector" aria-hidden="true" />
												{/if}
											{/each}
										</div>
									</div>
								{/if}
							{/if}

							{#if slotsCohortId === cohort.id && editingId !== cohort.id}
								<div class="slots-panel">
									<h3 class="slots-title">Occupation slots</h3>
									{#if slotsError}
										<div class="alert alert-danger" role="alert">{slotsError}</div>
									{/if}

									<Form
										class="add-slot"
										on:submit={(e) => {
											e.preventDefault();
											createSlot();
										}}
									>
										<FormGroup class="mb-0 flex-grow-1">
											<Label>Add empty slot</Label>
											<Input type="select" bind:value={newSlotOccupationId} required>
												<option value="">Select occupation…</option>
												{#each occupations as occ}
													<option value={occ.id}>{occ.title}</option>
												{/each}
											</Input>
										</FormGroup>
										<Button type="submit" color="primary" size="sm" class="align-self-end">
											Add slot
										</Button>
									</Form>

									{#if slotsLoading}
										<div class="py-3 text-center">Loading slots…</div>
									{:else if slots.length === 0}
										<p class="text-muted mb-0 mt-3">No slots yet. Add an occupation seat above.</p>
									{:else}
										<Table size="sm" class="mt-3 mb-0" bordered>
											<thead>
												<tr>
													<th>Occupation</th>
													<th>Status</th>
													<th>Assignee</th>
													<th>Actions</th>
												</tr>
											</thead>
											<tbody>
												{#each slots as slot (slot.id)}
													<tr>
														<td>{slot.occupation_title || '—'}</td>
														<td>
															<span class="status status-{slot.status}">{slot.status}</span>
														</td>
														<td>
															{#if slot.user_email}
																{slot.user_email}
																{#if slot.user_username}
																	<span class="text-muted small">(@{slot.user_username})</span>
																{/if}
															{:else}
																<span class="text-muted">Open</span>
															{/if}
														</td>
														<td>
															<div class="slot-actions">
																{#if slot.status === 'applied'}
																	<Button
																		color="success"
																		size="sm"
																		on:click={() => acceptSlot(slot)}
																	>
																		Accept
																	</Button>
																{/if}
																{#if slot.status === 'open' || slot.status === 'applied'}
																	<div class="assign-row">
																		<Input
																			type="email"
																			placeholder="user@email.com"
																			bsSize="sm"
																			value={assignEmails[slot.id] || ''}
																			on:input={(e) => {
																				assignEmails = {
																					...assignEmails,
																					[slot.id]: e.currentTarget.value
																				};
																			}}
																		/>
																		<Button
																			color="primary"
																			size="sm"
																			on:click={() => assignSlot(slot)}
																		>
																			Assign
																		</Button>
																	</div>
																{/if}
																{#if slot.status !== 'open'}
																	<Button
																		color="warning"
																		size="sm"
																		on:click={() => clearSlot(slot)}
																	>
																		Clear
																	</Button>
																{/if}
																<Button
																	color="danger"
																	size="sm"
																	on:click={() => deleteSlot(slot)}
																>
																	Delete
																</Button>
															</div>
														</td>
													</tr>
												{/each}
											</tbody>
										</Table>
									{/if}
								</div>
							{/if}
						</article>
					{/each}
				</div>
			{/if}
		</section>
	</Container>
</div>

<style>
	.wrapper {
		--ink: #071416;
		--muted: #243940;
		--soft: #3a545c;
		--accent: #0a5f63;
		--accent-deep: #074144;
		background: #fff;
		padding: 30px;
		border-radius: 10px;
	}
	.gap-2 {
		gap: 0.5rem;
	}
	:global(.create-toggle) {
		cursor: pointer;
		user-select: none;
	}
	:global(.create-toggle:hover) {
		background: #f0f4f3;
	}
	.toggle-hint {
		font-weight: 400;
		color: #667;
		line-height: 1;
	}

	.cohorts-section {
		margin-top: 0.5rem;
	}

	.section-title {
		margin: 0 0 1.25rem;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--ink);
	}

	.cohort-cards {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.seat-card {
		position: relative;
		overflow: hidden;
		background: #fbfffe;
		border: 1px solid rgba(7, 65, 68, 0.12);
		border-radius: 18px;
		box-shadow:
			0 1px 0 rgba(255, 255, 255, 0.8) inset,
			0 18px 40px -24px rgba(7, 65, 68, 0.35);
	}

	.seat-card::before {
		content: '';
		position: absolute;
		inset: 0 auto 0 0;
		width: 4px;
		background: linear-gradient(180deg, #0a5f63 0%, #0f8f94 100%);
		z-index: 1;
	}

	.seat-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1.5rem;
		padding: 1.65rem 1.75rem 1.35rem 1.9rem;
	}

	.seat-kicker {
		margin: 0 0 0.45rem;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--accent);
	}

	.cohort-name {
		margin: 0;
		font-family: Fraunces, Georgia, serif;
		font-size: clamp(1.55rem, 3vw, 2rem);
		font-weight: 500;
		letter-spacing: -0.02em;
		line-height: 1.15;
		color: var(--ink);
	}

	.cohort-sub {
		margin: 0.45rem 0 0;
		font-size: 0.98rem;
		line-height: 1.4;
		color: var(--soft);
	}

	.card-actions {
		display: flex;
		gap: 0.4rem;
		flex-shrink: 0;
	}

	.icon-btn {
		display: grid;
		place-items: center;
		width: 2.35rem;
		height: 2.35rem;
		border: 1px solid rgba(10, 95, 99, 0.18);
		border-radius: 10px;
		background: linear-gradient(145deg, rgba(10, 95, 99, 0.08), rgba(10, 95, 99, 0.03));
		color: var(--accent-deep);
		cursor: pointer;
		transition: background 0.15s ease, transform 0.15s ease;
	}

	.icon-btn:hover {
		background: rgba(10, 95, 99, 0.14);
		transform: translateY(-1px);
	}

	.icon-btn.danger {
		border-color: rgba(180, 50, 50, 0.2);
		background: rgba(220, 53, 69, 0.06);
		color: #b02a37;
	}

	.icon-btn.danger:hover {
		background: rgba(220, 53, 69, 0.14);
	}

	.seat-foot {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1.25rem 2.5rem;
		padding: 1.15rem 1.75rem 1.35rem 1.9rem;
		background: linear-gradient(180deg, rgba(217, 232, 230, 0.35), rgba(217, 232, 230, 0.55));
		border-top: 1px solid rgba(7, 65, 68, 0.08);
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		min-width: 0;
	}

	.stat-label {
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--accent);
	}

	.stat-value {
		font-size: 0.98rem;
		font-weight: 600;
		color: var(--ink);
		line-height: 1.3;
	}

	.dates-stat .date-months {
		display: block;
		white-space: nowrap;
	}

	.date-year {
		display: block;
		margin-top: 0.15rem;
		font-family: Fraunces, Georgia, serif;
		font-size: 1.55rem;
		font-weight: 500;
		letter-spacing: -0.02em;
		line-height: 1;
		color: var(--accent-deep);
	}

	.slots-btn {
		padding: 0.55rem 0.95rem;
		border: 1px solid rgba(10, 95, 99, 0.25);
		border-radius: 8px;
		background: #fbfffe;
		color: var(--accent-deep);
		font-size: 0.85rem;
		font-weight: 700;
		cursor: pointer;
	}

	.slots-btn:hover:not(:disabled) {
		background: rgba(10, 95, 99, 0.08);
	}

	.slots-btn.primary {
		background: #0a5f63;
		border-color: #0a5f63;
		color: #fff;
	}

	.slots-btn.primary:hover:not(:disabled) {
		background: #084a4d;
	}

	.slots-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.foot-actions {
		margin-left: auto;
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
		justify-content: flex-end;
	}

	.sprint-band {
		padding: 1.25rem 1.5rem 1.45rem;
		background: linear-gradient(160deg, #0a4548 0%, #0f6f73 55%, #0c5a5d 100%);
		color: #f7fffe;
	}

	.sprint-kicker {
		margin: 0 0 0.85rem;
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: rgba(247, 255, 254, 0.75);
	}

	.track {
		display: flex;
		align-items: center;
		width: 100%;
	}

	.node {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		color: #f7fffe;
		flex-shrink: 0;
	}

	.node-n {
		display: grid;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		border: 2px solid rgba(247, 255, 254, 0.92);
		background: rgba(7, 40, 42, 0.28);
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		color: #f7fffe;
	}

	.node-label {
		font-size: 0.62rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #f7fffe;
		opacity: 0.95;
		white-space: nowrap;
	}

	.connector {
		flex: 1;
		height: 2px;
		min-width: 0.5rem;
		background: linear-gradient(90deg, rgba(247, 255, 254, 0.9), rgba(247, 255, 254, 0.35));
		margin-bottom: 1.15rem;
	}

	.node.is-active .node-n {
		background: #f7fffe;
		color: #074144;
		border-color: #f7fffe;
		box-shadow: 0 0 0 3px rgba(247, 255, 254, 0.25);
	}

	.node.is-active .node-label {
		font-weight: 700;
	}

	.edit-panel {
		padding: 1.5rem 1.75rem 1.5rem 1.9rem;
	}

	.sprint-editor {
		margin-top: 0.5rem;
		padding-top: 1.25rem;
		border-top: 1px solid rgba(7, 65, 68, 0.12);
	}

	.sprint-editor-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.85rem;
	}

	.sprint-editor-head h4 {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--ink);
	}

	.sprint-row {
		padding: 0.95rem 1rem;
		margin-bottom: 0.75rem;
		border: 1px solid rgba(7, 65, 68, 0.12);
		border-radius: 12px;
		background: #f7fbfa;
	}

	.sprint-row.active {
		border-color: rgba(10, 95, 99, 0.35);
		background: rgba(10, 95, 99, 0.06);
	}

	.sprint-row-top {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		margin-bottom: 0.65rem;
	}

	.sprint-pos {
		font-weight: 700;
		letter-spacing: 0.04em;
		color: var(--accent-deep);
	}

	.active-badge {
		padding: 0.15rem 0.5rem;
		border-radius: 999px;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		background: #d7f0f1;
		color: #074144;
	}

	.icon-btn.sm {
		width: 2rem;
		height: 2rem;
		margin-left: auto;
		border-radius: 8px;
	}

	.slots-panel {
		padding: 1.15rem 1.5rem 1.35rem 1.9rem;
		background: #f7faf9;
		border-top: 1px solid rgba(7, 65, 68, 0.08);
	}
	.slots-title {
		margin: 0 0 0.75rem;
		font-size: 1.05rem;
		font-weight: 600;
	}
	.add-slot {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: flex-end;
		max-width: 520px;
	}
	.slot-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		align-items: center;
	}
	.assign-row {
		display: flex;
		gap: 0.35rem;
		align-items: center;
		min-width: 220px;
	}
	.status {
		display: inline-block;
		padding: 0.15rem 0.5rem;
		border-radius: 3px;
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}
	.status-open {
		background: #e8f5e9;
		color: #2e7d32;
	}
	.status-applied {
		background: #fff8e1;
		color: #f57f17;
	}
	.status-assigned {
		background: #e3f2fd;
		color: #1565c0;
	}

	@media (max-width: 640px) {
		.node-label {
			display: none;
		}
		.connector {
			margin-bottom: 0;
		}
		.node-n {
			width: 2.15rem;
			height: 2.15rem;
			font-size: 0.7rem;
		}
		.seat-foot {
			flex-direction: column;
			align-items: stretch;
		}
		.foot-actions {
			margin-left: 0;
			width: 100%;
		}
		.foot-actions .slots-btn {
			flex: 1;
			margin-left: 0;
		}
	}
</style>
