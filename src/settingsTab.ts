import { App, PluginSettingTab, Setting } from "obsidian";
import FreezeEmbeddingPlugin from "../main";
import { FreezeEmbeddingSettings } from "./settings";

export class FreezeEmbeddingSettingTab extends PluginSettingTab {
	plugin: FreezeEmbeddingPlugin;

	constructor(app: App, plugin: FreezeEmbeddingPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Freeze Embedding Settings" });

		// Save location setting
		new Setting(containerEl)
			.setName("Save location")
			.setDesc("Choose where to save frozen files")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("same-directory", "Same directory as source file")
					.addOption("custom-directory", "Custom directory")
					.setValue(this.plugin.settings.saveLocation)
					.onChange(async (value: "same-directory" | "custom-directory") => {
						this.plugin.settings.saveLocation = value;
						await this.plugin.saveSettings();
						this.display(); // Refresh to show/hide custom directory setting
					})
			);

		// Custom directory setting (only shown when custom-directory is selected)
		if (this.plugin.settings.saveLocation === "custom-directory") {
			new Setting(containerEl)
				.setName("Custom directory")
				.setDesc("Directory path relative to vault root (e.g., 'frozen' or 'archive/frozen')")
				.addText((text) =>
					text
						.setPlaceholder("frozen")
						.setValue(this.plugin.settings.customDirectory)
						.onChange(async (value) => {
							this.plugin.settings.customDirectory = value.trim();
							await this.plugin.saveSettings();
						})
				);
		}

		// Open freeze file setting
		new Setting(containerEl)
			.setName("Open freeze file")
			.setDesc("Automatically open the frozen file after creation")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.openFreezeFile)
					.onChange(async (value) => {
						this.plugin.settings.openFreezeFile = value;
						await this.plugin.saveSettings();
					})
			);
	}
}

