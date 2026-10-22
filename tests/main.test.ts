import { describe, it, expect } from "vitest";
import ObsidianPluginTemplate, { TemplateSettingTab } from "../src/main";
import { App, SettingDefinitionGroup } from "obsidian";

describe("ObsidianPluginTemplate", () => {
	it("initializes and loads settings", async () => {
		const app = new (App as any)();
		const manifest = { id: "test-plugin", name: "Test Plugin" };
		const plugin = new ObsidianPluginTemplate(app, manifest as any);

		await plugin.onload();
		expect(plugin.settings.mySetting).toBe("default");
	});

	it("supports Obsidian 1.14 declarative settings definitions and control updates", async () => {
		const app = new (App as any)();
		const manifest = { id: "test-plugin", name: "Test Plugin" };
		const plugin = new ObsidianPluginTemplate(app, manifest as any);
		await plugin.onload();

		const tab = new TemplateSettingTab(app, plugin);
		const defs = tab.getSettingDefinitions();
		expect(defs).toHaveLength(1);
		const group = defs[0] as SettingDefinitionGroup;
		expect(group.heading).toBe("General settings");

		await tab.setControlValue("mySetting", "new-value");
		expect(plugin.settings.mySetting).toBe("new-value");
	});
});