import { MarkdownView, Notice } from "obsidian";
import FreezeEmbeddingPlugin from "../main";
import { freezeFile, saveFrozenFile } from "./freeze";
import { freezeFileViaHtml } from "./freezeHtml";

/**
 * Register all commands for the plugin
 */
export function registerCommands(plugin: FreezeEmbeddingPlugin) {
	plugin.addCommand({
		id: "freeze-current-file",
		name: "Freeze current file",
		checkCallback: (checking: boolean) => {
			const markdownView =
				plugin.app.workspace.getActiveViewOfType(MarkdownView);
			if (markdownView) {
				if (!checking) {
					handleFreezeCommand(plugin, markdownView);
				}
				return true;
			}
			return false;
		},
	});

	plugin.addCommand({
		id: "freeze-current-file-via-html",
		name: "Freeze current file (via HTML render)",
		checkCallback: (checking: boolean) => {
			const markdownView =
				plugin.app.workspace.getActiveViewOfType(MarkdownView);
			if (markdownView) {
				if (!checking) {
					handleFreezeViaHtmlCommand(plugin, markdownView);
				}
				return true;
			}
			return false;
		},
	});
}

/**
 * Handle the freeze command
 */
async function handleFreezeCommand(
	plugin: FreezeEmbeddingPlugin,
	view: MarkdownView
): Promise<void> {
	const file = view.file;
	if (!file) {
		new Notice("No file is currently open.");
		return;
	}

	// Show processing notice
	new Notice("Freezing file...");

	// Freeze the file content
	const frozenContent = await freezeFile(plugin.app, file);
	if (!frozenContent) {
		return;
	}

	// Save as new file
	const newFile = await saveFrozenFile(
		plugin.app,
		file,
		frozenContent,
		plugin.settings
	);
	if (newFile) {
		new Notice(`File frozen and saved as: ${newFile.name}`);

		// Open the frozen file if setting is enabled
		if (plugin.settings.openFreezeFile) {
			const leaf = plugin.app.workspace.getLeaf(true);
			await leaf.openFile(newFile);
		}
	}
}

/**
 * Handle the freeze via HTML command (test command)
 */
async function handleFreezeViaHtmlCommand(
	plugin: FreezeEmbeddingPlugin,
	view: MarkdownView
): Promise<void> {
	const file = view.file;
	if (!file) {
		new Notice("No file is currently open.");
		return;
	}

	// Show processing notice
	new Notice("Freezing file via HTML render...");

	// Freeze the file content using HTML render method
	const frozenContent = await freezeFileViaHtml(plugin.app, file);
	if (!frozenContent) {
		return;
	}

	// Save as new file with _freeze_html suffix
	const originalPath = file.path;
	const pathParts = originalPath.split("/");
	const fileName = pathParts.pop() || "";
	const nameParts = fileName.split(".");
	const extension = nameParts.length > 1 ? nameParts.pop() : "";
	const baseName = nameParts.join(".");

	const newFileName = extension
		? `${baseName}_freeze_html.${extension}`
		: `${baseName}_freeze_html`;

	const directory = pathParts.join("/");
	const newPath = directory ? `${directory}/${newFileName}` : newFileName;

	try {
		const newFile = await plugin.app.vault.create(newPath, frozenContent);
		new Notice(`File frozen (via HTML) and saved as: ${newFile.name}`);

		// Open the frozen file if setting is enabled
		if (plugin.settings.openFreezeFile) {
			const leaf = plugin.app.workspace.getLeaf(true);
			await leaf.openFile(newFile);
		}
	} catch (error) {
		console.error("Error saving frozen file:", error);
		const errorMessage =
			error instanceof Error ? error.message : String(error);
		new Notice(`Error saving frozen file: ${errorMessage}`);
	}
}
