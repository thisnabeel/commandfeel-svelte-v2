import { json } from '@sveltejs/kit';
import { VITE_REPLICATE_API_TOKEN } from '$env/static/private';

export async function POST({ request }) {
	try {
		const { prompt } = await request.json();

		const response = await fetch('https://api.replicate.com/v1/predictions', {
			method: 'POST',
			headers: {
				Authorization: `Token ${VITE_REPLICATE_API_TOKEN}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				version:
					'stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc',
				input: {
					width: 1024,
					height: 1024,
					prompt,
					refine: 'no_refiner',
					scheduler: 'K_EULER',
					lora_scale: 0.6,
					num_outputs: 1,
					guidance_scale: 7.5,
					apply_watermark: true,
					high_noise_frac: 0.8,
					negative_prompt: '',
					prompt_strength: 0.8,
					num_inference_steps: 50
				}
			})
		});

		if (!response.ok) {
			const error = await response.json();
			return json(
				{ error: error.detail || 'Failed to generate image' },
				{ status: response.status }
			);
		}

		const prediction = await response.json();

		// Poll for the result
		let result = prediction;
		while (result.status !== 'succeeded' && result.status !== 'failed') {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			const pollResponse = await fetch(
				`https://api.replicate.com/v1/predictions/${prediction.id}`,
				{
					headers: {
						Authorization: `Token ${VITE_REPLICATE_API_TOKEN}`,
						'Content-Type': 'application/json'
					}
				}
			);
			result = await pollResponse.json();
		}

		if (result.status === 'failed') {
			return json({ error: 'Image generation failed' }, { status: 500 });
		}

		return json({ output: result.output });
	} catch (error) {
		console.error('Error generating image:', error);
		return json({ error: 'Failed to generate image' }, { status: 500 });
	}
}
