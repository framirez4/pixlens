import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import { useEffect, useRef } from "react";
import { runInstructions } from "../../instruction-runner/instruction-runner";
import type { MoveInstruction } from "../../types/instruction";

type RunningPhaseProps = {
	instructions: MoveInstruction[];
	onComplete: () => void;
	onError: () => void;
};

export function RunningPhase({
	instructions,
	onComplete,
	onError,
}: RunningPhaseProps) {
	const onCompleteRef = useRef(onComplete);
	const onErrorRef = useRef(onError);
	onCompleteRef.current = onComplete;
	onErrorRef.current = onError;

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				await runInstructions(instructions);
				if (!cancelled) {
					onCompleteRef.current();
				}
			} catch {
				if (!cancelled) {
					onErrorRef.current();
				}
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [instructions]);

	return (
		<Box>
			<Text color="cyan">
				<Spinner type="dots" />
			</Text>
			<Text> Moving files…</Text>
		</Box>
	);
}
