import nodeFs from "node:fs/promises";
import path from "node:path";
import { queryImage } from "../image-reader/image-reader";
import { runInstructions } from "../instruction-runner/instruction-runner";
import { getConfig } from "../loader/app-loader";
import { logger } from "../logger/logger";
import { renderTree } from "../renderer/renderer";
import type { MoveInstruction, OrganizerConfig } from "../types/instruction";

export type CollectFileProgressEvent =
	| { type: "start"; fileName: string }
	| { type: "skip"; fileName: string; reason: "not-file" | "no-text" }
	| { type: "done"; fileName: string; instruction: MoveInstruction };

export type CollectMoveInstructionsOptions = {
	onFileProcessed?: (event: CollectFileProgressEvent) => void;
	/** When false, skip console tree output (e.g. Ink owns stdout). @default true */
	renderConsoleTree?: boolean;
};

function resolveQueryImageOptions(config: OrganizerConfig): {
	model: string;
	prompt: string;
} {
	if (config.model && config.query) {
		return { model: config.model, prompt: config.query };
	}
	const c = getConfig();
	return {
		model: config.model ?? c.ollamaModel,
		prompt: config.query ?? c.ollamaQuery,
	};
}

/**
 * Collect move instructions by scanning the root directory and querying images.
 * Renders a preview tree and returns the generated instructions without executing them.
 */
export const collectMoveInstructions = async (
	config: OrganizerConfig,
	options?: CollectMoveInstructionsOptions,
): Promise<MoveInstruction[]> => {
	const { root, destination = root } = config;
	const renderConsoleTree = options?.renderConsoleTree !== false;
	const onFileProcessed = options?.onFileProcessed;

	const queryImageOptions = resolveQueryImageOptions(config);
	const instructions: MoveInstruction[] = [];

	try {
		const files = await nodeFs.readdir(root, { withFileTypes: true });

		if (files.length === 0) {
			logger.warn("No files found in the selected directory.");
			return [];
		}

		for (const file of files) {
			if (!file.isFile()) {
				logger.warn({ fileName: file.name }, "Skipping non-file entry");
				onFileProcessed?.({
					type: "skip",
					fileName: file.name,
					reason: "not-file",
				});
				continue;
			}

			const sourcePath = path.join(root, file.name);
			onFileProcessed?.({ type: "start", fileName: file.name });

			const extracted = await queryImage(sourcePath, queryImageOptions);

			if (!extracted) {
				logger.info(
					{ sourcePath },
					"Skipping file with no relevant text detected",
				);
				onFileProcessed?.({
					type: "skip",
					fileName: file.name,
					reason: "no-text",
				});
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
			onFileProcessed?.({
				type: "done",
				fileName: file.name,
				instruction: newInstruction,
			});
		}

		if (renderConsoleTree) {
			renderTree(instructions);
		}
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
