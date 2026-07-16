/** Labels for abstraction levels — swap via this map only. */
export const ABSTRACTION_LEVELS = [
	{ value: 0, label: 'Non-techy' },
	{ value: 1, label: 'New techy' },
	{ value: 2, label: 'Techy' }
];

export function hasAbstractionBody(abstraction) {
	const body = abstraction?.body;
	if (typeof body !== 'string') return !!body;
	return body.replace(/<[^>]*>/g, '').trim().length > 0;
}

/** Levels that have at least one non-empty abstraction body. */
export function levelsWithContent(abstractions) {
	const present = new Set();
	for (const a of abstractions || []) {
		if (hasAbstractionBody(a)) present.add(a.level ?? 0);
	}
	return ABSTRACTION_LEVELS.map((l) => l.value).filter((v) => present.has(v));
}

/** Admin: always 0/1/2. Non-admin: only levels with content. */
export function visibleLevels(abstractions, isAdmin) {
	if (isAdmin) return ABSTRACTION_LEVELS.map((l) => l.value);
	return levelsWithContent(abstractions);
}

/** Non-admin: show picker only when 2+ levels have content. Admin: always. */
export function showLevelPicker(abstractions, isAdmin) {
	if (isAdmin) return true;
	return levelsWithContent(abstractions).length >= 2;
}

export function defaultSelectedLevel(abstractions, isAdmin) {
	const visible = visibleLevels(abstractions, isAdmin);
	if (visible.includes(0)) return 0;
	return visible[0] ?? 0;
}

export function labelForLevel(level) {
	return ABSTRACTION_LEVELS.find((l) => l.value === level)?.label ?? String(level);
}

/** elementType is often plural route segment e.g. "skills" → "Skill" */
export function abstractableTypeFromElementType(elementType) {
	if (!elementType || typeof elementType !== 'string') return 'Skill';
	const singular = elementType.endsWith('s') ? elementType.slice(0, -1) : elementType;
	return singular.charAt(0).toUpperCase() + singular.slice(1);
}
