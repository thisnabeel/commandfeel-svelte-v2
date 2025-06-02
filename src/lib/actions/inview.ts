import type { Action } from 'svelte/action';

export const inview: Action<HTMLElement, void> = (node) => {
	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					node.dispatchEvent(new CustomEvent('inview'));
					observer.unobserve(node);
				}
			});
		},
		{
			threshold: 0.1
		}
	);

	observer.observe(node);

	return {
		destroy() {
			observer.unobserve(node);
		}
	};
};
