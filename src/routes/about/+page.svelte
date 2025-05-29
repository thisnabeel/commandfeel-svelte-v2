<script>
	import { fade } from 'svelte/transition';
</script>

<div class="about-container" in:fade>
	<div class="content">
		<div class="header">
			<h1>About CommandFeel</h1>
			<div class="emoji-header">🧠✨</div>
		</div>

		<div class="story">
			<p class="lead">
				I've always been a right-brained thinker. I love metaphors, visuals, vibes. But learning
				software engineering? It felt like hitting my head against walls of syntax and cold logic.
			</p>

			<p class="lead">So I built something for people like me.</p>
		</div>

		<div class="feature-box">
			<div class="feature-header">
				<span class="emoji">🎮</span>
				<h2>CommandFeel</h2>
			</div>
			<p>
				A Software Engineering Gym where we feel our way through computer science. Instead of
				abstract lectures, you get cozy, visual, playful quests that teach things like sockets,
				k-means, and server-side rendering using analogies like restaurants, candy bowls, and
				puzzles.
			</p>
		</div>

		<div class="highlight-box">
			<span class="emoji">💡</span>
			<h3>Right-brained analogies for left-brained problems.</h3>
		</div>

		<div class="closing">
			<p>
				If you've ever wished learning CS felt more like storytelling than studying — you'll love
				this.
			</p>
		</div>
	</div>
</div>

<style>
	.about-container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem 1rem;
		color: #2c3e50;
	}

	.content {
		background: white;
		border-radius: 12px;
		padding: 3rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.emoji-header {
		font-size: 3rem;
		margin: 1rem 0;
	}

	h1 {
		font-size: 2.5rem;
		color: #2c3e50;
		margin: 0;
	}

	.story {
		margin-bottom: 3rem;
	}

	.lead {
		font-size: 1.25rem;
		line-height: 1.6;
		color: #34495e;
	}

	.feature-box {
		background: #f8f9fa;
		border-radius: 8px;
		padding: 2rem;
		margin: 2rem 0;
		border-left: 4px solid #416fff;
	}

	.feature-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.emoji {
		font-size: 2rem;
	}

	h2 {
		margin: 0;
		color: #416fff;
		font-size: 1.75rem;
	}

	.highlight-box {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin: 2rem 0;
		padding: 1.5rem;
		background: #416fff;
		color: white;
		border-radius: 8px;
	}

	.highlight-box h3 {
		margin: 0;
		font-size: 1.5rem;
	}

	.closing {
		font-size: 1.25rem;
		text-align: center;
		margin-top: 3rem;
		font-style: italic;
		color: #34495e;
	}

	@media (max-width: 640px) {
		.content {
			padding: 2rem 1rem;
		}

		h1 {
			font-size: 2rem;
		}

		.lead {
			font-size: 1.1rem;
		}

		.highlight-box {
			flex-direction: column;
			text-align: center;
		}

		.highlight-box h3 {
			font-size: 1.25rem;
		}
	}
</style>
