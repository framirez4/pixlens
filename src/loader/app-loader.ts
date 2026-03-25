import { type EnvironmentConfig, EnvironmentConfigSchema } from "../schemas";

export let configInstance: EnvironmentConfig | null = null;

export function getConfig(): EnvironmentConfig {
	if (configInstance) {
		return configInstance;
	}

	const result = EnvironmentConfigSchema.safeParse({
		ollamaQuery: process.env.OLLAMA_QUERY,
		ollamaModel: process.env.OLLAMA_MODEL,
		organizeMode: process.env.ORGANIZE_MODE,
	});

	if (!result.success) {
		const errors = result.error.message;
		throw new Error(`Invalid environment configuration: ${errors}`);
	}

	configInstance = result.data;
	return configInstance;
}
