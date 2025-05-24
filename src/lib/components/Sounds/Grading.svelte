<script>
	import { correctSound, incorrectSound, victorySound } from '$lib/stores/view';

	let correctAudio;
	let incorrectAudio;
	let victoryAudio;

	correctSound.subscribe((count) => {
		if (count > 0) {
			if (correctAudio) {
				correctAudio.currentTime = 0;
				correctAudio.play();
			}
		}
	});

	incorrectSound.subscribe((count) => {
		if (count > 0) {
			if (incorrectAudio) {
				incorrectAudio.currentTime = 0;
				incorrectAudio.play();
			}
		}
	});

	victorySound.subscribe((count) => {
		if (count > 0) {
			if (victoryAudio) {
				victoryAudio.currentTime = 0;
				victoryAudio.play();
			}
		}
	});
</script>

<audio src="/passing.mp3" bind:this={correctAudio} />
<audio src="/failing.mp3" bind:this={incorrectAudio} />
<audio src="/victory.wav" bind:this={victoryAudio} />
