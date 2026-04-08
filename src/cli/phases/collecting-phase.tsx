import { Box, Static, Text } from "ink";
import Spinner from "ink-spinner";
import { useEffect, useRef, useState } from "react";
import { collectMoveInstructions } from "../../file-organizer/file-organizer";
import type { MoveInstruction } from "../../types/instruction";

type OrganizerConfig = {
	root: string;
	destination: string;
	model: string;
	query: string;
};

type CollectingPhaseProps = {
	config: OrganizerConfig;
	onComplete: (instructions: MoveInstruction[]) => void;
	onError: () => void;
};

export function CollectingPhase({
	config,
	onComplete,
	onError,
}: CollectingPhaseProps) {
	const [progressLines, setProgressLines] = useState<string[]>([]);
	const onCompleteRef = useRef(onComplete);
	const onErrorRef = useRef(onError);
	onCompleteRef.current = onComplete;
	onErrorRef.current = onError;

	useEffect(() => {
		let cancelled = false;
		const lines: string[] = [];
		(async () => {
			const inst = await collectMoveInstructions(config, {
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
			onCompleteRef.current(inst);
		})().catch(() => {
			if (!cancelled) {
				onErrorRef.current();
			}
		});
		return () => {
			cancelled = true;
		};
	}, [config]);

	return (
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
	);
}
