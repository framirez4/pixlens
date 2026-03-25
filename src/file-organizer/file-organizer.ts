import nodeFs from "node:fs/promises";
import path from "node:path";
import fs from "fs-extra";
import { queryImage } from "../image-reader/image-reader";
import { getConfig } from "../loader/app-loader";

/**
 * Organize images from the root directory into user folders based on detected text
 */
export const organizeFiles = async (
	root: string,
	target: string = root,
): Promise<void> => {
	const configInstance = getConfig();
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

			const text = await queryImage(file)
			if (!text) {
				console.log("No text detected in image:", file);
				continue;
			}

			console.log("DETECTED TEXT:", text);

			if (configInstance.organizeMode) {
				console.log("DETECTED GROUP:", text);
				const newFolder = text;
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
