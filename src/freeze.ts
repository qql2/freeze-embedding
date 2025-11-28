import { App, TFile, Notice } from "obsidian";
import { remark } from "remark";
import { remarkObsidian } from "@qql2/remark-obsidian";
import { remarkFreeze } from "remark-freeze";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkStringify from "remark-stringify";
import { FreezeEmbeddingSettings } from "./settings";

/**
 * Freeze the current markdown file by replacing embeds with their content
 */
export async function freezeFile(
	app: App,
	file: TFile
): Promise<string | null> {
	try {
		// Read the current file content
		const content = await app.vault.read(file);

		// Create readFile function for remark-freeze
		const readFile = async (embedNode: any): Promise<string> => {
			const targetPath = embedNode.data.target;

			// Resolve the file path relative to the current file
			const targetFile = app.metadataCache.getFirstLinkpathDest(
				targetPath,
				file.path
			);

			if (!targetFile) {
				throw new Error(`File not found: ${targetPath}`);
			}

			// Read the target file content
			return await app.vault.read(targetFile);
		};

		// Custom text handler: keep default escaping, but undo escapes
		// that break Obsidian-specific syntax like [[wikilinks]] and #tags.
		const handlers: any = {
			text(node: any, parent: any, state: any, info: any) {
				const raw = node.value || "";
				// console.log("handle", node, parent, state, info);
				// // Use default escaping logic first
				// let value = state.safe(raw, info) as string;

				return raw;
			},
		};

		// Create the remark processor
		const processor = remark()
			.use(remarkFrontmatter)
			.use(remarkGfm)
			.use(remarkObsidian)
			.use(remarkFreeze, { readFile })
			.use(remarkStringify, { handlers });

		// Process the markdown content
		const result = await processor.process(content);
		return result.toString();
	} catch (error) {
		console.error("Error freezing file:", error);
		const errorMessage =
			error instanceof Error ? error.message : String(error);
		new Notice(`Error freezing file: ${errorMessage}`);
		return null;
	}
}

/**
 * Save frozen content as a new file with _freeze suffix
 */
export async function saveFrozenFile(
	app: App,
	originalFile: TFile,
	frozenContent: string,
	settings: FreezeEmbeddingSettings
): Promise<TFile | null> {
	try {
		// Generate new filename with _freeze suffix
		const originalPath = originalFile.path;
		const pathParts = originalPath.split("/");
		const fileName = pathParts.pop() || "";
		const originalDirectory = pathParts.join("/");

		// Handle file extension
		const nameParts = fileName.split(".");
		const extension = nameParts.length > 1 ? nameParts.pop() : "";
		const baseName = nameParts.join(".");

		const newFileName = extension
			? `${baseName}_freeze.${extension}`
			: `${baseName}_freeze`;

		// Determine save directory based on settings
		let saveDirectory: string;
		if (
			settings.saveLocation === "custom-directory" &&
			settings.customDirectory
		) {
			// Use custom directory, normalize path
			saveDirectory = settings.customDirectory
				.split("/")
				.filter((part: string) => part.length > 0)
				.join("/");
		} else {
			// Use same directory as source file
			saveDirectory = originalDirectory;
		}

		const newPath = saveDirectory
			? `${saveDirectory}/${newFileName}`
			: newFileName;

		// Ensure the directory exists if using custom directory
		if (settings.saveLocation === "custom-directory" && saveDirectory) {
			const dirExists = await app.vault.adapter.exists(saveDirectory);
			if (!dirExists) {
				await app.vault.createFolder(saveDirectory);
			}
		}

		// Create the new file
		const newFile = await app.vault.create(newPath, frozenContent);
		return newFile;
	} catch (error) {
		console.error("Error saving frozen file:", error);
		const errorMessage =
			error instanceof Error ? error.message : String(error);
		new Notice(`Error saving frozen file: ${errorMessage}`);
		return null;
	}
}
