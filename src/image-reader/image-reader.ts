import ollama from "ollama";
import sharp from "sharp";

/**
 * Extract text from an image using OCR and regex matching
 * @param source Path to the source image file
 * @param CropCoords Optional crop coordinates [x0, y0, x1, y1]
 * @returns string with the recognized text or null if no text is found
 * @throws Error if source is null or file format is not allowed
 */
export const readImageUrl = async (
	source: string,
	cropCoordinates: [number, number, number, number],
): Promise<string | null> => {
	try {
		console.log("👓 Reading path:", source);
		const image = sharp(source);

		try {
			await image.metadata();
			const [left, top, width, height] = cropCoordinates;
			const extracted = await image.extract({ left, top, width, height });
			await extracted.toFile("./cropped_image.png");
			const croppedBuffer = await extracted.toBuffer();

			const response = await ollama.chat({
				model: "glm-ocr:latest",
				messages: [
					{
						role: "user",
						content: "What is in this image?",
						images: [croppedBuffer],
					},
				],
			});
			console.log("🔍 Recognized text:", response.message.content);

			return response.message.content;
		} catch (error) {
			console.error("Error processing image with sharp:", error);
		}
	} catch (error) {
		console.error("Error processing image:", error);
	}

	return null;
};
