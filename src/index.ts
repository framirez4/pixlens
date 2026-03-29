import { exit } from "node:process";
import { parseArgs } from "node:util";
import { organizeFiles } from "./file-organizer/file-organizer";
import { getConfig } from "./loader/app-loader";
import { logger } from "./logger/logger";

const main = async () => {
	logger.info("👋 Starting app...");
	getConfig();
	const { values } = parseArgs({
		args: Bun.argv,
		options: {
			source: {
				type: "string",
			},
			destination: {
				type: "string",
			},
			"disable-organize": {
				type: "boolean",
				default: false,
			},
		},
		strict: true,
		allowPositionals: true,
	});

	if (!values.source) {
		logger.error("Error: --source argument is required");
		exit(1);
	}

	if (!values.destination) {
		logger.warn(
			"Warning: --destination argument is not provided, using source directory as destination",
		);
		values.destination = values.source;
	}

	await organizeFiles(values.source, values.destination);
};

main();
