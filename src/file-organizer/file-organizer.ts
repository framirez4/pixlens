import nodeFs from "node:fs/promises";
import path from "node:path";
import fs from "fs-extra";
import ollama from "ollama";
import { readImageUrl } from "../image-reader/image-reader";
import { loadConfig } from "../loader/app-loader";

async function extractQuery(text: string): Promise<string> {
	const response = await ollama.chat({
		model: loadConfig().ollamaModel,
		think: false,
		messages: [
			{
				role: "system",
				content: loadConfig().ollamaQuery,
			},
			{
				role: "user",
				content: `Extract the described information from this text: ${text}`,
			},
		],
		format: { type: "string" },
	});

	return response.message.content.trim();
}

/**
 * Organize images from the root directory into user folders based on detected text
 */
export const organizeFiles = async (
	root: string,
	target: string = root,
): Promise<void> => {
	const configInstance = loadConfig();
	try {
		const files = await nodeFs.readdir(root, { withFileTypes: true });

		if (files.length === 0) {
			console.log("No files found in the selected directory.");
			return;
		}

		for (const fileName of files) {
			if (!fileName.isFile()) {
				console.log("Skipping non-file entry:", fileName.name);
				continue;
			}

			const file = path.join(root, fileName.name);
			const coordinates = configInstance.cropCoordinates as [
				number,
				number,
				number,
				number,
			];

			const text = await readImageUrl(file, coordinates);
			if (!text) {
				console.log("No text detected in image:", file);
				continue;
			}

			const username = await extractQuery(text);

			if (!username) {
				console.log("No username extracted from text:", text);
				continue;
			}

			console.log("DETECTED USERNAME:", username);

			if (configInstance.organizeMode) {
				console.log("DETECTED GROUP:", text);
				const newFolder = username;
				const newPath = path.join(target, newFolder, fileName.name);
				console.log("DESTINATION FOLDER:", newFolder);
				await fs.move(file, newPath);
				console.log("✅ Moved file to:", newPath);
			}
		}
	} catch (err) {
		console.error(err);
	}
};
