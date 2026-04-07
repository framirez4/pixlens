import nodeFs from "node:fs/promises";
import path from "node:path";
import { Box, render, Static, Text, useApp, useInput } from "ink";
import Spinner from "ink-spinner";
import TextInput from "ink-text-input";
import { useCallback, useEffect, useMemo, useState } from "react";
import { collectMoveInstructions } from "../file-organizer/file-organizer";
import { runInstructions } from "../instruction-runner/instruction-runner";
import { formatInstructionTree } from "../renderer/renderer";
import type { AppConfig } from "../types/config";
import type { MoveInstruction } from "../types/instruction";

type Phase =
	| "config"
	| "collecting"
	| "treeReview"
	| "running"
	| "done"
	| "cancelled";

type ReviewMode = "menu" | "editIndex" | "editPath";

function buildInitialMerged(cli: Partial<AppConfig>): Partial<AppConfig> {
	return {
		root: cli.root?.trim() || undefined,
		destination: cli.destination?.trim() || undefined,
		model: cli.model?.trim() || process.env.OLLAMA_MODEL?.trim() || undefined,
		query: cli.query?.trim() || process.env.OLLAMA_QUERY?.trim() || undefined,
	};
}

function nextConfigField(merged: Partial<AppConfig>): keyof AppConfig | null {
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

function configRowLabel(key: keyof AppConfig): string {
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

function configStatus(
	merged: Partial<AppConfig>,
	key: keyof AppConfig,
): string {
	const cur = nextConfigField(merged);
	const order: (keyof AppConfig)[] = ["root", "destination", "model", "query"];
	const curIdx = cur ? order.indexOf(cur) : order.length;
	const keyIdx = order.indexOf(key);
	if (keyIdx < curIdx) {
		return "✓";
	}
	if (key === cur) {
		return "?";
	}
	return "○";
}

type AppProps = {
	initialCli: Partial<AppConfig>;
	autoConfirm: boolean;
};

function App({ initialCli, autoConfirm }: AppProps) {
	const { exit } = useApp();
	const [phase, setPhase] = useState<Phase>("config");
	const [merged, setMerged] = useState<Partial<AppConfig>>(() =>
		buildInitialMerged(initialCli),
	);
	const [configInput, setConfigInput] = useState("");
	const [configError, setConfigError] = useState<string | null>(null);

	const [progressLines, setProgressLines] = useState<string[]>([]);
	const [instructions, setInstructions] = useState<MoveInstruction[]>([]);

	const [reviewMode, setReviewMode] = useState<ReviewMode>("menu");
	const [editIndexInput, setEditIndexInput] = useState("");
	const [editPathInput, setEditPathInput] = useState("");
	const [editTargetIndex, setEditTargetIndex] = useState<number | null>(null);

	const activeField = useMemo(() => nextConfigField(merged), [merged]);

	// Clear the prompt when advancing to the next field (merged updates on each submit).
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

	useEffect(() => {
		if (phase !== "collecting") {
			return;
		}
		let cancelled = false;
		const organizerConfig = {
			root: merged.root as string,
			destination: merged.destination ?? merged.root,
			model: merged.model as string,
			query: merged.query as string,
		};
		const lines: string[] = [];
		(async () => {
			const inst = await collectMoveInstructions(organizerConfig, {
				renderConsoleTree: false,
				onFileProcessed: (e) => {
					if (cancelled) {
						return;
					}
					if (e.type === "start") {
						lines.push(`… ${e.fileName}`);
					} else if (e.type === "skip") {
						lines.push(`⊘ ${e.fileName} (${e.reason})`);
					} else {
						lines.push(`✓ ${e.fileName} → ${e.instruction.newSubPath}`);
					}
					setProgressLines([...lines]);
				},
			});
			if (cancelled) {
				return;
			}
			setInstructions(inst);
			if (autoConfirm) {
				if (inst.length === 0) {
					setPhase("done");
				} else {
					setPhase("running");
				}
			} else if (inst.length === 0) {
				setPhase("done");
			} else {
				setPhase("treeReview");
				setReviewMode("menu");
			}
		})().catch(() => {
			if (!cancelled) {
				exit(new Error("Failed to collect move instructions"));
			}
		});
		return () => {
			cancelled = true;
		};
	}, [
		phase,
		merged.root,
		merged.destination,
		merged.model,
		merged.query,
		autoConfirm,
		exit,
	]);

	useEffect(() => {
		if (phase !== "running") {
			return;
		}
		let cancelled = false;
		(async () => {
			try {
				await runInstructions(instructions);
				if (!cancelled) {
					setPhase("done");
				}
			} catch {
				if (!cancelled) {
					exit(new Error("Failed to run move instructions"));
				}
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [phase, instructions, exit]);

	useEffect(() => {
		if (phase !== "done" && phase !== "cancelled") {
			return;
		}
		const t = setTimeout(() => exit(), 400);
		return () => clearTimeout(t);
	}, [phase, exit]);

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

	useInput(
		(input, _key) => {
			if (phase === "treeReview" && reviewMode === "menu") {
				if (input === "y") {
					setPhase("running");
				} else if (input === "n") {
					setPhase("cancelled");
				} else if (input === "e") {
					setReviewMode("editIndex");
					setEditIndexInput("");
				}
			}
		},
		{ isActive: phase === "treeReview" && reviewMode === "menu" },
	);

	useInput(
		(_input, key) => {
			if (key.escape) {
				setReviewMode("menu");
				setEditTargetIndex(null);
				setEditIndexInput("");
				setEditPathInput("");
			}
		},
		{
			isActive:
				phase === "treeReview" &&
				(reviewMode === "editIndex" || reviewMode === "editPath"),
		},
	);

	const applySubPathEdit = useCallback(
		(value: string) => {
			if (editTargetIndex === null) {
				return;
			}
			const newSubPath = value.trim();
			if (!newSubPath) {
				setReviewMode("menu");
				setEditTargetIndex(null);
				return;
			}
			setInstructions((prev) =>
				prev.map((inst, i) => {
					if (i !== editTargetIndex) {
						return inst;
					}
					return {
						...inst,
						newSubPath,
						destinationPath: path.join(
							inst.destinationDirectory,
							newSubPath,
							inst.fileName,
						),
					};
				}),
			);
			setReviewMode("menu");
			setEditTargetIndex(null);
			setEditPathInput("");
		},
		[editTargetIndex],
	);

	const configKeys: (keyof AppConfig)[] = [
		"root",
		"destination",
		"model",
		"query",
	];

	return (
		<Box flexDirection="column">
			{phase === "config" && activeField && (
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
			)}

			{phase === "collecting" && (
				<Box flexDirection="column">
					<Box>
						<Text color="cyan">
							<Spinner type="dots" />
						</Text>
						<Text> Scanning and classifying images…</Text>
					</Box>
					{progressLines.length > 0 && (
						<Static items={progressLines}>
							{(line, i) => (
								<Text key={`${i}-${line}`} color="gray">
									{line}
								</Text>
							)}
						</Static>
					)}
				</Box>
			)}

			{phase === "treeReview" && reviewMode === "menu" && (
				<Box flexDirection="column" marginBottom={1}>
					<Text bold>Review moves</Text>
					<Text>{formatInstructionTree(instructions)}</Text>
					<Box marginTop={1} flexDirection="column">
						<Text color="gray">
							Indexed files (for edit):{" "}
							{instructions
								.map((inst, i) => `${i + 1}. ${inst.fileName}`)
								.join(", ")}
						</Text>
						<Text>
							[y] confirm and run [n] cancel [e] edit folder by index (Esc
							leaves edit)
						</Text>
					</Box>
				</Box>
			)}

			{phase === "treeReview" && reviewMode === "editIndex" && (
				<Box flexDirection="column">
					<Text>
						Enter file index (1–{instructions.length}), Esc to cancel:
					</Text>
					<TextInput
						value={editIndexInput}
						onChange={setEditIndexInput}
						onSubmit={(v) => {
							const n = Number.parseInt(v.trim(), 10);
							if (Number.isNaN(n) || n < 1 || n > instructions.length) {
								setReviewMode("menu");
								setEditIndexInput("");
								return;
							}
							setEditTargetIndex(n - 1);
							setEditPathInput(instructions[n - 1]?.newSubPath ?? "");
							setReviewMode("editPath");
							setEditIndexInput("");
						}}
					/>
				</Box>
			)}

			{phase === "treeReview" && reviewMode === "editPath" && (
				<Box flexDirection="column">
					<Text>
						New subfolder for {instructions[editTargetIndex ?? 0]?.fileName}:
					</Text>
					<TextInput
						value={editPathInput}
						onChange={setEditPathInput}
						onSubmit={applySubPathEdit}
					/>
				</Box>
			)}

			{phase === "running" && (
				<Box>
					<Text color="cyan">
						<Spinner type="dots" />
					</Text>
					<Text> Moving files…</Text>
				</Box>
			)}

			{phase === "done" && (
				<Text color="green">
					Done. No pending actions (or moves completed).
				</Text>
			)}

			{phase === "cancelled" && (
				<Text color="yellow">Cancelled. No files were moved.</Text>
			)}
		</Box>
	);
}

export async function renderApp(
	cli: Partial<AppConfig>,
	opts?: { autoConfirm?: boolean },
): Promise<void> {
	const instance = render(
		<App initialCli={cli} autoConfirm={opts?.autoConfirm ?? false} />,
	);
	await instance.waitUntilExit();
}
