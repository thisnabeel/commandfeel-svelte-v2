<script>
	export let language;
	export let update;
	export let removeCode;
	// import MonacoEditor from 'monaco-editor';

	export let block;
	import { user } from '$lib/stores/user';
	import { loomifiedView } from '$lib/stores/view';
	import CodeEditor from '../CodeEditor/CodeEditor.svelte';

	let editorRef = null;

	let lineCount = 1;

	let blockedLines = [];

	let readOnly = block.disabled;

	let code = '';

	let linked = false;

	function handleEditorDidMount(editor, monaco) {
		// here is the editor instance
		// you can store it in `useRef` for further usage
		editorRef = editor;
		lineCount = editorRef.getModel().getLineCount();
		editorRef.updateOptions({
			scrollBeyondLastLine: false,
			lineNumbers: 'off',
			glyphMargin: false,
			folding: false,
			// Undocumented see https://github.com/Microsoft/vscode/issues/30795#issuecomment-410998882
			lineDecorationsWidth: 0,
			lineNumbersMinChars: 0,
			readOnly: block.disabled
		});

		const editorContainer = editor.getDomNode();
		// editorContainer.addEventListener('keyup', function (event) {
		// 	// Check if the key pressed is an arrow key
		// 	if (
		// 		event.keyCode === 37 || // Left Arrow
		// 		event.keyCode === 38 || // Up Arrow
		// 		event.keyCode === 39 || // Right Arrow
		// 		event.keyCode === 40 // Down Arrow
		// 	) {
		// 		// Handle arrow key press here before text is edited
		// 		console.log('Arrow key pressed before text is edited!');
		// 		checkLine(editor);
		// 	}
		// });
		const disposable = editorRef.onDidChangeModelContent((event) => {
			// update(value);
		});
	}

	function blockLine() {
		const cursorPosition = editorRef.getPosition();

		const lineNumber = cursorPosition.lineNumber;
		const readOnlyClass = 'read-only';

		const readOnlyDecoration = {
			range: new monaco.Range(lineNumber, 1, lineNumber, 1), // Specify the range for the line
			options: {
				isWholeLine: true,
				className: readOnlyClass // Set the CSS class for read-only lines
			}
		};

		// Apply the decoration to the editor
		const appliedDecorations = editorRef.deltaDecorations([], [readOnlyDecoration]);
		blockedLines = [...blockedLines, lineNumber];
		// Store a reference to the applied decoration object in the array

		// const disposable = editorRef.onDidChangeModelContent((event) => {
		// 	console.log(event);
		// 	const editedLineNumber = event.changes[0].range.startLineNumber;

		// 	// Check if an edit attempt is made on the specified line
		// 	if (editedLineNumber === lineNumber) {
		// 		// Prevent the edit by undoing the change
		// 		editorRef.getModel().undo();
		// 	}
		// });
	}

	function makeBlocked() {
		blockedLines;

		for (let line of blockedLines) {
			editorRef.createDecorationsCollection([
				{
					range: new monaco.Range(line, 0, line, 0), // Block lines 1 to 3
					options: {
						isWholeLine: true,
						className: 'editor-line-readonly'
					}
				}
			]);

			// Disable line editing (handled from the CSS side but here as well to be safe)
			editorRef.onKeyDown((e) => {
				const isInBlockedRange =
					editorRef
						.getSelections()
						?.findIndex((range) => new monaco.Range(line, 0, line, 0).intersectRanges(range)) !==
					-1; // Block lines 1 to 3

				if (isInBlockedRange) {
					e.stopPropagation();
					e.preventDefault();
				}
			});
		}
	}

	function handleEditorChange(value, event) {
		// if (updateCode) {
		// 	updateCode(value, language);
		// } else {
		// }
		code = value;
		console.log({ value });
		update({
			code: code,
			disabled: readOnly,
			prefix_test: block.prefix_test
		});

		lineCount = editorRef.getModel().getLineCount();
		let currentLine = editorRef.getModel();
		// console.log(currentLine);
	}

	let blocked = '';
	$: blockedLines = blocked.split(' ').map((b) => parseInt(b));
	$: console.log(blockedLines);

	function refresh() {}

	function save() {}

	function blockCode() {
		readOnly = !readOnly;
		editorRef.updateOptions({
			readOnly: readOnly
		});
		block.disabled = readOnly;
		update({
			code: code,
			disabled: readOnly,
			prefix_test: block.prefix_test
		});
	}

	// function removeCode() {}
</script>

<div class="main" class:linked={block.prefix_test === true} class:readOnly>
	<CodeEditor
		height={lineCount * 18 + 'px'}
		defaultLanguage={language.editor_slug}
		onMount={handleEditorDidMount}
		wordWrap={'on'}
		scrollBeyondLastLine={false}
		automaticLayout={false}
		onChange={handleEditorChange}
		defaultValue={block.code}
		lineNumbers={'off'}
		options={{
			minimap: { enabled: false }
		}}
	/>

	{#if $user && $user.admin && !$loomifiedView}
		<div class="btn btn-primary locker" on:click={blockCode}><i class="fa fa-lock" /></div>
		<div class="btn btn-danger remove" on:click={() => removeCode(block)}>
			<i class="fa fa-times" />
		</div>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div
			class="btn btn-outline-warning link-test"
			on:click={() => {
				block.prefix_test = !block.prefix_test;
				update({
					code: block.code,
					disabled: readOnly,
					prefix_test: block.prefix_test
				});
			}}
		>
			<i class="fa fa-bolt" />
		</div>
	{/if}
</div>

<!-- <br />
<div class="btn btn-warning" on:click={refresh}><i class="fa fa-refresh" /></div>
<div class="btn btn-outline-primary" on:click={save}><i class="fa fa-save" /></div> -->
<style>
	.main {
		position: relative;
	}

	.linked {
		border-top: 8px dashed rgb(242 242 255);
	}
	.main:hover .locker,
	.main:hover .remove,
	.main:hover .link-test {
		display: block;
	}

	.locker {
		display: none;
		position: absolute;
		left: -17px;
		top: 0px;
		font-size: 9px;
		padding: 3px;
	}
	.remove {
		display: none;
		position: absolute;
		left: -45px;
		top: 0px;
		font-size: 9px;
		padding: 3px;
		width: 28px;
	}

	.link-test {
		display: none;
		position: absolute;
		left: -73px;
		top: 0px;
		font-size: 9px;
		padding: 3px;
		width: 28px;
	}
	:global(div:has(> .editor-line-readonly)) {
		/* display: none; */
		background-color: #00000005;
		cursor: not-allowed;
		z-index: 999; /* Moves this div above the code line making it not selectable */
	}

	.readOnly :global(.view-line) {
		/* display: none; */
		background-color: #0000000f;
		cursor: not-allowed;
		z-index: 999; /* Moves this div above the code line making it not selectable */
	}
</style>
