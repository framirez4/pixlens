import type { AppConfig } from "../types/config";

export function buildInitialMerged(
	cli: Partial<AppConfig>,
): Partial<AppConfig> {
	return {
		root: cli.root?.trim() || undefined,
		destination: cli.destination?.trim() || undefined,
		model: cli.model?.trim() || process.env.OLLAMA_MODEL?.trim() || undefined,
		query: cli.query?.trim() || process.env.OLLAMA_QUERY?.trim() || undefined,
	};
}

export function nextConfigField(
	merged: Partial<AppConfig>,
): keyof AppConfig | null {
	if (!merged.root?.trim()) {
		return "root";
	}
	if (merged.destination === undefined || merged.destination === "") {
		return "destination";
	}
	if (!merged.model?.trim()) {
		return "model";
	}
	if (!merged.query?.trim()) {
		return "query";
	}
	return null;
}

export function configRowLabel(key: keyof AppConfig): string {
	switch (key) {
		case "root":
			return "Root directory";
		case "destination":
			return "Destination (empty = same as root)";
		case "model":
			return "Ollama model";
		case "query":
			return "Ollama query";
		default:
			return key;
	}
}

export const configKeys: (keyof AppConfig)[] = ["root", "destination", "model", "query"];

export function configStatus(
	merged: Partial<AppConfig>,
	key: keyof AppConfig,
): string {
	const current = nextConfigField(merged);
	const currentIdx = current ? configKeys.indexOf(current) : configKeys.length;
	const keyIdx = configKeys.indexOf(key);
	if (keyIdx < currentIdx) {
		return "✓";
	}
	if (key === current) {
		return "?";
	}
	return "○";
}
