import fs from "node:fs";
import path from "node:path";
import { Transform } from "node:stream";
import pino from "pino";
import * as pinoPretty from "pino-pretty";

const logFile = path.resolve("out", "app.log");
fs.mkdirSync(path.dirname(logFile), { recursive: true });

// Avoid pino's transport workers (thread-stream → real-require): they break under
// `bun build --compile` because worker threads resolve deps differently.
const pretty = pinoPretty.prettyFactory({});
const prettyStdout = new Transform({
	transform(chunk, _enc, cb) {
		try {
			const line = pretty(JSON.parse(chunk.toString().trimEnd()));
			cb(null, `${line}\n`);
		} catch (err) {
			cb(err as Error);
		}
	},
});
prettyStdout.pipe(process.stdout);

export const logger = pino(
	{ level: "debug" },
	pino.multistream([
		{ level: "fatal", stream: prettyStdout },
		{ level: "debug", stream: pino.destination(logFile) },
	]),
);
