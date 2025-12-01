import { App, TFile, Notice, MarkdownRenderer, Component } from "obsidian";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import remarkStringify from "remark-stringify";
import { debug as _debug } from "debug";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
const debug = _debug("fe:freezeHtml");

/**
 * Freeze file by rendering to HTML first, then converting back to markdown
 * This approach uses Obsidian's MarkdownRenderer to handle all Obsidian-specific syntax
 */
export async function freezeFileViaHtml(
	app: App,
	file: TFile
): Promise<string | null> {
	try {
		console.log("qql1 test");
		debug("Starting freeze process for file: %s", file.path);

		// Read the current file content
		const markdownContent = await app.vault.read(file);
		debug("Read markdown content, length: %d", markdownContent.length);

		// Create a temporary container element for rendering
		const container = document.createElement("div");
		container.style.display = "none"; // Hide it

		// Use Obsidian's MarkdownRenderer to render markdown to HTML
		// This will handle all Obsidian-specific syntax including block references
		debug("Rendering markdown to HTML...");
		await MarkdownRenderer.render(
			app,
			markdownContent,
			container,
			file.path,
			new Component()
		);

		// Get the rendered HTML
		const htmlContent = container.innerHTML;
		debug("Rendered HTML content, length: %d", htmlContent.length);
		debug("HTML", htmlContent);
		// Use unified to parse HTML and convert to markdown
		debug("Converting HTML to markdown...");
		const processor = unified()
			.use(rehypeParse) // Parse HTML to HAST
			.use(remarkFrontmatter)
			.use(remarkGfm)
			.use(rehypeRemark) // Convert HAST to MDAST
			.use(remarkStringify); // Convert MDAST to markdown string

		const result = await processor.process(htmlContent);
		const frozenContent = String(result.value);
		debug("Frozen content generated, length: %d", frozenContent.length);

		// Clean up
		container.remove();

		return frozenContent;
	} catch (error) {
		console.error("Error freezing file via HTML:", error);
		const errorMessage =
			error instanceof Error ? error.message : String(error);
		new Notice(`Error freezing file via HTML: ${errorMessage}`);
		return null;
	}
}
