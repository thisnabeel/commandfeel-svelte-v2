<script>
	import Cropper from 'svelte-easy-crop';
	import getCroppedImg from './canvasUtils';
	import API from '$lib/api/api';
	import { user } from '$lib/stores/user';

	let crop = { x: 0, y: 0 };
	let zoom = 1;
	export let image, fileinput, pixelCrop, croppedImage;
	let imageFile;

	function onFileSelected(e) {
		imageFile = e.target.files[0];
		let reader = new FileReader();
		reader.onload = (e) => {
			image = e.target.result;
		};
		reader.readAsDataURL(imageFile);
	}

	let profilePicture, style;

	function previewCrop(e) {
		pixelCrop = e.detail.pixels;
		const { x, y, width } = e.detail.pixels;
		const scale = 200 / width;
		profilePicture.style = `margin: ${-y * scale}px 0 0 ${-x * scale}px; width: ${
			profilePicture.naturalWidth * scale
		}px;`;
	}

	async function cropImage() {
		croppedImage = await getCroppedImg(image, pixelCrop);

		let fd = new FormData();

		fd.append('avatar_cropped', croppedImage);
		fd.append('avatar_original', imageFile);
		fd.append('user_id', $user.id);
		const res = await API.post('/upload_avatar', fd, {
			'Content-Type': 'multipart/form-data'
		});
		console.log({ res });
	}

	function reset() {
		croppedImage = null;
		image = null;
		imageFile = null;
	}

	function dataURItoBlob(dataURI) {
		// Split the data URI to get the Base64 part
		var base64Index = dataURI.indexOf(';base64,') + ';base64,'.length;
		var base64 = dataURI.substring(base64Index);

		// Decode the Base64 data
		var binary = atob(base64);
		var array = [];
		for (var i = 0; i < binary.length; i++) {
			array.push(binary.charCodeAt(i));
		}

		// Create a Blob from the binary data
		return new Blob([new Uint8Array(array)], { type: 'image/jpeg' });
	}
</script>

{#if !image}
	<input
		type="file"
		accept=".jpg, .jpeg, .png"
		on:change={(e) => onFileSelected(e)}
		bind:this={fileinput}
	/>
{:else}
	<h1>Editing Avatar:</h1>
	<div style="position: relative; width: 100%; height: 300px;">
		<Cropper {image} bind:crop bind:zoom on:cropcomplete={previewCrop} aspect={1} />
	</div>
	<h2>Preview</h2>
	<div class="prof-pic-wrapper">
		<img bind:this={profilePicture} class="prof-pic" src={image} alt="Profile example" {style} />
	</div>
	<br /><button
		type="button"
		class="btn btn-info"
		on:click={async () => {
			cropImage();
		}}>Save Crop</button
	>
	<button type="button" on:click={reset}>Start over?</button>
{/if}

<style>
	.prof-pic-wrapper {
		height: 200px;
		width: 200px;
		position: relative;
		border: solid;
		overflow: hidden;
		border-radius: 100%;
	}

	.prof-pic {
		position: absolute;
	}
	:global(.cropperArea) {
		border-radius: 100%;
	}
</style>
