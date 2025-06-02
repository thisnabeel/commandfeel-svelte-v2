import type { PageLoad } from './$types';
import Api from '$lib/api/api';

export const load: PageLoad = async () => {
	try {
		const codeComparisons = await Api.get('/code_comparisons');
		return {
			codeComparisons
		};
	} catch (error) {
		return {
			codeComparisons: []
		};
	}
};
