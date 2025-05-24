<script>
	import Bar from './Bar.svelte';
	import MediaQuery from '$lib/MediaQuery/MediaQuery.svelte';
</script>

<header>
	<a href="/" class="logo-holder">
		<picture class="logo">
			<img src="/logo-light.png" alt="commandfeel Logo" />
		</picture>
	</a>

	<Bar />
</header>

<style>
	.bar {
		position: relative;
	}
	.switcher {
		position: absolute;
		right: 40px;
		top: -30px;
	}
	.logo-holder {
		display: block;
		width: max-content;
		margin: 0 auto;
		position: relative;
	}
	.logo {
		max-width: 200px;
		margin: 0 auto;
		display: block;
		padding: 2em;
	}

	.logo img {
		width: 100%;
		margin-top: 10px;
	}

	@media (max-width: 480px) {
		.logo {
			max-width: 180px;
			margin: 0 auto;
			display: block;
			padding: 2em;
			position: relative;
			top: -38px;
		}

		.switcher {
			position: absolute;
			left: 17%;
			top: -30px;
		}
	}
</style>
