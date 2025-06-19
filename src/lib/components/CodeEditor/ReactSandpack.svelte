<!-- @ts-nocheck -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	let sandpackRoot: HTMLDivElement | null = null;
	let reactRoot: any = null;
	let Sandpack: any = null;
	export let code: string = '';
	const dispatch = createEventDispatcher();

	onMount(async () => {
		// Dynamically import React and Sandpack
		const React = (await import('react')).default;
		// @ts-ignore
		const ReactDOM = await import('react-dom/client');
		Sandpack = await import('@codesandbox/sandpack-react');

		// Create a root for React to render into
		reactRoot = ReactDOM.createRoot(sandpackRoot);
		renderSandpack(React);
	});

	$: if (reactRoot && Sandpack) {
		import('react').then((React) => {
			renderSandpack(React.default);
		});
	}

	function renderSandpack(React: any) {
		if (!Sandpack || !reactRoot) return;
		reactRoot.render(
			Sandpack.Sandpack
				? React.createElement(Sandpack.Sandpack, {
						template: 'react',
						files: {
							'/App.js': code,
							'/index.js': `import React from 'react';\nimport { createRoot } from 'react-dom/client';\nimport App from './App';\nconst root = createRoot(document.getElementById('root'));\nroot.render(<App />);`
						},
						options: {
							showTabs: true,
							showLineNumbers: true,
							showConsole: true,
							wrapContent: true,
							editorHeight: 400,
							editorWidthPercentage: 60
						}
					})
				: null
		);
	}

	onDestroy(() => {
		if (reactRoot) {
			reactRoot.unmount();
		}
	});
</script>

<div bind:this={sandpackRoot} style="width: 100%; height: 500px;"></div>
