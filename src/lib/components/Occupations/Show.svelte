<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import Api from '$lib/api/api';
	import { user } from '$lib/stores/user';
	import Mapper from './Mapper/Mapper.svelte';
	import View from './View/View.svelte';
	import {
		Container,
		Button,
		Card,
		CardBody,
		CardHeader,
		Form,
		FormGroup,
		Input,
		Label
	} from 'sveltestrap';

	export let occupationId;

	let occupation = null;
	let skillsCatalog = [];
	let tree = [];
	let loading = true;
	let error = '';
	let editing = false;
	/** @type {Set<number>} */
	let notedIds = new Set();
	/** @type {Set<number|string>} */
	let approvedEvidenceIds = new Set();
	/** @type {Record<string, number>} */
	let unresolvedBySkillId = {};

	let editForm = {
		title: '',
		subtitle: '',
		description: '',
		average_salary_range: ''
	};

	function buildTree(flat) {
		const byId = {};
		const roots = [];

		for (const item of flat) {
			byId[item.id] = { ...item, skills: [] };
		}

		for (const item of flat) {
			const node = byId[item.id];
			if (item.occupation_skill_id && byId[item.occupation_skill_id]) {
				byId[item.occupation_skill_id].skills.push(node);
			} else {
				roots.push(node);
			}
		}

		const sortRecursive = (nodes) => {
			nodes.sort((a, b) => (a.position || 0) - (b.position || 0));
			nodes.forEach((n) => sortRecursive(n.skills));
		};
		sortRecursive(roots);
		return roots;
	}

	function onNotePresence(id, hasNote) {
		const next = new Set(notedIds);
		if (hasNote) next.add(id);
		else next.delete(id);
		notedIds = next;
	}

	function onEvidencePresence(id, hasApproved) {
		if (!id) return;
		const next = new Set(approvedEvidenceIds);
		if (hasApproved) {
			next.add(id);
			next.add(String(id));
		} else {
			next.delete(id);
			next.delete(String(id));
		}
		approvedEvidenceIds = next;
	}

	function onUnresolvedChange(skillId, count) {
		if (!skillId) return;
		const next = { ...unresolvedBySkillId };
		const key = String(skillId);
		if (count > 0) next[key] = count;
		else delete next[key];
		unresolvedBySkillId = next;
	}

	async function loadNotedIds() {
		if (!$user) {
			notedIds = new Set();
			return;
		}
		try {
			const ids = await Api.get(`/occupations/${occupationId}/my_notes`);
			notedIds = new Set(Array.isArray(ids) ? ids : []);
		} catch {
			notedIds = new Set();
		}
	}

	async function loadApprovedEvidenceIds() {
		if (!$user) {
			approvedEvidenceIds = new Set();
			return;
		}
		try {
			const ids = await Api.get(`/occupations/${occupationId}/my_approved_evidences`);
			approvedEvidenceIds = new Set(Array.isArray(ids) ? ids : []);
		} catch {
			approvedEvidenceIds = new Set();
		}
	}

	async function loadUnresolvedBySkill() {
		if (!$user) {
			unresolvedBySkillId = {};
			return;
		}
		try {
			const counts = await Api.get(`/occupations/${occupationId}/unresolved_question_counts`);
			unresolvedBySkillId =
				counts && typeof counts === 'object' && !Array.isArray(counts) ? counts : {};
		} catch {
			unresolvedBySkillId = {};
		}
	}

	async function load() {
		try {
			loading = true;
			error = '';
			const occ = await Api.get(`/occupations/${occupationId}`);
			occupation = occ;
			tree = buildTree(occ.occupation_skills || []);
			editForm = {
				title: occ.title || '',
				subtitle: occ.subtitle || '',
				description: occ.description || '',
				average_salary_range: occ.average_salary_range || ''
			};

			await Promise.all([loadNotedIds(), loadApprovedEvidenceIds(), loadUnresolvedBySkill()]);

			if ($user?.admin) {
				skillsCatalog = (await Api.get('/skills')) || [];
			}
		} catch (err) {
			error = err?.response?.data?.error || err?.message || 'Failed to load occupation';
		} finally {
			loading = false;
		}
	}

	async function enterEdit() {
		editing = true;
		if (!skillsCatalog.length && $user?.admin) {
			try {
				skillsCatalog = (await Api.get('/skills')) || [];
			} catch {
				/* ignore */
			}
		}
	}

	async function exitEdit() {
		editing = false;
		await load();
	}

	async function saveOccupation() {
		try {
			error = '';
			occupation = await Api.put(`/occupations/${occupationId}`, { occupation: editForm });
			tree = buildTree(occupation.occupation_skills || []);
		} catch (err) {
			error = err?.response?.data?.error || err?.message || 'Failed to update occupation';
		}
	}

	async function deleteOccupation() {
		if (occupation?.cohort_users_count > 0) {
			error = 'Cannot delete occupation with enrolled cohort users';
			return;
		}
		if (!confirm('Delete this occupation?')) return;
		try {
			error = '';
			await Api.delete(`/occupations/${occupationId}`);
			goto('/occupations');
		} catch (err) {
			const apiErrors = err?.response?.data?.errors;
			error =
				(apiErrors && apiErrors.join(', ')) ||
				err?.response?.data?.error ||
				err?.message ||
				'Failed to delete occupation';
		}
	}

	onMount(load);
</script>

<div class="page" class:editing in:fade>
	<div class="topbar">
		<a class="back" href={$user?.admin ? '/occupations' : '/'}>
			{$user?.admin ? '← Occupations' : '← Home'}
		</a>
		{#if $user?.admin}
			{#if editing}
				<button type="button" class="edit-toggle" on:click={exitEdit}>Done</button>
			{:else}
				<button type="button" class="edit-toggle" on:click={enterEdit}>Edit</button>
			{/if}
		{/if}
	</div>

	{#if error}
		<div class="alert alert-danger" role="alert">{error}</div>
	{/if}

	{#if loading}
		<div class="loading">Loading…</div>
	{:else if occupation}
		{#if editing && $user?.admin}
			<Container class="py-2 admin-shell">
				<Card class="mb-4">
					<CardHeader>
						<h2 class="mb-0">Edit Occupation</h2>
					</CardHeader>
					<CardBody>
						<Form
							on:submit={(e) => {
								e.preventDefault();
								saveOccupation();
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
								<Button type="submit" color="primary">Save</Button>
								<Button
									type="button"
									color="danger"
									disabled={occupation.cohort_users_count > 0}
									on:click={deleteOccupation}
								>
									Delete Occupation
								</Button>
							</div>
							{#if occupation.cohort_users_count > 0}
								<p class="text-muted mt-2 mb-0">
									Cannot delete: {occupation.cohort_users_count} cohort user(s) linked.
								</p>
							{/if}
						</Form>
					</CardBody>
				</Card>

				<Card>
					<CardHeader>
						<h2 class="mb-0">Occupation Skills Mapper</h2>
					</CardHeader>
					<CardBody>
						<Mapper {occupationId} {skillsCatalog} />
					</CardBody>
				</Card>
			</Container>
		{:else}
			<View
				{occupation}
				{tree}
				{notedIds}
				{onNotePresence}
				{approvedEvidenceIds}
				{onEvidencePresence}
				{unresolvedBySkillId}
				{onUnresolvedChange}
			/>
		{/if}
	{/if}
</div>

<style>
	.page {
		padding: 1.25rem 1.25rem 3rem;
	}

	.page.editing {
		background: #fff;
		border-radius: 12px;
	}

	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		max-width: 46rem;
		margin: 0 auto 1.5rem;
	}

	.page.editing .topbar {
		max-width: none;
	}

	.back {
		font-family: GreyCliffCF-Regular, 'GreycliffCF-Regular', system-ui, sans-serif;
		color: #0f766e;
		text-decoration: none;
		font-size: 0.95rem;
	}

	.back:hover {
		text-decoration: underline;
	}

	.edit-toggle {
		border: 1px solid rgba(15, 118, 110, 0.35);
		background: rgba(255, 255, 255, 0.7);
		color: #134e4a;
		font-family: 'Space Grotesk', sans-serif;
		font-weight: 600;
		font-size: 0.9rem;
		padding: 0.45rem 0.95rem;
		border-radius: 999px;
		cursor: pointer;
	}

	.edit-toggle:hover {
		background: #fff;
	}

	.loading {
		text-align: center;
		padding: 3rem 1rem;
		color: #64748b;
	}

	.gap-2 {
		gap: 0.5rem;
	}
</style>
