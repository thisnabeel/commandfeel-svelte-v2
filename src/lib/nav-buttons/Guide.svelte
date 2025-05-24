<script>
	import { showGuide, showGuideButton } from '$lib/stores/view';
	function toggle() {
		showGuide.set(!$showGuide);
	}
</script>

{#if $showGuideButton}
	<div class="btn btn-primary guide-btn" on:click={toggle}>
		{#if !$showGuide}
			New Here?<br /> Show Guide
		{:else}
			Hide Guide
		{/if}
	</div>
{/if}

<style>
	.guide-btn {
		bottom: 10px;
		right: 10px;
		position: fixed;
		z-index: 999999;
	}
	@media (max-width: 480px) {
		.guide-btn {
			/* right: 65px; */
			/* bottom: 25px; */
		}
	}
</style>
