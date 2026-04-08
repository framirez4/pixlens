import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import type { AppConfig } from "../../types/config";
import { configKeys, configRowLabel, configStatus } from "../config-helpers";

type ConfigPhaseProps = {
	merged: Partial<AppConfig>;
	activeField: keyof AppConfig;
	configInput: string;
	setConfigInput: (v: string) => void;
	configError: string | null;
	setConfigError: (v: string | null) => void;
	submitConfigField: (value: string) => void | Promise<void>;
};

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
			{configKeys.map((key) => {
				const status = configStatus(merged, key);
				return (
					<Text key={key}>
						{status} {configRowLabel(key)}: {merged[key]?.toString() ?? ""}
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
