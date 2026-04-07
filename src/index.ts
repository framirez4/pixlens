import { exit } from "node:process";
import { parseArgs } from "node:util";
import { renderApp } from "./cli/cli";
import { logger } from "./logger/logger";

function hasRequiredForNonInteractive(values: {
	root?: string;
	model?: string;
	query?: string;
}): boolean {
	const root = values.root?.trim();
	const model = values.model?.trim() || process.env.OLLAMA_MODEL?.trim();
	const query = values.query?.trim() || process.env.OLLAMA_QUERY?.trim();
	return Boolean(root && model && query);
}

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
			},
			yes: {
				type: "boolean",
				default: false,
			},
		},
	});

	if (!process.stdin.isTTY) {
		if (!values.yes) {
			logger.error("Non-interactive environment. Use --yes to auto-confirm.");
			exit(1);
		}
		if (!hasRequiredForNonInteractive(values)) {
			logger.error(
				"Non-interactive mode requires --root, --model, and --query (or OLLAMA_MODEL / OLLAMA_QUERY in the environment).",
			);
			exit(1);
		}
	}

	const config = {
		root: values.root,
		destination: values.destination,
		model: values.model,
		query: values.query,
	};

	try {
		await renderApp(config, { autoConfirm: values.yes });
	} catch (err) {
		logger.error(err);
		exit(1);
	}
};

main();
