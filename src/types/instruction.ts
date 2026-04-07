export type MoveInstruction = {
	/**
	 * The root directory of the file
	 */
	rootDirectory: string;
	/**
	 * The destination directory of the file
	 */
	destinationDirectory: string;
	/**
	 * The name of the file
	 */
	fileName: string;
	/**
	 * The new subpath that will be appended to the destination directory
	 */
	newSubPath: string;
	/**
	 * Complete source path of the file
	 */
	sourcePath: string;
	/**
	 * Complete destination path of the file
	 */
	destinationPath: string;
};

export type OrganizerConfig = {
	root: string;
	destination?: string;
	disableOrganize?: boolean;
	/** When omitted, falls back to `OLLAMA_MODEL` via getConfig(). */
	model?: string;
	/** When omitted, falls back to `OLLAMA_QUERY` via getConfig(). */
	query?: string;
};
