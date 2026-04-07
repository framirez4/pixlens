import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { getConfig, resetConfigCache } from "./app-loader";

describe("app-loader", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		process.env = { ...originalEnv };
		resetConfigCache();
	});

	afterEach(() => {
		process.env = originalEnv;
		resetConfigCache();
	});

	test("getConfig returns cached instance on subsequent calls", () => {
		process.env.OLLAMA_QUERY = "test query";
		process.env.OLLAMA_MODEL = "test-model";

		const c1 = getConfig();
		const c2 = getConfig();

		expect(c1).toBe(c2);
		expect(c1.ollamaModel).toBe("test-model");
		expect(c1.ollamaQuery).toBe("test query");
	});
});
