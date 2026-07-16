<script>
	import { onMount } from 'svelte';

	let mounted = false;
	onMount(() => {
		mounted = true;
	});

	const foundingPrices = [
		{ label: 'Cohort 1', price: '$299' },
		{ label: 'Cohort 2', price: '$399' },
		{ label: 'Cohort 3', price: '$599' }
	];

	const roles = [
		'QA Engineers',
		'Product Managers',
		'Software Engineers',
		'Designers',
		'Technical Writers'
	];

	const idealFor = [
		'Career changers',
		'Computer Science students',
		'Recent graduates',
		'Self-taught builders',
		'Early-career professionals'
	];

	const sprintRituals = [
		'Sprint Planning',
		'Daily Async Standups',
		'Cross-functional delivery',
		'Backlog refinement',
		'Issue triage',
		'Release readiness',
		'Sprint Review',
		'Sprint Retrospective'
	];

	const sprints = [
		{ n: '01', title: 'Onboarding' },
		{ n: '02', title: 'Auth' },
		{ n: '03', title: 'UX' },
		{ n: '04', title: 'Core' },
		{ n: '05', title: 'RC' },
		{ n: '06', title: 'Release' }
	];

	const linkedInBullets = [
		{
			role: 'QA / Testing',
			bullets: [
				'Owned exploratory and regression testing across six Agile sprints on a live product team',
				'Logged and prioritized defects with clear severity, repro steps, and impact for developers',
				'Validated release candidates end-to-end and contributed to go/no-go release decisions'
			]
		},
		{
			role: 'Product / PM',
			bullets: [
				'Translated requirements into user stories with acceptance criteria for a cross-functional squad',
				'Facilitated backlog refinement and sprint planning against real delivery constraints',
				'Shipped features through full sprint cycles from discovery through release review'
			]
		},
		{
			role: 'Engineering / Design',
			bullets: [
				'Collaborated across engineering, design, and QA to deliver production-quality software',
				'Participated in daily standups, sprint reviews, and retrospectives in an async Agile team',
				'Built a portfolio of sprint artifacts—tickets, specs, and releases—you can walk through in interviews'
			]
		}
	];

	const skills = [
		'Agile methodology',
		'Scrum framework',
		'Sprint planning',
		'Daily standups',
		'Sprint reviews',
		'Retrospectives',
		'Cross-functional collaboration',
		'Requirements clarity',
		'Backlog management',
		'User story writing',
		'Acceptance criteria',
		'Manual & exploratory testing',
		'Defect reporting',
		'Severity vs. Priority',
		'Release validation',
		'Stakeholder communication',
		'Developer partnership',
		'Documentation habits'
	];

	const tools = ['Jira', 'Confluence', 'Slack or Discord', 'Figma or product specs', 'AI teammate assistants'];

	const deliverables = [
		'Jira ticket history',
		'Sprint contributions',
		'Specs or test artifacts',
		'Issue reports',
		'Release notes & checklists',
		'Sprint participation history',
		'Sprint reviews',
		'Retrospectives',
		'Role-specific portfolio work'
	];

	const mentorSupport = [
		'Weekly sprint kickoff',
		'Weekly office hours',
		'Mentor feedback on your role work',
		'Q&A support throughout each sprint',
		'AI-assisted feedback between mentor sessions'
	];

	const graduation = [
		'Complete all six sprints',
		'Submit regular async standups',
		'Finish assigned role work each sprint',
		'Produce high-quality team artifacts',
		'Participate in sprint ceremonies',
		'Demonstrate professional communication and teamwork'
	];

	const outcomes = [
		'Working within Scrum',
		'Collaborating across product, engineering, and QA',
		'Owning work from backlog to release',
		'Communicating clearly in async teams',
		'Participating in sprint planning, reviews, and retrospectives',
		'Contributing to the delivery of production-quality software'
	];

	const heroImage = {
		src: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2400&q=80',
		srcSet:
			'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=75 1200w, https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1800&q=80 1800w, https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2400&q=80 2400w',
		alt: 'A software team collaborating around laptops at a shared table',
		href: 'https://unsplash.com/photos/gMsnXqILjp4',
		credit: 'Photo by Annie Spratt on Unsplash'
	};

	function scrollTo(id) {
		document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}
</script>

<svelte:head>
	<link
		href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
	<link rel="preload" as="image" href={heroImage.src} imagesrcset={heroImage.srcSet} imagesizes="100vw" />
</svelte:head>

<div class="residency" class:mounted>
	<header class="hero">
		<img
			class="hero-photo"
			src={heroImage.src}
			srcset={heroImage.srcSet}
			sizes="100vw"
			alt={heroImage.alt}
			width="2400"
			height="1350"
			fetchpriority="high"
		/>
		<div class="hero-scrim" aria-hidden="true" />

		<div class="hero-plane" aria-hidden="true">
			<div class="track">
				{#each sprints as sprint, i}
					<div class="node" style="--i: {i}">
						<span class="node-n">{sprint.n}</span>
						<span class="node-label">Sprint {i + 1}</span>
					</div>
					{#if i < sprints.length - 1}
						<div class="connector" style="--i: {i}" />
					{/if}
				{/each}
			</div>
		</div>

		<div class="hero-inner">
			<p class="brand">SprintLab Residency</p>
			<h1>Work on a real Agile software team.</h1>
			<p class="lede">
				A 12-week, cohort-based program where you ship software through six consecutive sprints—not
				lectures or isolated assignments.
			</p>
			<div class="cta-row">
				<button type="button" class="cta primary" on:click={() => scrollTo('pricing')}>
					View founding pricing
				</button>
				<button type="button" class="cta ghost" on:click={() => scrollTo('linkedin')}>
					See LinkedIn bullets
				</button>
			</div>
			<a class="photo-credit" href={heroImage.href} target="_blank" rel="noopener noreferrer">
				{heroImage.credit}
			</a>
		</div>
	</header>

	<section class="band intro">
		<div class="wrap narrow">
			<h2>Practice over performance</h2>
			<p>
				Participants don't watch lectures or complete isolated assignments. Instead, they join a
				cross-functional team—QA, product, engineering, and more—that ships software through six
				consecutive sprints using industry-standard Agile practices.
			</p>
			<p>
				By the end of the program, graduates will have practical experience participating in sprint
				ceremonies, collaborating across roles, owning real delivery work, and contributing to
				multiple software releases.
			</p>
		</div>
	</section>

	<section class="band meta" id="pricing">
		<div class="wrap">
			<div class="meta-grid">
				<div class="meta-block">
					<p class="meta-label">Duration</p>
					<p class="meta-value">12 Weeks</p>
					<p class="meta-note">6 Agile sprints · 2 weeks each · full SDLC every cycle</p>
				</div>
				<div class="meta-block">
					<p class="meta-label">Time commitment</p>
					<p class="meta-value">8–12 hrs / week</p>
					<p class="meta-note">
						Work on your schedule while meeting sprint deadlines and async collaboration.
					</p>
				</div>
				<div class="meta-block price-block">
					<p class="meta-label">Price</p>
					<p class="meta-value">
						<span class="strike">$799</span>
						<span class="now">Founding cohorts</span>
					</p>
					<ul class="price-list">
						{#each foundingPrices as tier}
							<li>
								<span>{tier.label}</span>
								<strong>{tier.price}</strong>
							</li>
						{/each}
					</ul>
					<p class="meta-note">Standard pricing begins at $799.</p>
				</div>
			</div>
		</div>
	</section>

	<section class="band">
		<div class="wrap split">
			<div>
				<p class="section-kicker">Who it's for</p>
				<h2>Built for every seat on the team</h2>
				<p class="section-lede">
					Gain meaningful Agile project experience in the role you're growing into—before
					internships or full-time offers.
				</p>
				<ul class="role-row">
					{#each roles as role}
						<li>{role}</li>
					{/each}
				</ul>
			</div>
			<ul class="plain-list">
				{#each idealFor as item}
					<li>{item}</li>
				{/each}
			</ul>
		</div>
	</section>

	<section class="band tint">
		<div class="wrap">
			<p class="section-kicker">What you'll experience</p>
			<h2>Assigned to a real product team</h2>
			<p class="section-lede measure">
				You'll work alongside product managers, engineers, designers, and QA peers. Every sprint
				builds on the previous one—so software development feels like an ongoing product, not a
				string of exercises.
			</p>
			<ul class="ritual-flow">
				{#each sprintRituals as ritual}
					<li>{ritual}</li>
				{/each}
			</ul>
		</div>
	</section>

	<section class="band" id="linkedin">
		<div class="wrap">
			<p class="section-kicker">Interview-ready proof</p>
			<h2>Get real LinkedIn bullet points you can talk about.</h2>
			<p class="section-lede measure">
				Leave with experience you can put on your profile—and explain in interviews. Not homework.
				Not certificates. Work from a real Agile product team.
			</p>
			<ul class="linkedin-chapters">
				{#each linkedInBullets as group}
					<li>
						<div class="linkedin-head">
							<span class="linkedin-kicker">Example bullets</span>
							<h3>{group.role}</h3>
						</div>
						<ul>
							{#each group.bullets as bullet}
								<li>{bullet}</li>
							{/each}
						</ul>
					</li>
				{/each}
			</ul>
		</div>
	</section>

	<section class="band tint">
		<div class="wrap columns">
			<div>
				<p class="section-kicker">Skills you'll practice</p>
				<h2>From ceremony to release</h2>
				<ul class="dense-list">
					{#each skills as skill}
						<li>{skill}</li>
					{/each}
				</ul>
			</div>
			<div>
				<p class="section-kicker">Tools you'll use</p>
				<h2>Industry stack</h2>
				<ul class="dense-list tools">
					{#each tools as tool}
						<li>{tool}</li>
					{/each}
				</ul>

				<p class="section-kicker spaced">Deliverables</p>
				<h2>A body of work you can show</h2>
				<ul class="dense-list">
					{#each deliverables as d}
						<li>{d}</li>
					{/each}
				</ul>
			</div>
		</div>
	</section>

	<section class="band">
		<div class="wrap split">
			<div>
				<p class="section-kicker">Mentor support</p>
				<h2>Guided every sprint</h2>
				<p class="section-lede">
					Human mentorship where it matters most, with AI-assisted feedback between sessions.
				</p>
			</div>
			<ul class="plain-list">
				{#each mentorSupport as item}
					<li>{item}</li>
				{/each}
			</ul>
		</div>
	</section>

	<section class="band tint">
		<div class="wrap split">
			<div>
				<p class="section-kicker">Graduation</p>
				<h2>What completion requires</h2>
			</div>
			<ul class="plain-list">
				{#each graduation as item}
					<li>{item}</li>
				{/each}
			</ul>
		</div>
	</section>

	<section class="band outcome">
		<div class="wrap narrow">
			<p class="section-kicker light">Program outcome</p>
			<h2>Six releases of Agile team experience</h2>
			<p>
				Graduates leave with a portfolio of real delivery artifacts they can confidently discuss in
				interviews—and the ability to speak from experience about:
			</p>
			<ul class="outcome-list">
				{#each outcomes as item}
					<li>{item}</li>
				{/each}
			</ul>
			<button type="button" class="cta primary on-dark" on:click={() => scrollTo('pricing')}>
				See founding cohort pricing
			</button>
		</div>
	</section>
</div>

<style>
	.residency {
		--ink: #071416;
		--muted: #243940;
		--soft: #3a545c;
		--line: rgba(7, 20, 22, 0.16);
		--accent: #0a5f63;
		--accent-deep: #074144;
		--sand: #d9e8e6;
		--paper: #eef4f3;
		--hero-text: #f7fffe;
		--display: 'Fraunces', Georgia, serif;
		--sans: 'Space Grotesk', GreyCliffCF-Regular, system-ui, sans-serif;
		--body: GreyCliffCF-Regular, 'GreycliffCF-Regular', Georgia, serif;
		color: var(--ink);
		background: var(--paper);
		/* Break out of main max-width so the neon page gradient doesn't flank the content */
		width: 100vw;
		max-width: 100vw;
		margin-left: calc(50% - 50vw);
		margin-right: calc(50% - 50vw);
		overflow: hidden;
	}

	.hero {
		position: relative;
		min-height: min(88vh, 860px);
		display: flex;
		align-items: flex-end;
		padding: 4rem 1.5rem 3.5rem;
		background: #0a4548;
		color: var(--hero-text);
		isolation: isolate;
	}

	.hero-photo {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center 35%;
		z-index: 0;
	}

	.hero-scrim {
		position: absolute;
		inset: 0;
		z-index: 1;
		background:
			linear-gradient(90deg, rgba(6, 32, 34, 0.88) 0%, rgba(6, 32, 34, 0.62) 42%, rgba(6, 32, 34, 0.35) 100%),
			linear-gradient(180deg, rgba(6, 32, 34, 0.25) 0%, rgba(6, 32, 34, 0.55) 55%, rgba(6, 32, 34, 0.82) 100%);
	}

	.hero-plane {
		position: absolute;
		inset: 0;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
		opacity: 0.78;
	}

	.track {
		display: flex;
		align-items: center;
		gap: 0;
		width: min(1100px, 92%);
		transform: translateY(-8%);
	}

	.node {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		opacity: 0;
		transform: translateY(12px);
		color: var(--hero-text);
	}

	.mounted .node {
		animation: rise 0.7s ease forwards;
		animation-delay: calc(0.15s + var(--i) * 0.08s);
	}

	.node-n {
		display: grid;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: 50%;
		border: 2px solid rgba(247, 255, 254, 0.92);
		background: rgba(7, 40, 42, 0.28);
		font-family: var(--sans);
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		color: var(--hero-text);
	}

	.node-label {
		font-family: var(--sans);
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--hero-text);
		opacity: 0.95;
		white-space: nowrap;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
	}

	.connector {
		flex: 1;
		height: 2px;
		background: linear-gradient(90deg, rgba(247, 255, 254, 0.9), rgba(247, 255, 254, 0.35));
		opacity: 0;
		transform: scaleX(0.6);
		transform-origin: left;
	}

	.mounted .connector {
		animation: draw 0.6s ease forwards;
		animation-delay: calc(0.28s + var(--i) * 0.08s);
	}

	.hero-inner {
		position: relative;
		z-index: 3;
		width: min(720px, 100%);
		opacity: 0;
		transform: translateY(18px);
	}

	.photo-credit {
		display: inline-block;
		margin-top: 1.35rem;
		font-family: var(--sans);
		font-size: 0.72rem;
		font-weight: 500;
		letter-spacing: 0.04em;
		color: rgba(247, 255, 254, 0.72);
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}

	.photo-credit:hover {
		color: var(--hero-text);
	}

	.mounted .hero-inner {
		animation: rise 0.85s ease 0.05s forwards;
	}

	.brand {
		margin: 0 0 1rem;
		font-family: var(--sans);
		font-size: clamp(1.65rem, 3.5vw, 2.35rem);
		font-weight: 700;
		letter-spacing: -0.03em;
		line-height: 1.1;
		color: var(--hero-text);
	}

	.hero h1 {
		margin: 0;
		font-family: var(--display);
		font-size: clamp(2.1rem, 5vw, 3.4rem);
		font-weight: 500;
		letter-spacing: -0.02em;
		line-height: 1.12;
		max-width: 14ch;
		text-align: left;
		color: var(--hero-text);
	}

	.lede {
		margin: 1.15rem 0 0;
		font-family: var(--body);
		font-size: 1.15rem;
		line-height: 1.55;
		max-width: 38ch;
		color: rgba(247, 255, 254, 0.94);
	}

	.cta-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 1.75rem;
	}

	.cta {
		font-family: var(--sans);
		font-size: 0.92rem;
		font-weight: 600;
		letter-spacing: 0.01em;
		padding: 0.85rem 1.25rem;
		border-radius: 4px;
		cursor: pointer;
		border: 1.5px solid transparent;
		transition:
			transform 0.2s ease,
			background 0.2s ease,
			color 0.2s ease;
	}

	.cta:hover {
		transform: translateY(-1px);
	}

	.cta.primary {
		background: #f7fffe;
		color: var(--accent-deep);
	}

	.cta.ghost {
		background: rgba(7, 40, 42, 0.2);
		border-color: rgba(247, 255, 254, 0.85);
		color: var(--hero-text);
	}

	.cta.on-dark {
		margin-top: 1.75rem;
	}

	.band {
		padding: 4.5rem 1.5rem;
		background: #f7fbfa;
	}

	.band.tint {
		background: var(--sand);
	}

	.band.intro {
		background: #fbfefe;
	}

	.wrap {
		width: min(1080px, 100%);
		margin: 0 auto;
	}

	.wrap.narrow {
		width: min(680px, 100%);
	}

	.section-kicker {
		margin: 0 0 0.65rem;
		font-family: var(--sans);
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--accent-deep);
	}

	.section-kicker.light {
		color: rgba(247, 255, 254, 0.88);
	}

	.section-kicker.spaced {
		margin-top: 2.5rem;
	}

	h2 {
		margin: 0 0 1rem;
		font-family: var(--display);
		font-size: clamp(1.7rem, 3vw, 2.35rem);
		font-weight: 500;
		letter-spacing: -0.02em;
		line-height: 1.2;
		color: var(--ink);
		text-align: left;
	}

	.section-lede {
		margin: 0;
		font-family: var(--body);
		font-size: 1.08rem;
		line-height: 1.6;
		color: var(--muted);
	}

	.role-row {
		list-style: none;
		margin: 1.35rem 0 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.55rem 1rem;
	}

	.role-row li {
		font-family: var(--sans);
		font-size: 0.88rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		color: var(--accent-deep);
		padding-bottom: 0.15rem;
		border-bottom: 1.5px solid rgba(7, 65, 68, 0.35);
	}

	.section-lede.measure {
		max-width: 46ch;
		margin-bottom: 2rem;
	}

	.intro p {
		font-family: var(--body);
		font-size: 1.15rem;
		line-height: 1.7;
		color: var(--muted);
		margin: 0 0 1.15rem;
	}

	.intro p:last-child {
		margin-bottom: 0;
	}

	.meta-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 2.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid var(--line);
	}

	.meta-label {
		margin: 0 0 0.4rem;
		font-family: var(--sans);
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--accent-deep);
	}

	.meta-value {
		margin: 0;
		font-family: var(--display);
		font-size: 2rem;
		font-weight: 500;
		letter-spacing: -0.02em;
		line-height: 1.15;
		color: var(--ink);
	}

	.meta-value .strike {
		text-decoration: line-through;
		opacity: 0.45;
		font-size: 1.15rem;
		margin-right: 0.45rem;
		color: var(--soft);
	}

	.meta-value .now {
		font-size: 1.35rem;
		color: var(--ink);
	}

	.meta-note {
		margin: 0.65rem 0 0;
		font-family: var(--body);
		font-size: 0.95rem;
		line-height: 1.45;
		color: var(--soft);
	}

	.price-list {
		list-style: none;
		margin: 1rem 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}

	.price-list li {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--line);
		font-family: var(--sans);
		font-size: 0.95rem;
		color: var(--ink);
	}

	.price-list strong {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--ink);
	}

	.split {
		display: grid;
		grid-template-columns: 1.1fr 0.9fr;
		gap: 3rem;
		align-items: start;
	}

	.plain-list {
		list-style: none;
		margin: 0;
		padding: 0;
		border-top: 1px solid var(--line);
	}

	.plain-list li {
		font-family: var(--sans);
		font-size: 1.05rem;
		font-weight: 500;
		padding: 0.95rem 0;
		border-bottom: 1px solid var(--line);
		color: var(--ink);
	}

	.ritual-flow {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.85rem 1.25rem;
		counter-reset: ritual;
	}

	.ritual-flow li {
		font-family: var(--sans);
		font-size: 0.98rem;
		font-weight: 600;
		padding-top: 0.85rem;
		border-top: 2px solid var(--accent-deep);
		color: var(--ink);
		counter-increment: ritual;
	}

	.ritual-flow li::before {
		content: counter(ritual, decimal-leading-zero);
		display: block;
		margin-bottom: 0.35rem;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		color: var(--soft);
	}

	.linkedin-chapters {
		list-style: none;
		margin: 2rem 0 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 2rem 1.75rem;
	}

	.linkedin-chapters > li {
		padding-top: 1rem;
		border-top: 1px solid var(--line);
	}

	.linkedin-kicker {
		display: block;
		font-family: var(--sans);
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--accent-deep);
		margin-bottom: 0.35rem;
	}

	.linkedin-chapters h3 {
		margin: 0 0 0.85rem;
		font-family: var(--display);
		font-size: 1.35rem;
		font-weight: 500;
		letter-spacing: -0.01em;
		color: var(--ink);
	}

	.linkedin-chapters ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.linkedin-chapters ul li {
		font-family: var(--body);
		font-size: 0.95rem;
		line-height: 1.5;
		color: var(--muted);
		padding: 0.45rem 0 0.45rem 0.85rem;
		position: relative;
	}

	.linkedin-chapters ul li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.85rem;
		width: 0.35rem;
		height: 0.35rem;
		border-radius: 50%;
		background: var(--accent-deep);
		opacity: 0.7;
	}

	.columns {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 3rem;
	}

	.dense-list {
		list-style: none;
		margin: 1.25rem 0 0;
		padding: 0;
		columns: 2;
		column-gap: 1.5rem;
	}

	.dense-list.tools {
		columns: 1;
	}

	.dense-list li {
		font-family: var(--sans);
		font-size: 0.92rem;
		font-weight: 500;
		break-inside: avoid;
		padding: 0.4rem 0;
		border-bottom: 1px solid var(--line);
		color: var(--ink);
	}

	.outcome {
		background: linear-gradient(160deg, #0a4548 0%, #0f6f73 55%, #0c5a5d 100%);
		color: var(--hero-text);
		padding-bottom: 5rem;
	}

	.outcome h2,
	.outcome p {
		color: var(--hero-text);
		text-align: left;
	}

	.outcome p {
		font-family: var(--body);
		font-size: 1.1rem;
		line-height: 1.65;
		opacity: 0.95;
		margin: 0 0 1.5rem;
	}

	.outcome-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.outcome-list li {
		font-family: var(--sans);
		font-size: 1.02rem;
		font-weight: 500;
		padding: 0.85rem 0;
		border-top: 1px solid rgba(247, 255, 254, 0.28);
		color: var(--hero-text);
	}

	.outcome-list li:last-child {
		border-bottom: 1px solid rgba(247, 255, 254, 0.28);
	}

	@keyframes rise {
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes draw {
		to {
			opacity: 1;
			transform: scaleX(1);
		}
	}

	@media (max-width: 900px) {
		.meta-grid,
		.split,
		.columns,
		.linkedin-chapters,
		.ritual-flow {
			grid-template-columns: 1fr 1fr;
		}

		.node-label {
			display: none;
		}
	}

	@media (max-width: 640px) {
		.hero {
			min-height: auto;
			padding: 5.5rem 1.15rem 2.75rem;
			align-items: flex-end;
		}

		.hero-plane {
			align-items: flex-start;
			padding-top: 1.5rem;
			opacity: 0.55;
		}

		.hero h1 {
			max-width: none;
		}

		.meta-grid,
		.split,
		.columns,
		.linkedin-chapters,
		.ritual-flow {
			grid-template-columns: 1fr;
			gap: 1.75rem;
		}

		.dense-list {
			columns: 1;
		}

		.cta-row {
			flex-direction: column;
		}

		.cta {
			width: 100%;
			text-align: center;
		}
	}
</style>
