<script>
	export let param;
	export let submit;
	export let inputs;
</script>

<div class="row">
	<div class="col-lg-4 col-md-4">
		<label for="">Key:</label><br />
		<code style="font-size: 34px">{param.title}</code>
	</div>
	<div class="col-lg-8 col-md-8">
		<label for="">Value:</label>
		<textarea
			class="form-control"
			on:keyup={(e) => {
				const hash = {};
				hash[param.title] = e.target.value;
				submit(hash);
			}}
			value={inputs[param.title] ? inputs[param.title] : ''}
		/>
	</div>
</div>
<hr />

<style>
</style>
