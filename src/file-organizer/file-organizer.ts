import nodeFs from "node:fs/promises";
import path from "node:path";
import { queryImage } from "../image-reader/image-reader";
import { runInstructions } from "../instruction-runner/instruction-runner";
import { getConfig } from "../loader/app-loader";
import { logger } from "../logger/logger";
import { renderTree } from "../renderer/renderer";
import type { MoveInstruction, OrganizerConfig } from "../types/instruction";

/**
 * Collect move instructions by scanning the root directory and querying images.
 * Renders a preview tree and returns the generated instructions without executing them.
 */
export const collectMoveInstructions = async ({
	root,
	destination = root,
}: OrganizerConfig): Promise<MoveInstruction[]> => {
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
			return [];
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

			const newInstruction: MoveInstruction = {
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
		return instructions;
	} catch (err) {
		logger.error(err);
		return [];
	}
};

/**
 * Backwards-compatible wrapper that collects instructions and runs them
 * when the environment `organizeMode` is enabled.
 */
export const organizeFiles = async (config: OrganizerConfig): Promise<void> => {
	const instructions = await collectMoveInstructions(config);
	const configInstance = getConfig();
	if (configInstance.organizeMode) {
		await runInstructions(instructions);
	}
};
