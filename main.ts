import { Plugin } from "obsidian";
import { registerCommands } from "./src/commands";
import { FreezeEmbeddingSettings, DEFAULT_SETTINGS } from "./src/settings";
import { FreezeEmbeddingSettingTab } from "./src/settingsTab";

export default class FreezeEmbeddingPlugin extends Plugin {
	settings: FreezeEmbeddingSettings;

	async onload() {
		await this.loadSettings();

		// Register commands
		registerCommands(this);

		// Add settings tab
		this.addSettingTab(new FreezeEmbeddingSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
