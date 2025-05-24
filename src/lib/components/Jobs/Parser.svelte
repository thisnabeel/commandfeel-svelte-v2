<script>
	import Editor from 'cl-editor/src/Editor.svelte';
	let html = '';
	let bodyBox = null;
	let saved = true;

	$: console.log(html);

	function handleSelection() {
		const selection = window.getSelection();
		const selectedRange = selection.getRangeAt(0);
		const selectedText = selectedRange.cloneContents();
		const tempContainer = document.createElement('div');
		tempContainer.appendChild(selectedText);

		if (tempContainer.querySelector('span')) {
			console.log('Selection contains a <span> element');
			return;
		} else {
			let parentSpanPiece = selectedRange.commonAncestorContainer;

			while (parentSpanPiece) {
				if (
					parentSpanPiece.nodeType === Node.ELEMENT_NODE &&
					parentSpanPiece.classList.contains('piece')
				) {
					console.log('Selection is inside a <span class="piece"> element');
					return;
				}
				parentSpanPiece = parentSpanPiece.parentNode;
			}

			if (!parentSpanPiece) {
				console.log('Selection is not inside a <span class="piece"> element');
			}
		}

		const highlightedText = selection.toString();
		console.log(highlightedText);
	}
</script>

<hr />
<div class="body" bind:this={bodyBox} on:mouseup={handleSelection}>
	<Editor
		{html}
		on:change={(evt) => {
			html = evt.detail;
		}}
	/>
</div>

<style>
</style>
