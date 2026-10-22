import { App, Plugin, PluginSettingTab, SettingDefinitionItem } from "obsidian";

export interface PluginTemplateSettings {
	mySetting: string;
}

export const DEFAULT_SETTINGS: PluginTemplateSettings = {
	mySetting: "default",
};

export default class ObsidianPluginTemplate extends Plugin {
	settings: PluginTemplateSettings = DEFAULT_SETTINGS;

	async onload(): Promise<void> {
		await this.loadSettings();
		this.addSettingTab(new TemplateSettingTab(this.app, this));
	}

	onunload(): void {
		// Clean up any resources (intervals, event listeners, DOM) here.
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}

export class TemplateSettingTab extends PluginSettingTab {
	plugin: ObsidianPluginTemplate;

	constructor(app: App, plugin: ObsidianPluginTemplate) {
		super(app, plugin);
		this.plugin = plugin;
	}

	// Declarative settings (Obsidian 1.14+)
	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				type: "group",
				heading: "General settings",
				items: [
					{
						name: "Example setting",
						desc: "An example setting description",
						control: {
							type: "text",
							key: "mySetting",
						},
					},
				],
			},
		];
	}

	// Obsidian 1.14 removed per-control onChange; control updates flow through setControlValue.
	async setControlValue(key: string, value: unknown): Promise<void> {
		await super.setControlValue(key, value);
	}
}