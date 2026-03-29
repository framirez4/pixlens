import { logger } from "../logger/logger";
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
		logger.error({ errors }, "Error loading configuration")
		throw new Error(`Invalid environment configuration: ${errors}`);
	}
	
	logger.debug("Configuration loaded correctly")
	
	configInstance = result.data;
	return configInstance;
}
