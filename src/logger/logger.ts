import pino from "pino";

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
				options: { destination: "./out/app.log" },
			},
		],
	},
});
