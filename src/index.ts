import { exit } from "node:process";
import { parseArgs } from "node:util";
import { organizeFiles } from "./file-organizer/file-organizer";
import { loadConfig } from "./loader/app-loader";

const main = async () => {
	loadConfig();
	const { values } = parseArgs({
		args: Bun.argv,
		options: {
			source: {
				type: "string",
			},
			target: {
				type: "string",
			},
		},
		strict: true,
		allowPositionals: true,
	});

	if (!values.source) {
		console.error("Error: --source argument is required");
		exit(1);
	}

	await organizeFiles(values.source, values.target);
};

main();
