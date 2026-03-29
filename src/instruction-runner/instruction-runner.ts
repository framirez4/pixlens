import fs from "fs-extra";
import { logger } from "../logger/logger";
import type { MoveInstruction } from "../types/instruction";

export const runInstructions = async (instructions: MoveInstruction[]): Promise<void> => {
	for (const instruction of instructions) {
    await moveFile(instruction);
	}

}

const moveFile = async (instruction: MoveInstruction): Promise<void> => {
  logger.info(`Moving file from ${instruction.sourcePath} to ${instruction.destinationPath}`);
  await fs.move(instruction.sourcePath, instruction.destinationPath);
}