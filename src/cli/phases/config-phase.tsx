import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import type { AppConfig } from "../../types/config";
import { configRowLabel, configStatus } from "../config-helpers";

type ConfigPhaseProps = {
	merged: Partial<AppConfig>;
	activeField: keyof AppConfig;
	configInput: string;
	setConfigInput: (v: string) => void;
	configError: string | null;
	setConfigError: (v: string | null) => void;
	submitConfigField: (value: string) => void | Promise<void>;
};

const configKeys: (keyof AppConfig)[] = [
	"root",
	"destination",
	"model",
	"query",
];

export function ConfigPhase({
	merged,
	activeField,
	configInput,
	setConfigInput,
	configError,
	setConfigError,
	submitConfigField,
}: ConfigPhaseProps) {
	return (
		<Box flexDirection="column" marginBottom={1}>
			<Text bold>Configuration</Text>
			{configKeys.map((k) => {
				const st = configStatus(merged, k);
				const suffix =
					st === "✓"
						? k === "query" && merged.query
							? `: ${merged.query.slice(0, 48)}${merged.query.length > 48 ? "…" : ""}`
							: k === "root" && merged.root
								? `: ${merged.root}`
								: k === "destination" && merged.destination
									? `: ${merged.destination}`
									: k === "model" && merged.model
										? `: ${merged.model}`
										: ""
						: "";
				return (
					<Text key={k}>
						{st} {configRowLabel(k)}
						{suffix}
					</Text>
				);
			})}
			{configError && <Text color="red">{configError}</Text>}
			<Box marginTop={1}>
				<Text>{configRowLabel(activeField)}: </Text>
				<TextInput
					value={configInput}
					onChange={(v) => {
						setConfigInput(v);
						setConfigError(null);
					}}
					onSubmit={(v) => {
						void submitConfigField(v);
					}}
					placeholder={
						activeField === "destination"
							? "(Enter for same as root)"
							: undefined
					}
				/>
			</Box>
		</Box>
	);
}
