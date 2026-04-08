import path from "node:path";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import {
	type Dispatch,
	type SetStateAction,
	useCallback,
	useState,
} from "react";
import type { MoveInstruction } from "../../types/instruction";
import { formatInstructionTree } from "../renderer";

type ReviewMode = "menu" | "editIndex" | "editPath";

type TreeReviewPhaseProps = {
	instructions: MoveInstruction[];
	setInstructions: Dispatch<SetStateAction<MoveInstruction[]>>;
	onConfirm: () => void;
	onCancel: () => void;
};

export function TreeReviewPhase({
	instructions,
	setInstructions,
	onConfirm,
	onCancel,
}: TreeReviewPhaseProps) {
	const [reviewMode, setReviewMode] = useState<ReviewMode>("menu");
	const [editIndexInput, setEditIndexInput] = useState("");
	const [editPathInput, setEditPathInput] = useState("");
	const [editTargetIndex, setEditTargetIndex] = useState<number | null>(null);

	useInput(
		(input, _key) => {
			if (reviewMode === "menu") {
				if (input === "y") {
					onConfirm();
				} else if (input === "n") {
					onCancel();
				} else if (input === "e") {
					setReviewMode("editIndex");
					setEditIndexInput("");
				}
			}
		},
		{ isActive: reviewMode === "menu" },
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
			isActive: reviewMode === "editIndex" || reviewMode === "editPath",
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
		[editTargetIndex, setInstructions],
	);

	return (
		<>
			{reviewMode === "menu" && (
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

			{reviewMode === "editIndex" && (
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

			{reviewMode === "editPath" && (
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
		</>
	);
}
