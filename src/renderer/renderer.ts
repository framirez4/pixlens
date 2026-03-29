import type { MoveInstruction } from "../types/instruction";

export const renderTree = (instructions: MoveInstruction[]): void => {
  const tree: Record<string, string[]> = {};

  for (const instruction of instructions) {
    const { newSubPath, fileName } = instruction;
    if (!tree[newSubPath]) {
      tree[newSubPath] = [];
    }
    tree[newSubPath].push(fileName);
  }

  console.log("Organized File Structure:");
  for (const [subPath, files] of Object.entries(tree)) {
    console.log(`📁 ${subPath}`);
    for (const file of files) {
      console.log(`   📄 ${file}`);
    }
  }
}