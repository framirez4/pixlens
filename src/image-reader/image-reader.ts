import ollama from "ollama";
import sharp from "sharp";
import { getConfig } from "../loader/app-loader";

const systemPrompt = `You are an image analysis assistant designed to extract keywords for folder organization.

## Output Requirements
- Return ONLY a short text response: one or more words suitable as folder names
- Use simple, filesystem-safe names (no special characters, no spaces between words, use hyphens or underscores if needed)
- Separate multiple keywords with commas if returning more than one
- If no relevant content is found, return an empty string: ""
- Do NOT explain, justify, or add any other text

## Behavior
- Focus on extracting practical, organizational keywords
- Prioritize clarity and consistency over creativity
- Keywords should be lowercase unless proper nouns are essential`


/**
 * Extract text from an image using OCR and regex matching
 * @param source Path to the source image file
 * @param CropCoords Optional crop coordinates [x0, y0, x1, y1]
 * @returns string with the recognized text or null if no text is found
 * @throws Error if source is null or file format is not allowed
 */
export const queryImage = async (source: string): Promise<string | null> => {
	const configInstance = getConfig();
	console.log("👓 Reading path:", source);
	
	// Validate that the file is an image by checking its metadata
	// If metadata is unreadable, the file is not an image
	// Afterwards return null
	try {
		const image = sharp(source);
		await image.metadata();
	} catch (error) {
		console.error("Error reading image metadata:", error);
		return null;
	}

	const response = await ollama.chat({
		model: configInstance.ollamaModel,
		think: false,
		messages: [
			{
				role: "system",
				content: systemPrompt,
			},
			{
				role: "user",
				content: configInstance.ollamaQuery,
				images: [source],
			},
		],
		format: { type: "string" },
	});

	console.log("🔍 Recognized text:", response.message.content);

	return response.message.content;
};
