import { z } from "zod";

// Schema for CROP_COORDINATES - comma-separated numbers like "100,200,300,400"
export const CROP_COORDINATES_SCHEMA = z
	.string()
	.transform((val) => val.split(",").map((coord) => parseInt(coord.trim(), 10)))
	.refine((val) => val.length === 4, "Exactly four coordinates are required")
	.refine(
		(val) => val.every((coord) => !Number.isNaN(coord)),
		"All coordinates must be valid integers",
	)
	.refine(
		(val) => val.every((coord) => coord >= 0),
		"All coordinates must be non-negative",
	);

// Schema for REGEX_SCHEMA - valid regex pattern
export const REGEX_SCHEMA = z
	.string()
	.min(1, "Regex pattern is required")
	.transform((val) => {
		return new RegExp(val);
	});

// Combined environment configuration schema
export const EnvironmentConfigSchema = z.object({
	ollamaQuery: z.string().min(1, "OLLAMA_QUERY is required"),
	ollamaModel: z.string().min(1, "OLLAMA_MODEL is required"),
});

// Type definition for validated environment config
export type EnvironmentConfig = z.infer<typeof EnvironmentConfigSchema>;
