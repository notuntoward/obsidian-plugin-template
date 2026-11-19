import { describe, it, expect, vi } from "vitest";
import ObsidianPluginTemplate, { TemplateSettingTab } from "../src/main";
import { App, SettingDefinitionGroup } from "obsidian";

describe("ObsidianPluginTemplate", () => {
	it("initializes and loads settings", async () => {
		const app = new (App as any)();
		const manifest = { id: "test-plugin", name: "Test Plugin" };
		const plugin = new ObsidianPluginTemplate(app, manifest as any);

		await plugin.onload();
		expect(plugin.settings.exampleText).toBe("default");
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

		await tab.setControlValue("exampleText", "new-value");
		expect(plugin.settings.exampleText).toBe("new-value");
	});

	it("loads the previous sample setting key as a migration fallback", async () => {
		const app = new (App as any)();
		const manifest = { id: "test-plugin", name: "Test Template" };
		const plugin = new ObsidianPluginTemplate(app, manifest as any);
		vi.spyOn(plugin, "loadData").mockResolvedValue({ mySetting: "saved-value" });

		await plugin.loadSettings();

		expect(plugin.settings.exampleText).toBe("saved-value");
	});

	it("ignores invalid persisted settings", async () => {
		const app = new (App as any)();
		const manifest = { id: "test-plugin", name: "Test Template" };
		const plugin = new ObsidianPluginTemplate(app, manifest as any);
		vi.spyOn(plugin, "loadData").mockResolvedValue({ exampleText: 42 });

		await plugin.loadSettings();

		expect(plugin.settings.exampleText).toBe("default");
	});
});