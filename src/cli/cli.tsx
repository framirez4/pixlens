import nodeFs from "node:fs/promises";
import { Box, render, useApp } from "ink";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppConfig } from "../types/config";
import type { MoveInstruction } from "../types/instruction";
import { buildInitialMerged, nextConfigField } from "./config-helpers";
import { CancelledPhase } from "./phases/cancelled-phase";
import { CollectingPhase } from "./phases/collecting-phase";
import { ConfigPhase } from "./phases/config-phase";
import { DonePhase } from "./phases/done-phase";
import { RunningPhase } from "./phases/running-phase";
import { TreeReviewPhase } from "./phases/tree-review-phase";
import type { Phase } from "./types";

type AppProps = {
	initialCli: Partial<AppConfig>;
};

function App({ initialCli }: AppProps) {
	const { exit } = useApp();
	const [phase, setPhase] = useState<Phase>("config");
	const [merged, setMerged] = useState<Partial<AppConfig>>(() =>
		buildInitialMerged(initialCli),
	);
	const [configInput, setConfigInput] = useState("");
	const [configError, setConfigError] = useState<string | null>(null);

	const [instructions, setInstructions] = useState<MoveInstruction[]>([]);

	const activeField = useMemo(() => nextConfigField(merged), [merged]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: run when merged changes after each field submit
	useEffect(() => {
		setConfigInput("");
		setConfigError(null);
	}, [merged]);

	useEffect(() => {
		if (phase !== "config") {
			return;
		}
		if (nextConfigField(merged) === null) {
			setPhase("collecting");
		}
	}, [phase, merged]);

	const organizerConfig = useMemo(() => {
		const root = merged.root as string;
		return {
			root,
			destination: merged.destination ?? root,
			model: merged.model as string,
			query: merged.query as string,
		};
	}, [merged.root, merged.destination, merged.model, merged.query]);

	const handleCollectingComplete = useCallback((inst: MoveInstruction[]) => {
		setInstructions(inst);
		setPhase("treeReview");
	}, []);

	const handleCollectingError = useCallback(() => {
		exit(new Error("Failed to collect move instructions"));
	}, [exit]);

	const handleRunningComplete = useCallback(() => {
		setPhase("done");
	}, []);

	const handleRunningError = useCallback(() => {
		exit(new Error("Failed to run move instructions"));
	}, [exit]);

	const handleTerminalFinish = useCallback(() => {
		exit();
	}, [exit]);

	const submitConfigField = useCallback(
		async (value: string) => {
			const field = nextConfigField(merged);
			if (!field) {
				return;
			}
			setConfigError(null);
			if (field === "root") {
				const v = value.trim();
				if (!v) {
					return;
				}
				try {
					const st = await nodeFs.stat(v);
					if (!st.isDirectory()) {
						setConfigError("Path is not a directory");
						return;
					}
				} catch {
					setConfigError("Directory does not exist or is not readable");
					return;
				}
				setMerged((m) => ({ ...m, root: v }));
				return;
			}
			if (field === "destination") {
				const v = value.trim();
				setMerged((m) => ({
					...m,
					destination: v || (m.root as string),
				}));
				return;
			}
			if (field === "model") {
				const v = value.trim();
				if (!v) {
					return;
				}
				setMerged((m) => ({ ...m, model: v }));
				return;
			}
			if (field === "query") {
				const v = value.trim();
				if (!v) {
					return;
				}
				setMerged((m) => ({ ...m, query: v }));
			}
		},
		[merged],
	);

	return (
		<Box flexDirection="column">
			{phase === "config" && activeField && (
				<ConfigPhase
					merged={merged}
					activeField={activeField}
					configInput={configInput}
					setConfigInput={setConfigInput}
					configError={configError}
					setConfigError={setConfigError}
					submitConfigField={submitConfigField}
				/>
			)}

			{phase === "collecting" && (
				<CollectingPhase
					config={organizerConfig}
					onComplete={handleCollectingComplete}
					onError={handleCollectingError}
				/>
			)}

			{phase === "treeReview" && (
				<TreeReviewPhase
					instructions={instructions}
					setInstructions={setInstructions}
					onConfirm={() => setPhase("running")}
					onCancel={() => setPhase("cancelled")}
				/>
			)}

			{phase === "running" && (
				<RunningPhase
					instructions={instructions}
					onComplete={handleRunningComplete}
					onError={handleRunningError}
				/>
			)}

			{phase === "done" && <DonePhase onFinish={handleTerminalFinish} />}

			{phase === "cancelled" && (
				<CancelledPhase onFinish={handleTerminalFinish} />
			)}
		</Box>
	);
}

export const renderApp = async (config: Partial<AppConfig>): Promise<void> => {
	const instance = render(<App initialCli={config} />);
	await instance.waitUntilExit();
};
