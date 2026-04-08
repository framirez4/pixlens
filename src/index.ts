import { exit } from "node:process";
import { parseArgs } from "node:util";
import { renderApp } from "./cli/cli";
import { logger } from "./logger/logger";

const main = async () => {
	logger.info("👋 Starting app...");
	const { values } = parseArgs({
		args: Bun.argv,
		strict: true,
		allowPositionals: true,
		options: {
			root: {
				type: "string",
			},
			destination: {
				type: "string",
			},
			model: {
				type: "string",
			},
			query: {
				type: "string",
			}
		},
	});

	const config = {
		root: values.root,
		destination: values.destination,
		model: values.model,
		query: values.query,
	};

	try {
		await renderApp(config);
	} catch (err) {
		logger.error(err);
		exit(1);
	}
};

main();
