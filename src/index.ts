import { exit } from "node:process";
import { parseArgs } from "node:util";
import readline from "node:readline/promises";
import { collectMoveInstructions } from "./file-organizer/file-organizer";
import { runInstructions } from "./instruction-runner/instruction-runner";
import { getConfig } from "./loader/app-loader";
import { logger } from "./logger/logger";
import type { OrganizerConfig } from "./types/instruction";

const main = async () => {
	logger.info("👋 Starting app...");
	getConfig();
	const { values } = parseArgs({
		args: Bun.argv,
		options: {
			root: {
				type: "string",
			},
			destination: {
				type: "string",
			},
			yes: {
				type: "boolean",
				default: false,
			},
		},
		strict: true,
		allowPositionals: true,
	});

	if (!values.root) {
		logger.error("Error: --root argument is required");
		exit(1);
	}

	if (!values.destination) {
		logger.warn(
			"Warning: --destination argument is not provided, using source directory as destination",
		);
		values.destination = values.root;
	}

	const configInstance = getConfig();

	const organizeConfig: OrganizerConfig = {
		root: values.root,
		destination: values.destination,
		model: configInstance.ollamaModel,
		query: configInstance.ollamaQuery,
	};

	const instructions = await collectMoveInstructions(organizeConfig);

	if (!instructions || instructions.length === 0) {
		logger.info("No move instructions generated; nothing to do.");
		return;
	}

	if (values.yes) {
		await runInstructions(instructions);
		return;
	}

	if (!process.stdin.isTTY) {
		logger.error("Non-interactive environment. Use --yes to auto-confirm.");
		exit(1);
	}

	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	try {
		const answer = (await rl.question("Proceed with moving files? (y/N): "))
			.trim()
			.toLowerCase();
		if (answer === "y" || answer === "yes") {
			await runInstructions(instructions);
		} else {
			logger.info("Operation aborted by user.");
		}
	} finally {
		rl.close();
	}
};

main();
