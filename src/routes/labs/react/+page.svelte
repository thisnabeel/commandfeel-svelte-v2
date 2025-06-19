<script lang="ts">
	import ReactSandpack from '$lib/components/CodeEditor/ReactSandpack.svelte';
	let code = `import React from 'react';

function App() {
  const [count, setCount] = React.useState(0);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Hello React!</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}

export default App;`;
</script>

<div class="playground">
	<div class="preview-container" style="flex: 1; min-width: 0;">
		<ReactSandpack {code} />
	</div>
</div>

<style>
	.playground {
		display: flex;
		height: max-content;
		margin-bottom: 2em;
		background: #1e1e1e;
		border-radius: 8px;
		overflow: hidden;
	}

	.preview-container {
		height: 100%;
		background: white;
		overflow: hidden;
	}
</style>
