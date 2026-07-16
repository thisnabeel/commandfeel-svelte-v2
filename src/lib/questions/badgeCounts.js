/** Coerce API/store ids so 5 and "5" compare equal. */
export function sameUserId(a, b) {
	if (a == null || b == null || a === '' || b === '') return false;
	const na = Number(a);
	const nb = Number(b);
	if (Number.isNaN(na) || Number.isNaN(nb)) return false;
	return na === nb;
}

/**
 * Whether a question should count toward attention badges.
 * - Learners: unresolved and someone else last commented
 * - Admins: unresolved cohort questions that aren't their own, where they aren't last commenter
 */
export function countsForBadge(q, me, { asAdmin = false } = {}) {
	if (!q || q.resolved || !me) return false;
	if (asAdmin) {
		if (sameUserId(q.user_id, me.id)) return false;
		return !sameUserId(q.last_comment_by_id, me.id);
	}
	return q.last_comment_by_id != null && !sameUserId(q.last_comment_by_id, me.id);
}

export function countBadgeWorthy(list, me, opts) {
	return (list || []).filter((q) => countsForBadge(q, me, opts)).length;
}
