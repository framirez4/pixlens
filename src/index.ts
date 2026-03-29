import { exit } from "node:process";
import { parseArgs } from "node:util";
import { organizeFiles } from "./file-organizer/file-organizer";
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
			disableOrganize: {
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

	const organizeConfig: OrganizerConfig = {
		root: values.root,
		destination: values.destination,
		disableOrganize: values.disableOrganize,
		model: getConfig().ollamaModel,
		query: getConfig().ollamaQuery,
	};

	await organizeFiles(organizeConfig);
};

main();
