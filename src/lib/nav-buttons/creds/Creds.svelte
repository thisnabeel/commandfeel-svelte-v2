<script>
	import Api from '$lib/api/api';
	import { goto } from '$app/navigation';
	import { user, credsView } from '$lib/stores/user';

	let username;
	let email;
	let firstName = '';
	let lastName = '';
	let password;
	let confirmPassword;
	let error = '';
	export let hidePopUp;

	$: console.log(username);

	const authenticate = async (verb) => {
		let response;
		error = '';
		try {
			if (verb === 'signIn') {
				response = await Api.post('/users/sign_in.json', {
					login: username,
					password: password
				});
			}

			if (verb === 'signUp') {
				const first = (firstName || '').trim();
				const last = (lastName || '').trim();
				if (!first || !last) {
					error = 'First and last name are required.';
					return;
				}
				response = await Api.post('/users/sign_up.json', {
					user: {
						username: username,
						email: email,
						first_name: first,
						last_name: last,
						password: password,
						password_confirmation: confirmPassword
					}
				});
			}
			console.log(response);
			if (response['id']) {
				user.set(response);
				hidePopUp();
			}
		} catch (err) {
			error =
				err?.response?.data?.errors?.join?.(', ') ||
				err?.response?.data?.error ||
				err?.message ||
				(verb === 'signUp' ? 'Sign up failed.' : 'Sign in failed.');
		}
	};
</script>

{#if $credsView === 'signIn'}
	<div class="form">
		<img src="/sign-in.png" alt="" class="sign-up-img creds-header-img" />

		{#if error}
			<div class="error" role="alert">{error}</div>
		{/if}

		<label>Username or Email:</label>
		<input type="text" bind:value={username} />

		<label>Password:</label>
		<input type="password" bind:value={password} />

		<button on:click={() => authenticate('signIn')}>Log In</button>
		<hr />
		<button type="button" class="register-cta" on:click={() => credsView.set('signUp')}>
			<span class="register-title">Register for free</span>
			<span class="register-sub">No credit card required</span>
		</button>
	</div>
{:else}
	<div class="form">
		<img src="/sign-up.png" alt="" class="sign-up-img creds-header-img" />

		{#if error}
			<div class="error" role="alert">{error}</div>
		{/if}

		<label>First name:</label>
		<input type="text" bind:value={firstName} autocomplete="given-name" />

		<label>Last name:</label>
		<input type="text" bind:value={lastName} autocomplete="family-name" />

		<label>Email:</label>
		<input type="text" bind:value={email} />

		<label>Username:</label>
		<input type="text" bind:value={username} />

		<label>Password:</label>
		<input type="password" bind:value={password} />

		<label>Confirm Password:</label>
		<input type="password" bind:value={confirmPassword} />

		<button on:click={() => authenticate('signUp')}>Sign Up</button>
		<hr />
		<div class="text-center" on:click={() => credsView.set('signIn')}>
			<span>Log In</span>
		</div>
	</div>
{/if}

<style>
	.form {
		max-width: 300px;
		margin: 30px auto;
		background: #fff;
		padding: 30px;
		border-radius: 12px;
		border: 9px solid #f6f8ff;
		box-shadow:
			0 10px 25px rgba(0, 0, 0, 0.1),
			0 6px 12px rgba(0, 0, 0, 0.08);
	}

	img.creds-header-img {
		margin: 10px auto;
		display: block;
		width: 100%;
	}

	input {
		width: 100%;
		font-family: GreyCliffCF-Regular;
		color: rgb(49, 49, 49);
		border: solid 1px #ccc;
		border-radius: 6px;
		padding: 8px 12px;
		margin: 4px 0 12px 0;
	}

	button {
		margin-top: 10px;
		background-color: #fffe8b;
		display: block;
		width: 100%;
		height: calc(1.5em + 0.75rem + 2px);
		padding: 0.375rem 0.75rem;
		font-size: 1rem;
		font-weight: 400;
		line-height: 1.5;
		color: #495057;
		background-clip: padding-box;
		border: 1px solid #ced4da;
		border-radius: 0.25rem;
		transition:
			border-color 0.15s ease-in-out,
			box-shadow 0.15s ease-in-out;
	}

	.register-cta {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.15rem;
		height: auto;
		min-height: 3.1rem;
		margin-top: 0.25rem;
		padding: 0.65rem 0.75rem;
		background: #1e1b4b;
		border: none;
		border-radius: 0.4rem;
		color: #fff;
		cursor: pointer;
		line-height: 1.25;
	}

	.register-cta:hover {
		background: #312e81;
	}

	.register-title {
		font-family: GreyCliffCF-Bold, GreyCliffCF-Regular, system-ui, sans-serif;
		font-size: 0.98rem;
		font-weight: 700;
		color: #fff;
	}

	.register-sub {
		font-family: GreyCliffCF-Regular, system-ui, sans-serif;
		font-size: 0.78rem;
		color: rgba(255, 255, 255, 0.82);
	}

	.error {
		margin-bottom: 0.75rem;
		padding: 0.5rem 0.65rem;
		border-radius: 6px;
		background: #fdecea;
		color: #b02a37;
		font-size: 0.88rem;
	}

	@media (max-width: 768px) {
		.form {
			margin: 20px auto;
			padding: 25px;
			border-width: 6px;
			box-shadow:
				0 15px 35px rgba(0, 0, 0, 0.15),
				0 8px 16px rgba(0, 0, 0, 0.12);
		}
	}
</style>
