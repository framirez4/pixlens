import isImage from "is-image";
import ollama from "ollama";
import { logger } from "../logger/logger";

const systemPrompt = `You are an image analysis assistant designed to extract keywords for folder organization.

## Output Requirements
- Return ONLY a short text response: one or more words suitable as folder names
- Use simple, filesystem-safe names (no special characters, no spaces between words, use hyphens or underscores if needed)
- Return ONE label per image. If the label has multiple words, use a hyphen to join them.
- When no relevant content is found, return an empty string: ""
- NEVER return text that is not directly relevant to folder naming (e.g., do not include explanations, justifications, or any additional text)
- It is crucial to adhere strictly to these output requirements to ensure the response can be used directly for organizing files without further processing.
- Do NOT explain, justify, or add any other text

## Behavior
- Focus on extracting practical, organizational keywords
- Prioritize clarity and consistency over creativity
- Keywords should be lowercase unless proper nouns are essential`;

interface QueryImageOptions {
	/**
	 * The model to use for the query
	 */
	model: string;
	/**
	 * The user prompt to use for the query
	 */
	prompt: string;
	/**
	 * The temperature to use for the query
	 */
	temperature?: number;
}

/**
 * Extract text from an image using OCR and regex matching
 * @param source Path to the source image file
 * @returns string with the recognized text or null if no text is found
 * @throws Error if source is null or file format is not allowed
 */
export const queryImage = async (
	source: string,
	options: QueryImageOptions,
): Promise<string | null> => {
	logger.info({ source }, "👓 Reading path:");

	// Validate that the file is an image by checking its metadata
	// If metadata is unreadable, the file is not an image
	// Afterwards return null
	if (!isImage(source)) {
		logger.debug({ source }, "File is not a valid image");
		return null;
	}

	const response = await ollama.chat({
		model: options.model,
		think: false,
		options: {
			temperature: options.temperature || 0.0,
		},
		messages: [
			{
				role: "system",
				content: systemPrompt,
			},
			{
				role: "user",
				content: `Apply the rules above. Task: ${options.prompt}`,
				images: [source],
			},
		],
		format: { type: "string" },
	});

	if (!response.message.content || response.message.content.trim() === "") {
		logger.debug({ source }, "No text detected in image");
		return null;
	}

	logger.info(
		{ extracted: response.message.content },
		`🔍 Recognized text: ${response.message.content}`,
	);

	return response.message.content;
};
