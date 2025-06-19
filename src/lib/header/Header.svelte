<script>
	import Bar from './Bar.svelte';
	import MediaQuery from '$lib/MediaQuery/MediaQuery.svelte';
	import { globalViewCategory, headerSubtitle } from '$lib/stores/view';
</script>

<header>
	<div class="flex">
		<div class="flex-50">
			<a href="/" class="logo-holder">
				<picture class="logo">
					<img src="/logo-light.png" alt="commandfeel Logo" />
				</picture>
			</a>
		</div>
		<div class="flex-50">
			<div class="cta-container">
				<div class="cta-content">
					<h1 class="space-grotesk-heading">The Software Engineering Gym</h1>
				</div>
				<div class="cta-background"></div>
			</div>
		</div>
	</div>
	<Bar />
</header>

<style>
	.flex {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 350px;
		margin: 0 auto;
	}
	.flex h1 {
		font-size: 24px;
		text-align: left;
	}
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
			margin: 0 auto;
			display: block;
			padding: 0;
			position: relative;
			max-width: 116px;
		}

		.switcher {
			position: absolute;
			left: 17%;
			top: -30px;
		}

		.flex {
			display: flex;
			justify-content: center;
			align-items: center;
			width: 60%;
			margin: 0 auto;
			margin-top: 10px;
			margin-bottom: 60px;
		}

		.flex h1 {
			text-align: left;
			font-size: 19px;
		}
	}
</style>
