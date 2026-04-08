import fs from "node:fs";
import path from "node:path";
import pino from "pino";

const logFile = path.resolve("out", "app.log");
fs.mkdirSync(path.dirname(logFile), { recursive: true });

export const logger = pino({
	transport: {
		targets: [
			{
				level: "fatal",
				target: "pino-pretty", // console output
				options: {},
			},
			{
				level: "debug",
				target: "pino/file",
				options: { destination: logFile },
			},
		],
	},
});
