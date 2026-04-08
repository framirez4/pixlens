import type { MoveInstruction } from "../types/instruction";

export function formatInstructionTree(instructions: MoveInstruction[]): string {
	const tree: Record<string, string[]> = {};

	for (const instruction of instructions) {
		const { newSubPath, fileName } = instruction;
		if (!tree[newSubPath]) {
			tree[newSubPath] = [];
		}
		tree[newSubPath].push(fileName);
	}

	const lines: string[] = ["Organized File Structure:"];
	for (const [subPath, files] of Object.entries(tree)) {
		lines.push(`📁 ${subPath}`);
		for (const file of files) {
			lines.push(`   📄 ${file}`);
		}
	}
	return lines.join("\n");
}
