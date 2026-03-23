import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { loadConfig } from "./app-loader";

describe.only("app-loader", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = originalEnv;
		loadConfig;
	});

	test("should return cached config instance on subsequent calls", async () => {
		process.env.ROOT_FOLDER = "/test";
		process.env.ALLOWED_FORMATS = "jpg,png";
		process.env.CROP_COORDINATES = "0,0,100,100";

		const config1 = loadConfig();
		const config2 = loadConfig();

		expect(config1).toBe(config2);
	});

	// test("should throw error when validation fails", () => {
	//     process.env.ROOT_FOLDER = undefined;
	//     process.env.ALLOWED_FORMATS = "jpg";
	//     process.env.CROP_COORDINATES = "invalid";

	//     expect(() => getConfig()).toThrow("Invalid environment configuration");
	// });

	// test("should parse valid environment variables correctly", () => {
	//     process.env.ROOT_FOLDER = "/data";
	//     process.env.ALLOWED_FORMATS = "pdf,docx";
	//     process.env.CROP_COORDINATES = "10,20,30,40";

	//     const config = getConfig();

	//     expect(config.rootFolder).toBe("/data");
	//     expect(config.allowedFormats).toEqual(["pdf", "docx"]);
	//     expect(config.cropCoordinates).toEqual([10, 20, 30, 40]);
	// });

	// test("should include field paths in error messages", () => {
	//     process.env.ROOT_FOLDER = "";
	//     process.env.ALLOWED_FORMATS = "";

	//     expect(() => getConfig()).toThrow(/Invalid environment configuration/);
	// });
});
