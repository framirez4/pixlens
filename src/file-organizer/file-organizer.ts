import nodeFs from "node:fs/promises";
import path from "node:path";
import { queryImage } from "../image-reader/image-reader";
import { runInstructions } from "../instruction-runner/instruction-runner";
import { getConfig } from "../loader/app-loader";
import { logger } from "../logger/logger";
import { renderTree } from "../renderer/renderer";
import type { MoveInstruction, OrganizerConfig } from "../types/instruction";

/**
 * Organize images from the root directory into user folders based on detected text
 */
export const organizeFiles = async ({
	root,
	destination = root,
}: OrganizerConfig): Promise<void> => {
	const configInstance = getConfig();
	const instructions: MoveInstruction[] = [];
	try {
		const files = await nodeFs.readdir(root, { withFileTypes: true });
		const queryImageOptions = {
			model: configInstance.ollamaModel,
			prompt: configInstance.ollamaQuery,
		};

		if (files.length === 0) {
			logger.warn("No files found in the selected directory.");
			return;
		}

		for (const file of files) {
			if (!file.isFile()) {
				logger.warn({ fileName: file.name }, "Skipping non-file entry");
				continue;
			}

			const sourcePath = path.join(root, file.name);

			const extracted = await queryImage(sourcePath, queryImageOptions);

			if (!extracted) {
				logger.info(
					{ sourcePath },
					"Skipping file with no relevant text detected",
				);
				continue;
			}

			const newInstruction = {
				rootDirectory: root,
				destinationDirectory: destination,
				fileName: file.name,
				newSubPath: extracted,
				sourcePath,
				destinationPath: path.join(destination, extracted, file.name),
			};
			logger.info({ newInstruction }, "Generated move instruction");
			instructions.push(newInstruction);
		}

		renderTree(instructions);

		if (configInstance.organizeMode) {
			await runInstructions(instructions);
		}
	} catch (err) {
		logger.error(err);
	}
};
