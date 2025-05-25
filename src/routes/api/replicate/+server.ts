import { json } from '@sveltejs/kit';
import { VITE_REPLICATE_API_TOKEN } from '$env/static/private';
import Replicate from 'replicate';

export async function POST({ request }) {
	try {
		const { prompt } = await request.json();

		const replicate = new Replicate({
			auth: VITE_REPLICATE_API_TOKEN
		});

		const prediction = await replicate.predictions.create({
			version: 'google/imagen-3',
			input: {
				prompt: `modern cheery illustration style: ${prompt}`,
				aspect_ratio: '1:1',
				safety_filter_level: 'block_medium_and_above'
			}
		});

		// Wait for the prediction to complete
		const result = await replicate.wait(prediction);

		if (result?.output) {
			return json({ imageUrl: result.output });
		} else {
			console.error('No output in prediction result:', result);
			return json({ error: 'No image generated' }, { status: 500 });
		}
	} catch (error) {
		console.error('Error generating image:', error);
		return json({ error: 'Failed to generate image' }, { status: 500 });
	}
}
