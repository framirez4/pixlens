import { exit } from "node:process";
import { parseArgs } from "node:util";
import { organizeFiles } from "./file-organizer/file-organizer";
import { getConfig } from "./loader/app-loader";

const main = async () => {
	getConfig();
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
