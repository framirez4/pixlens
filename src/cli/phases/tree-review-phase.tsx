import path from "node:path";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import {
	type Dispatch,
	type SetStateAction,
	useCallback,
	useMemo,
	useState,
} from "react";
import type { MoveInstruction } from "../../types/instruction";

type ReviewMode = "menu" | "editIndex" | "editPath";

function orderedUniqueSubPaths(instructions: MoveInstruction[]): string[] {
	const seen = new Set<string>();
	const order: string[] = [];
	for (const inst of instructions) {
		if (!seen.has(inst.newSubPath)) {
			seen.add(inst.newSubPath);
			order.push(inst.newSubPath);
		}
	}
	return order;
}

/** Same grouping as `formatInstructionTree`, with a 1-based index beside each folder row. */
function formatInstructionTreeWithFolderIndices(
	instructions: MoveInstruction[],
): string {
	const tree: Record<string, string[]> = {};
	for (const instruction of instructions) {
		const { newSubPath, fileName } = instruction;
		if (!tree[newSubPath]) {
			tree[newSubPath] = [];
		}
		tree[newSubPath].push(fileName);
	}
	const lines: string[] = ["Organized File Structure:"];
	let folderIndex = 1;
	for (const subPath of orderedUniqueSubPaths(instructions)) {
		const files = tree[subPath] ?? [];
		lines.push(`${folderIndex} 📁 ${subPath}`);
		folderIndex += 1;
		for (const file of files) {
			lines.push(`   📄 ${file}`);
		}
	}
	return lines.join("\n");
}

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
	const folderOrder = useMemo(
		() => orderedUniqueSubPaths(instructions),
		[instructions],
	);
	const [reviewMode, setReviewMode] = useState<ReviewMode>("menu");
	const [editIndexInput, setEditIndexInput] = useState("");
	const [editPathInput, setEditPathInput] = useState("");
	const [editTargetSubPath, setEditTargetSubPath] = useState<string | null>(
		null,
	);

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
				setEditTargetSubPath(null);
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
			if (editTargetSubPath === null) {
				return;
			}
			const newSubPath = value.trim();
			if (!newSubPath) {
				setReviewMode("menu");
				setEditTargetSubPath(null);
				return;
			}
			const oldSubPath = editTargetSubPath;
			setInstructions((prev) =>
				prev.map((inst) => {
					if (inst.newSubPath !== oldSubPath) {
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
			setEditTargetSubPath(null);
			setEditPathInput("");
		},
		[editTargetSubPath, setInstructions],
	);

	return (
		<Box flexDirection="column" marginBottom={1}>
			<Text bold>Review moves</Text>
			<Text>{formatInstructionTreeWithFolderIndices(instructions)}</Text>

			{reviewMode === "menu" && (
				<Box marginTop={1} flexDirection="column">
					<Text>
						[y] confirm and run [n] cancel [e] edit folder by tree index (Esc
						leaves edit)
					</Text>
				</Box>
			)}

			{reviewMode === "editIndex" && (
				<Box marginTop={1} flexDirection="column">
					<Text>
						Enter folder index (1–{folderOrder.length}), Esc to cancel:
					</Text>
					<TextInput
						value={editIndexInput}
						onChange={setEditIndexInput}
						onSubmit={(v) => {
							const folders = folderOrder;
							const n = Number.parseInt(v.trim(), 10);
							if (Number.isNaN(n) || n < 1 || n > folders.length) {
								setReviewMode("menu");
								setEditIndexInput("");
								return;
							}
							const subPath = folders[n - 1];
							if (subPath === undefined) {
								setReviewMode("menu");
								setEditIndexInput("");
								return;
							}
							setEditTargetSubPath(subPath);
							setEditPathInput(subPath);
							setReviewMode("editPath");
							setEditIndexInput("");
						}}
					/>
				</Box>
			)}

			{reviewMode === "editPath" && (
				<Box marginTop={1} flexDirection="column">
					<Text>
						New subfolder name for 📁 {editTargetSubPath} (all files in this
						folder):
					</Text>
					<TextInput
						value={editPathInput}
						onChange={setEditPathInput}
						onSubmit={applySubPathEdit}
					/>
				</Box>
			)}
		</Box>
	);
}
