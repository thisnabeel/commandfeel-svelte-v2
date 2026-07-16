/**
 * Vocabulary tree search helpers.
 */

export function labelOf(item) {
	return item?.display_title || item?.title || item?.skill_title || 'Untitled';
}

/**
 * Flatten tree into { item, ancestors: [{ id, label }] } rows.
 * ancestors = path from root to parent (does not include the item itself).
 */
export function flattenWithAncestors(nodes, ancestors = []) {
	const out = [];
	for (const item of nodes || []) {
		out.push({ item, ancestors: [...ancestors] });
		const childAncestors = [...ancestors, { id: item.id, label: labelOf(item) }];
		out.push(...flattenWithAncestors(item.skills || [], childAncestors));
	}
	return out;
}

export function matchesQuery(label, query) {
	const q = (query || '').trim().toLowerCase();
	if (!q) return false;
	return String(label || '')
		.toLowerCase()
		.includes(q);
}

function escapeRegExp(s) {
	return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Split label into { text, hit } parts for case-insensitive highlight.
 * @returns {{ text: string, hit: boolean }[]}
 */
export function highlightParts(label, query) {
	const raw = String(label || '');
	const q = (query || '').trim();
	if (!q) return [{ text: raw, hit: false }];

	const re = new RegExp(`(${escapeRegExp(q)})`, 'ig');
	const parts = raw.split(re);
	return parts
		.filter((p) => p.length > 0)
		.map((text) => ({
			text,
			hit: text.toLowerCase() === q.toLowerCase()
		}));
}

/**
 * Ids that must be expanded so `targetId` is visible (all ancestors of target).
 */
export function expandPathIds(flat, targetId) {
	const row = (flat || []).find((r) => r.item.id === targetId);
	if (!row) return new Set();
	return new Set(row.ancestors.map((a) => a.id));
}

/**
 * Full breadcrumb path including the match itself.
 */
export function breadcrumbPath(ancestors, item) {
	return [...(ancestors || []), { id: item.id, label: labelOf(item) }];
}
