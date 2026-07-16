#!/usr/bin/env node
/**
 * Generate E2E fixtures and specs for ALP-55 package coverage.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packagesDir = path.join(root, "packages");

/** @type {Record<string, { main: string; html: string; spec: string }>} */
const PACKAGES = {
  core: {
    main: `import { definePlugin, initPluginsSync, registerPlugin } from "@ailuracode/alpine-plugin-registry";
import themePlugin from "@ailuracode/alpine-theme";
import Alpine from "alpinejs";

registerPlugin(
  "theme",
  definePlugin(["store"], {
    names: ["theme"],
    plugin: themePlugin({ defaultTheme: "light", strategy: "class", darkClass: "theme-dark", lightClass: "theme-light" }),
  })
);

initPluginsSync(Alpine, ["theme"]);
Alpine.start();
`,
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@ailuracode/alpine-core E2E fixture</title>
  </head>
  <body>
    <main id="app" data-e2e-ready="true" x-data x-init>
      <h1>Core E2E fixture</h1>
      <p>Resolved theme: <output id="resolved-theme" x-text="$store.theme.resolved"></output></p>
      <button type="button" @click="$store.theme.toggle()">Toggle theme</button>
    </main>
    <script type="module" src="/app.js"></script>
  </body>
</html>
`,
    spec: `import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-core", () => {
  test("initializes registered plugins through initPluginsSync", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.getByRole("heading", { name: "Core E2E fixture" })).toBeVisible();
    await expect(page.locator("#resolved-theme")).toHaveText("light");
  });

  test("exposes plugin store behavior in real markup", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Toggle theme" }).click();
    await expect(page.locator("#resolved-theme")).toHaveText("dark");
    await expect(page.locator("html")).toHaveClass(/theme-dark/);
  });
});
`,
  },

  child: {
    main: `import morph from "@alpinejs/morph";
import childPlugin from "@ailuracode/alpine-child";
import Alpine from "alpinejs";

Alpine.plugin(morph);
Alpine.plugin(childPlugin());
Alpine.start();
`,
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@ailuracode/alpine-child E2E fixture</title>
  </head>
  <body>
    <main id="app" data-e2e-ready="true" x-data="{ clicked: false }">
      <h1>Child E2E fixture</h1>
      <div x-child id="wrapper" class="wrapper-class" style="border: 1px solid #ccc;">
        <button id="child-button" type="button" class="child-class" @click="clicked = true">Child action</button>
      </div>
      <output id="click-state" x-text="clicked ? 'clicked' : 'idle'"></output>
    </main>
    <script type="module" src="/app.js"></script>
  </body>
</html>
`,
    spec: `import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-child", () => {
  test("unwraps the wrapper and keeps the child element", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.locator("#wrapper")).toHaveCount(0);
    await expect(page.locator("#child-button")).toBeVisible();
  });

  test("transfers bindings and click handlers to the child", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.locator("#click-state")).toHaveText("idle");
    await page.getByRole("button", { name: "Child action" }).click();
    await expect(page.locator("#click-state")).toHaveText("clicked");
  });
});
`,
  },

  overlay: {
    main: `import overlayPlugin from "@ailuracode/alpine-overlay";
import Alpine from "alpinejs";

Alpine.plugin(overlayPlugin({ root: "#overlay-root", baseZIndex: 1000 }));
Alpine.start();
`,
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@ailuracode/alpine-overlay E2E fixture</title>
  </head>
  <body>
    <main id="app" data-e2e-ready="true" x-data x-init="$store.overlay.register('demo', 'overlay-a')">
      <h1>Overlay E2E fixture</h1>
      <p>Stack count: <output id="stack-count" x-text="$store.overlay.count"></output></p>
      <p>Z-index: <output id="z-index" x-text="$store.overlay.zIndexOf('overlay-a')"></output></p>
      <p>Open: <output id="open-state" x-text="$store.overlay.isOpen('overlay-a')"></output></p>
      <button type="button" @click="$store.overlay.unregister('overlay-a')">Unregister</button>
    </main>
    <div id="overlay-root"></div>
    <script type="module" src="/app.js"></script>
  </body>
</html>
`,
    spec: `import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-overlay", () => {
  test("creates the portal root and registers overlays", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.locator("#overlay-root")).toBeAttached();
    await expect(page.locator("#stack-count")).toHaveText("1");
    await expect(page.locator("#open-state")).toHaveText("true");
    await expect(page.locator("#z-index")).toHaveText("1000");
  });

  test("unregisters overlays from the stack", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Unregister" }).click();
    await expect(page.locator("#stack-count")).toHaveText("0");
    await expect(page.locator("#open-state")).toHaveText("false");
  });
});
`,
  },

  dialog: {
    main: `import dialogPlugin from "@ailuracode/alpine-dialog";
import scrollPlugin from "@ailuracode/alpine-scroll";
import Alpine from "alpinejs";

Alpine.plugin(scrollPlugin({}));
Alpine.plugin(dialogPlugin({ closeOnEscape: true }));
Alpine.start();
`,
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@ailuracode/alpine-dialog E2E fixture</title>
  </head>
  <body>
    <main
      id="app"
      data-e2e-ready="true"
      x-data
      x-init="$store.dialog.register('settings')"
      @keydown.window="$store.dialog.handleKeydown('settings', $event)"
    >
      <h1>Dialog E2E fixture</h1>
      <button id="open-dialog" type="button" @click="$store.dialog.open('settings')">Open dialog</button>
      <output id="dialog-open" x-text="$store.dialog.isOpen('settings')"></output>
      <div
        id="dialog-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        x-show="$store.dialog.isOpen('settings')"
        x-bind="$store.dialog.dialogProps('settings')"
      >
        <button id="dialog-close" type="button" @click="$store.dialog.close('settings')">Close</button>
        <input id="dialog-input" type="text" aria-label="Name" />
      </div>
    </main>
    <script type="module" src="/app.js"></script>
  </body>
</html>
`,
    spec: `import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-dialog", () => {
  test("opens and closes the dialog from markup", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.getByRole("dialog")).toBeHidden();
    await page.getByRole("button", { name: "Open dialog" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.locator("#dialog-open")).toHaveText("true");

    await page.getByRole("button", { name: "Close" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.locator("#dialog-open")).toHaveText("false");
  });

  test("closes the dialog on Escape", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Open dialog" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});
`,
  },

  menu: {
    main: `import menuPlugin from "@ailuracode/alpine-menu";
import scrollPlugin from "@ailuracode/alpine-scroll";
import Alpine from "alpinejs";

Alpine.plugin(scrollPlugin({}));
Alpine.plugin(menuPlugin({ exclusive: true }));
Alpine.start();
`,
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@ailuracode/alpine-menu E2E fixture</title>
  </head>
  <body>
    <main
      id="app"
      data-e2e-ready="true"
      x-data="{ ids: ['profile', 'settings'] }"
      x-init="
        $store.menu.register('user-menu');
        ids.forEach(id => $store.menu.registerItem('user-menu', id));
      "
      @keydown.window="$store.menu.isOpen('user-menu') && $store.menu.handleKeydown('user-menu', $event)"
    >
      <h1>Menu E2E fixture</h1>
      <button id="menu-trigger" type="button" @click="$store.menu.toggle('user-menu')">Account</button>
      <ul id="menu-list" role="menu" x-show="$store.menu.isOpen('user-menu')">
        <template x-for="id in ids" :key="id">
          <li role="none">
            <button
              type="button"
              role="menuitem"
              :id="'item-' + id"
              @click="$store.menu.selectItem('user-menu', id)"
              x-text="id"
            ></button>
          </li>
        </template>
      </ul>
      <output id="menu-open" x-text="$store.menu.isOpen('user-menu')"></output>
      <output id="selected-item" x-text="$store.menu.selectedItem('user-menu') ?? 'none'"></output>
    </main>
    <script type="module" src="/app.js"></script>
  </body>
</html>
`,
    spec: `import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-menu", () => {
  test("opens the menu from the trigger", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.getByRole("menu")).toBeHidden();
    await page.getByRole("button", { name: "Account" }).click();
    await expect(page.getByRole("menu")).toBeVisible();
    await expect(page.locator("#menu-open")).toHaveText("true");
  });

  test("selects an item and closes the menu", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Account" }).click();
    await page.getByRole("menuitem", { name: "settings" }).click();
    await expect(page.locator("#selected-item")).toHaveText("settings");
    await expect(page.getByRole("menu")).toBeHidden();
  });
});
`,
  },

  tooltip: {
    main: `import tooltipPlugin from "@ailuracode/alpine-tooltip";
import Alpine from "alpinejs";

Alpine.plugin(tooltipPlugin({ delay: 0 }));
Alpine.start();
`,
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@ailuracode/alpine-tooltip E2E fixture</title>
  </head>
  <body>
    <main
      id="app"
      data-e2e-ready="true"
      x-data
      x-init="$store.tooltip.register('help', { content: 'Tooltip content' })"
    >
      <h1>Tooltip E2E fixture</h1>
      <button
        id="tooltip-trigger"
        type="button"
        aria-describedby="tooltip-help"
        @mouseenter="$store.tooltip.open('help')"
        @mouseleave="$store.tooltip.close('help')"
        @focus="$store.tooltip.open('help')"
        @blur="$store.tooltip.close('help')"
      >Help</button>
      <div
        id="tooltip-help"
        role="tooltip"
        x-show="$store.tooltip.isOpen('help')"
        x-text="$store.tooltip.instances.help?.content"
      ></div>
      <output id="tooltip-open" x-text="$store.tooltip.isOpen('help')"></output>
    </main>
    <script type="module" src="/app.js"></script>
  </body>
</html>
`,
    spec: `import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-tooltip", () => {
  test("opens on hover and shows tooltip content", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.getByRole("tooltip")).toBeHidden();
    await page.getByRole("button", { name: "Help" }).hover();
    await expect(page.getByRole("tooltip")).toBeVisible();
    await expect(page.getByRole("tooltip")).toHaveText("Tooltip content");
    await expect(page.locator("#tooltip-open")).toHaveText("true");
  });

  test("closes on Escape", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Help" }).hover();
    await expect(page.getByRole("tooltip")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("tooltip")).toBeHidden();
  });
});
`,
  },

  accordion: {
    main: `import accordionPlugin from "@ailuracode/alpine-accordion";
import Alpine from "alpinejs";

Alpine.plugin(accordionPlugin());
Alpine.start();
`,
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@ailuracode/alpine-accordion E2E fixture</title>
  </head>
  <body>
    <main
      id="app"
      data-e2e-ready="true"
      x-data
      x-init="
        $store.accordion.register('faq');
        $store.accordion.registerItem('faq', 'item-1');
      "
      @keydown.window="$store.accordion.handleKeydown('faq', $event)"
    >
      <h1>Accordion E2E fixture</h1>
      <button
        id="accordion-trigger"
        type="button"
        x-bind="$store.accordion.triggerProps('faq', 'item-1')"
        @click="$store.accordion.toggle('faq', 'item-1')"
      >Section 1</button>
      <div id="accordion-panel" x-show="$store.accordion.isOpen('faq', 'item-1')" x-bind="$store.accordion.panelProps('faq', 'item-1')">
        Panel content
      </div>
      <output id="accordion-open" x-text="$store.accordion.isOpen('faq', 'item-1')"></output>
    </main>
    <script type="module" src="/app.js"></script>
  </body>
</html>
`,
    spec: `import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-accordion", () => {
  test("toggles panel visibility", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.locator("#accordion-panel")).toBeHidden();
    await page.getByRole("button", { name: "Section 1" }).click();
    await expect(page.locator("#accordion-panel")).toBeVisible();
    await expect(page.locator("#accordion-open")).toHaveText("true");
  });

  test("exposes aria-expanded on the trigger", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.getByRole("button", { name: "Section 1" })).toHaveAttribute("aria-expanded", "false");
    await page.getByRole("button", { name: "Section 1" }).click();
    await expect(page.getByRole("button", { name: "Section 1" })).toHaveAttribute("aria-expanded", "true");
  });
});
`,
  },

  tabs: {
    main: `import tabsPlugin from "@ailuracode/alpine-tabs";
import Alpine from "alpinejs";

Alpine.plugin(tabsPlugin());
Alpine.start();
`,
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@ailuracode/alpine-tabs E2E fixture</title>
  </head>
  <body>
    <main
      id="app"
      data-e2e-ready="true"
      x-data
      x-init="
        $store.tabs.register('main');
        $store.tabs.registerTab('main', 'tab-a');
        $store.tabs.registerTab('main', 'tab-b');
        $store.tabs.select('main', 'tab-a');
      "
      @keydown.window="$store.tabs.handleKeydown('main', $event)"
    >
      <h1>Tabs E2E fixture</h1>
      <div role="tablist" x-bind="$store.tabs.tablistProps('main')">
        <button id="tab-a" type="button" role="tab" x-bind="$store.tabs.tabProps('main', 'tab-a')" @click="$store.tabs.select('main', 'tab-a')">Tab A</button>
        <button id="tab-b" type="button" role="tab" x-bind="$store.tabs.tabProps('main', 'tab-b')" @click="$store.tabs.select('main', 'tab-b')">Tab B</button>
      </div>
      <div id="panel-a" role="tabpanel" x-show="$store.tabs.active('main') === 'tab-a'" x-bind="$store.tabs.panelProps('main', 'tab-a')">Panel A</div>
      <div id="panel-b" role="tabpanel" x-show="$store.tabs.active('main') === 'tab-b'" x-bind="$store.tabs.panelProps('main', 'tab-b')">Panel B</div>
      <output id="active-tab" x-text="$store.tabs.active('main')"></output>
    </main>
    <script type="module" src="/app.js"></script>
  </body>
</html>
`,
    spec: `import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-tabs", () => {
  test("switches panels when a tab is clicked", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.locator("#panel-a")).toBeVisible();
    await expect(page.locator("#panel-b")).toBeHidden();
    await page.getByRole("tab", { name: "Tab B" }).click();
    await expect(page.locator("#panel-b")).toBeVisible();
    await expect(page.locator("#active-tab")).toHaveText("tab-b");
  });

  test("navigates tabs with arrow keys", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("tab", { name: "Tab A" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#active-tab")).toHaveText("tab-b");
  });
});
`,
  },

  keyboard: {
    main: `import keyboardPlugin from "@ailuracode/alpine-keyboard";
import Alpine from "alpinejs";

Alpine.plugin(
  keyboardPlugin({
    shortcuts: [
      {
        shortcut: "mod+k",
        handler: () => {
          const event = new CustomEvent("shortcut-fired", { detail: { name: "palette" } });
          document.dispatchEvent(event);
        },
      },
    ],
  })
);
Alpine.start();
`,
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@ailuracode/alpine-keyboard E2E fixture</title>
  </head>
  <body>
    <main id="app" data-e2e-ready="true" x-data="{ fired: 'idle' }" x-init="document.addEventListener('shortcut-fired', () => { fired = 'palette' })">
      <h1>Keyboard E2E fixture</h1>
      <output id="shortcut-state" x-text="fired"></output>
      <input id="editable" type="text" aria-label="Search" />
    </main>
    <script type="module" src="/app.js"></script>
  </body>
</html>
`,
    spec: `import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-keyboard", () => {
  test("fires a registered mod+k shortcut", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.locator("#shortcut-state")).toHaveText("idle");
    const modifier = process.platform === "darwin" ? "Meta" : "Control";
    await page.keyboard.press(\`\${modifier}+KeyK\`);
    await expect(page.locator("#shortcut-state")).toHaveText("palette");
  });
});
`,
  },

  command: {
    main: `import commandPlugin from "@ailuracode/alpine-command";
import scrollPlugin from "@ailuracode/alpine-scroll";
import Alpine from "alpinejs";

Alpine.plugin(scrollPlugin({}));
Alpine.plugin(commandPlugin({}));
Alpine.start();
`,
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@ailuracode/alpine-command E2E fixture</title>
  </head>
  <body>
    <main
      id="app"
      data-e2e-ready="true"
      x-data="{ ran: 'none' }"
      x-init="
        $store.command.register({ id: 'copy', label: 'Copy', keywords: ['copy'], run: () => { ran = 'copy' } });
        $store.command.register({ id: 'paste', label: 'Paste', keywords: ['paste'], run: () => { ran = 'paste' } });
      "
      @keydown.window="$store.command.isOpen && $store.command.handleKeydown($event)"
    >
      <h1>Command E2E fixture</h1>
      <button type="button" @click="$store.command.open()">Open palette</button>
      <input id="command-input" type="text" x-model="$store.command.search" x-bind="$store.command.inputProps()" />
      <ul id="command-list" role="listbox" x-show="$store.command.isOpen" x-bind="$store.command.listboxProps()">
        <template x-for="item in $store.command.visibleItems" :key="item.id">
          <li role="presentation">
            <button type="button" role="option" x-bind="$store.command.optionProps(item.id)" @click="$store.command.run(item.id)" x-text="item.label"></button>
          </li>
        </template>
      </ul>
      <output id="command-ran" x-text="ran"></output>
    </main>
    <script type="module" src="/app.js"></script>
  </body>
</html>
`,
    spec: `import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-command", () => {
  test("opens the palette and lists commands", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Open palette" }).click();
    await expect(page.getByRole("listbox")).toBeVisible();
    await expect(page.getByRole("option", { name: "Copy" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Paste" })).toBeVisible();
  });

  test("filters commands while typing", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Open palette" }).click();
    await page.getByLabel("Search").fill("paste");
    await expect(page.getByRole("option", { name: "Paste" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Copy" })).toHaveCount(0);
  });
});
`,
  },

  media: {
    main: `import { mediaIntervals, mediaPlugin } from "@ailuracode/alpine-media";
import Alpine from "alpinejs";

Alpine.plugin(
  mediaPlugin({
    intervals: mediaIntervals([
      { name: "sm", minWidth: 0 },
      { name: "md", minWidth: 768 },
      { name: "lg", minWidth: 1024 },
    ]),
  })
);
Alpine.start();
`,
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@ailuracode/alpine-media E2E fixture</title>
  </head>
  <body>
    <main id="app" data-e2e-ready="true" x-data x-init>
      <h1>Media E2E fixture</h1>
      <output id="breakpoint" x-text="$store.media.breakpoint"></output>
      <output id="width" x-text="$store.media.width"></output>
      <output id="is-md" x-text="$store.media.is('md')"></output>
    </main>
    <script type="module" src="/app.js"></script>
  </body>
</html>
`,
    spec: `import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-media", () => {
  test("reports the current breakpoint in markup", async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.locator("#breakpoint")).toHaveText("md");
    await expect(page.locator("#is-md")).toHaveText("true");
  });

  test("updates breakpoint when the viewport changes", async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.locator("#breakpoint")).toHaveText("lg");
    await page.setViewportSize({ width: 400, height: 600 });
    await expect(page.locator("#breakpoint")).toHaveText("sm");
  });
});
`,
  },

  scroll: {
    main: `import scrollPlugin from "@ailuracode/alpine-scroll";
import Alpine from "alpinejs";

Alpine.plugin(scrollPlugin({}));
Alpine.start();
`,
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@ailuracode/alpine-scroll E2E fixture</title>
    <style>
      body { margin: 0; }
      #scroll-content { height: 2000px; padding: 1rem; }
    </style>
  </head>
  <body>
    <main id="app" data-e2e-ready="true" x-data x-init>
      <h1>Scroll E2E fixture</h1>
      <output id="scroll-y" x-text="$store.scroll.y"></output>
      <output id="scroll-locked" x-text="$store.scroll.locked"></output>
      <button type="button" @click="$store.scroll.lock('demo')">Lock scroll</button>
      <button type="button" @click="$store.scroll.unlock('demo')">Unlock scroll</button>
      <button type="button" @click="$store.scroll.toTop()">Scroll to top</button>
      <div id="scroll-content">Scrollable content</div>
    </main>
    <script type="module" src="/app.js"></script>
  </body>
</html>
`,
    spec: `import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-scroll", () => {
  test("tracks scroll position reactively", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.locator("#scroll-y")).toHaveText("0");
    await page.evaluate(() => window.scrollTo(0, 200));
    await expect(page.locator("#scroll-y")).not.toHaveText("0");
  });

  test("locks and unlocks body scroll", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Lock scroll" }).click();
    await expect(page.locator("#scroll-locked")).toHaveText("true");
    await page.getByRole("button", { name: "Unlock scroll" }).click();
    await expect(page.locator("#scroll-locked")).toHaveText("false");
  });
});
`,
  },

  sidebar: {
    main: `import scrollPlugin from "@ailuracode/alpine-scroll";
import sidebarPlugin from "@ailuracode/alpine-sidebar";
import togglePlugin from "@ailuracode/alpine-toggle";
import Alpine from "alpinejs";

Alpine.plugin(togglePlugin());
Alpine.plugin(scrollPlugin({}));
Alpine.plugin(
  sidebarPlugin({
    breakpoint: { query: "(min-width: 768px)", onMismatch: "hide" },
  })
);
Alpine.start();
`,
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@ailuracode/alpine-sidebar E2E fixture</title>
  </head>
  <body>
    <main id="app" data-e2e-ready="true" x-data x-init>
      <h1>Sidebar E2E fixture</h1>
      <button type="button" @click="$store.sidebar.show()">Show sidebar</button>
      <button type="button" @click="$store.sidebar.hide()">Hide sidebar</button>
      <aside id="sidebar-panel" x-show="$store.sidebar.isVisible()">Sidebar content</aside>
      <output id="sidebar-visible" x-text="$store.sidebar.isVisible()"></output>
    </main>
    <script type="module" src="/app.js"></script>
  </body>
</html>
`,
    spec: `import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-sidebar", () => {
  test("shows and hides the sidebar", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.locator("#sidebar-panel")).toBeHidden();
    await page.getByRole("button", { name: "Show sidebar" }).click();
    await expect(page.locator("#sidebar-panel")).toBeVisible();
    await expect(page.locator("#sidebar-visible")).toHaveText("true");

    await page.getByRole("button", { name: "Hide sidebar" }).click();
    await expect(page.locator("#sidebar-panel")).toBeHidden();
  });
});
`,
  },

  carousel: {
    main: `import carouselPlugin from "@ailuracode/alpine-carousel";
import Alpine from "alpinejs";

Alpine.plugin(carouselPlugin());
Alpine.start();
`,
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@ailuracode/alpine-carousel E2E fixture</title>
    <style>
      .viewport { display: flex; overflow: hidden; width: 300px; }
      .slide { flex: 0 0 100%; min-height: 80px; }
    </style>
  </head>
  <body>
    <main
      id="app"
      data-e2e-ready="true"
      x-data
      x-init="
        $store.carousel.create('demo');
        $nextTick(() => $store.carousel.bindViewport('demo', $refs.viewport));
      "
      @keydown.window="$store.carousel.handleKeydown('demo', $event)"
    >
      <h1>Carousel E2E fixture</h1>
      <div class="viewport" x-ref="viewport">
        <div class="slide" x-bind="$store.carousel.slideProps('demo', 0)">Slide 1</div>
        <div class="slide" x-bind="$store.carousel.slideProps('demo', 1)">Slide 2</div>
        <div class="slide" x-bind="$store.carousel.slideProps('demo', 2)">Slide 3</div>
      </div>
      <button type="button" @click="$store.carousel.next('demo')">Next</button>
      <button type="button" @click="$store.carousel.previous('demo')">Previous</button>
      <output id="carousel-index" x-text="$store.carousel.current('demo')"></output>
    </main>
    <script type="module" src="/app.js"></script>
  </body>
</html>
`,
    spec: `import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-carousel", () => {
  test("navigates slides with next and previous", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.locator("#carousel-index")).toHaveText("0");
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.locator("#carousel-index")).toHaveText("1");
    await page.getByRole("button", { name: "Previous" }).click();
    await expect(page.locator("#carousel-index")).toHaveText("0");
  });
});
`,
  },

  virtual: {
    main: `import virtualPlugin from "@ailuracode/alpine-virtual";
import Alpine from "alpinejs";

Alpine.plugin(virtualPlugin());
Alpine.start();
`,
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@ailuracode/alpine-virtual E2E fixture</title>
    <style>
      #virtual-scroll { height: 200px; overflow: auto; border: 1px solid #ccc; }
      .virtual-row { height: 40px; }
    </style>
  </head>
  <body>
    <main
      id="app"
      data-e2e-ready="true"
      x-data
      x-init="
        $store.virtual.create('list');
        $store.virtual.setCount('list', 100);
        $nextTick(() => $store.virtual.bindScrollElement('list', $refs.scroller));
      "
    >
      <h1>Virtual E2E fixture</h1>
      <div id="virtual-scroll" x-ref="scroller" x-bind="$store.virtual.listProps('list')">
        <div x-bind="$store.virtual.contentProps('list')">
          <template x-for="item in $store.virtual.getVirtualItems('list')" :key="item.key">
            <div class="virtual-row" x-bind="$store.virtual.itemProps('list', item.index)" x-text="'Row ' + item.index"></div>
          </template>
        </div>
      </div>
      <output id="virtual-count" x-text="$store.virtual.getVirtualItems('list').length"></output>
    </main>
    <script type="module" src="/app.js"></script>
  </body>
</html>
`,
    spec: `import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-virtual", () => {
  test("renders only a window of items for a large list", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    const rendered = Number(await page.locator("#virtual-count").textContent());
    expect(rendered).toBeGreaterThan(0);
    expect(rendered).toBeLessThan(100);
    await expect(page.getByText("Row 0")).toBeVisible();
  });

  test("updates the visible range on scroll", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.locator("#virtual-scroll").evaluate((el) => {
      el.scrollTop = 400;
      el.dispatchEvent(new Event("scroll"));
    });
    await expect(page.getByText("Row 0")).toHaveCount(0);
  });
});
`,
  },

  "query-kit": {
    main: `import queryKitPlugin from "@ailuracode/alpine-query-kit";
import Alpine from "alpinejs";

Alpine.plugin(queryKitPlugin());
Alpine.start();
`,
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@ailuracode/alpine-query-kit E2E fixture</title>
  </head>
  <body>
    <main
      id="app"
      data-e2e-ready="true"
      x-data="{
        async fetchUser() {
          return { name: 'Ada' };
        }
      }"
      x-init="$store.query.fetchQuery({ queryKey: ['user'], queryFn: fetchUser })"
    >
      <h1>Query Kit E2E fixture</h1>
      <output id="query-status" x-text="$store.query.getQueryState(['user'])?.status ?? 'idle'"></output>
      <output id="query-data" x-text="$store.query.getQueryState(['user'])?.data?.name ?? 'none'"></output>
    </main>
    <script type="module" src="/app.js"></script>
  </body>
</html>
`,
    spec: `import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-query-kit", () => {
  test("registers the query store and resolves data", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.locator("#query-status")).toHaveText("success");
    await expect(page.locator("#query-data")).toHaveText("Ada");
  });
});
`,
  },

  toast: {
    main: `import { toastPlugin } from "@ailuracode/alpine-toast";
import Alpine from "alpinejs";

Alpine.plugin(toastPlugin({ defaultDuration: 5000, maxToasts: 5 }));
Alpine.start();
`,
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@ailuracode/alpine-toast E2E fixture</title>
  </head>
  <body>
    <main id="app" data-e2e-ready="true" x-data x-init>
      <h1>Toast E2E fixture</h1>
      <button type="button" @click="$toast('Hello toast')">Show toast</button>
      <button type="button" @click="$toast.dismissAll()">Dismiss all</button>
      <div role="status" aria-live="polite">
        <template x-for="toast in $store.toast.itemsAt('bottom-right')" :key="toast.id">
          <div :data-testid="'toast-' + toast.id" x-text="toast.message"></div>
        </template>
      </div>
      <output id="toast-count" x-text="$store.toast.itemsAt('bottom-right').length"></output>
    </main>
    <script type="module" src="/app.js"></script>
  </body>
</html>
`,
    spec: `import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-toast", () => {
  test("adds a toast through the magic API", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.locator("#toast-count")).toHaveText("0");
    await page.getByRole("button", { name: "Show toast" }).click();
    await expect(page.locator("#toast-count")).toHaveText("1");
    await expect(page.getByText("Hello toast")).toBeVisible();
  });

  test("dismisses all toasts", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Show toast" }).click();
    await page.getByRole("button", { name: "Dismiss all" }).click();
    await expect(page.locator("#toast-count")).toHaveText("0");
  });
});
`,
  },

  env: {
    main: `import envPlugin from "@ailuracode/alpine-env";
import Alpine from "alpinejs";

Alpine.plugin(envPlugin({ network: true, visibility: true, battery: false, platform: true }));
Alpine.start();
`,
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@ailuracode/alpine-env E2E fixture</title>
  </head>
  <body>
    <main id="app" data-e2e-ready="true" x-data x-init>
      <h1>Env E2E fixture</h1>
      <output id="network-online" x-text="$network.isOnline"></output>
      <output id="visibility" x-text="$visibility.state"></output>
      <output id="platform" x-text="$platform.name"></output>
    </main>
    <script type="module" src="/app.js"></script>
  </body>
</html>
`,
    spec: `import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-env", () => {
  test("exposes network and visibility magics", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.locator("#network-online")).toHaveText("true");
    await expect(page.locator("#visibility")).toHaveText("visible");
    await expect(page.locator("#platform")).not.toHaveText("");
  });

  test("reacts to offline events", async ({ page, context }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await context.setOffline(true);
    await expect(page.locator("#network-online")).toHaveText("false");
    await context.setOffline(false);
    await expect(page.locator("#network-online")).toHaveText("true");
  });
});
`,
  },

  lang: {
    main: `import { langPlugin } from "@ailuracode/alpine-lang";
import Alpine from "alpinejs";

Alpine.plugin(langPlugin({ fallback: "en" }));
Alpine.start();
`,
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@ailuracode/alpine-lang E2E fixture</title>
  </head>
  <body>
    <main id="app" data-e2e-ready="true" x-data x-init>
      <h1>Lang E2E fixture</h1>
      <output id="lang-current" x-text="$store.lang.current"></output>
      <button type="button" @click="$store.lang.set('es-ES')">Set Spanish</button>
      <button type="button" @click="$store.lang.reset()">Reset</button>
      <output id="lang-is-es" x-text="$store.lang.is('es')"></output>
    </main>
    <script type="module" src="/app.js"></script>
  </body>
</html>
`,
    spec: `import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-lang", () => {
  test("changes language through the store", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Set Spanish" }).click();
    await expect(page.locator("#lang-current")).toHaveText("es-ES");
    await expect(page.locator("#lang-is-es")).toHaveText("true");
  });

  test("resets to the detected language", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    const initial = await page.locator("#lang-current").textContent();
    await page.getByRole("button", { name: "Set Spanish" }).click();
    await page.getByRole("button", { name: "Reset" }).click();
    await expect(page.locator("#lang-current")).toHaveText(initial ?? "");
  });
});
`,
  },

  transfer: {
    main: `import { transferPlugin } from "@ailuracode/alpine-transfer";
import Alpine from "alpinejs";

Alpine.plugin(transferPlugin({ clipboard: true, share: false, export: true }));
Alpine.start();
`,
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@ailuracode/alpine-transfer E2E fixture</title>
  </head>
  <body>
    <main id="app" data-e2e-ready="true" x-data="{ copied: 'idle', exported: 'idle' }" x-init>
      <h1>Transfer E2E fixture</h1>
      <button type="button" @click="$clipboard('copied-text').then(() => copied = 'done')">Copy text</button>
      <button type="button" @click="$export('export-body', { filename: 'demo.txt', mimeType: 'text/plain' }).then(() => exported = 'done')">Export text</button>
      <output id="copy-state" x-text="copied"></output>
      <output id="export-state" x-text="exported"></output>
      <pre id="export-body">export-body</pre>
    </main>
    <script type="module" src="/app.js"></script>
  </body>
</html>
`,
    spec: `import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-transfer", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("copies text through the clipboard magic", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Copy text" }).click();
    await expect(page.locator("#copy-state")).toHaveText("done");
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toBe("copied-text");
  });

  test("exports text and triggers a download", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export text" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("demo.txt");
    await expect(page.locator("#export-state")).toHaveText("done");
  });
});
`,
  },

  permissions: {
    main: `import permissionsPlugin from "@ailuracode/alpine-permissions";
import Alpine from "alpinejs";

const notificationsAdapter = {
  name: "notifications",
  requiresUserGesture: true,
  isSupported: () => true,
  getAvailability: () => "available",
  query: async () => "prompt",
  request: async () => ({ permission: "granted" }),
};

Alpine.plugin(permissionsPlugin({ adapters: [notificationsAdapter] }));
Alpine.start();
`,
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@ailuracode/alpine-permissions E2E fixture</title>
  </head>
  <body>
    <main id="app" data-e2e-ready="true" x-data x-init>
      <h1>Permissions E2E fixture</h1>
      <output id="permission-state" x-text="$store.permissions.registry.notifications?.permission ?? 'unknown'"></output>
      <button type="button" @click="$store.permissions.request('notifications')">Request notifications</button>
    </main>
    <script type="module" src="/app.js"></script>
  </body>
</html>
`,
    spec: `import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-permissions", () => {
  test("queries adapter state without auto-requesting", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.locator("#permission-state")).toHaveText("prompt");
  });

  test("requests permission after explicit user interaction", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Request notifications" }).click();
    await expect(page.locator("#permission-state")).toHaveText("granted");
  });
});
`,
  },

  geo: {
    main: `import geoPlugin from "@ailuracode/alpine-geo";
import permissionsPlugin from "@ailuracode/alpine-permissions";
import Alpine from "alpinejs";

const geolocationAdapter = {
  name: "geolocation",
  requiresUserGesture: true,
  isSupported: () => true,
  getAvailability: () => "available",
  query: async () => "granted",
  request: async () => ({ permission: "granted" }),
};

Alpine.plugin(permissionsPlugin({ adapters: [geolocationAdapter] }));
Alpine.plugin(geoPlugin());
Alpine.start();
`,
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@ailuracode/alpine-geo E2E fixture</title>
  </head>
  <body>
    <main id="app" data-e2e-ready="true" x-data x-init>
      <h1>Geo E2E fixture</h1>
      <button type="button" @click="$store.geo.request()">Request position</button>
      <output id="geo-lat" x-text="$store.geo.latitude ?? 'none'"></output>
      <output id="geo-lng" x-text="$store.geo.longitude ?? 'none'"></output>
      <output id="geo-has" x-text="$store.geo.hasPosition"></output>
    </main>
    <script type="module" src="/app.js"></script>
  </body>
</html>
`,
    spec: `import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-geo", () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 40.4168, longitude: -3.7038 });
  });

  test("requests the current position after user interaction", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Request position" }).click();
    await expect(page.locator("#geo-has")).toHaveText("true");
    await expect(page.locator("#geo-lat")).toHaveText("40.4168");
    await expect(page.locator("#geo-lng")).toHaveText("-3.7038");
  });
});
`,
  },

  notify: {
    main: `import notifyPlugin from "@ailuracode/alpine-notify";
import permissionsPlugin from "@ailuracode/alpine-permissions";
import Alpine from "alpinejs";

const notificationsAdapter = {
  name: "notifications",
  requiresUserGesture: true,
  isSupported: () => true,
  getAvailability: () => "available",
  query: async () => "granted",
  request: async () => ({ permission: "granted" }),
};

Alpine.plugin(permissionsPlugin({ adapters: [notificationsAdapter] }));
Alpine.plugin(notifyPlugin());
Alpine.start();
`,
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@ailuracode/alpine-notify E2E fixture</title>
  </head>
  <body>
    <main id="app" data-e2e-ready="true" x-data="{ sent: 'idle' }" x-init>
      <h1>Notify E2E fixture</h1>
      <output id="notify-supported" x-text="$notify.isSupported"></output>
      <output id="notify-permission" x-text="$notify.getPermission()"></output>
      <button type="button" @click="$notify.send({ title: 'Hello', body: 'World' }).then(() => sent = 'done')">Send notification</button>
      <output id="notify-sent" x-text="sent"></output>
    </main>
    <script type="module" src="/app.js"></script>
  </body>
</html>
`,
    spec: `import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-notify", () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(["notifications"]);
  });

  test("reports supported state and permission", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.locator("#notify-supported")).toHaveText("true");
    await expect(page.locator("#notify-permission")).toHaveText("granted");
  });

  test("sends a notification after user interaction", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Send notification" }).click();
    await expect(page.locator("#notify-sent")).toHaveText("done");
  });
});
`,
  },

  attention: {
    main: `import attentionPlugin from "@ailuracode/alpine-attention";
import Alpine from "alpinejs";

Alpine.plugin(attentionPlugin);
Alpine.start();
`,
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@ailuracode/alpine-attention E2E fixture</title>
  </head>
  <body>
    <main id="app" data-e2e-ready="true" x-data x-init>
      <h1>Attention E2E fixture</h1>
      <output id="wakelock-supported" x-text="$wakelock.isSupported"></output>
      <output id="wakelock-active" x-text="$wakelock.isActive"></output>
      <button type="button" @click="$wakelock.request()">Request wake lock</button>
      <button type="button" @click="$wakelock.release()">Release wake lock</button>
    </main>
    <script type="module" src="/app.js"></script>
  </body>
</html>
`,
    spec: `import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-attention", () => {
  test("requests and releases the wake lock when supported", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    const supported = await page.locator("#wakelock-supported").textContent();
    if (supported !== "true") {
      test.skip();
      return;
    }

    await page.getByRole("button", { name: "Request wake lock" }).click();
    await expect(page.locator("#wakelock-active")).toHaveText("true");
    await page.getByRole("button", { name: "Release wake lock" }).click();
    await expect(page.locator("#wakelock-active")).toHaveText("false");
  });
});
`,
  },

  selection: {
    main: `import selectionPlugin from "@ailuracode/alpine-selection";
import Alpine from "alpinejs";

Alpine.plugin(selectionPlugin());
Alpine.start();
`,
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@ailuracode/alpine-selection E2E fixture</title>
  </head>
  <body>
    <main
      id="app"
      data-e2e-ready="true"
      x-data
      x-init="
        $store.selection.create('list');
        $store.selection.setMode('list', 'single');
      "
    >
      <h1>Selection E2E fixture</h1>
      <ul role="listbox" x-bind="$store.selection.listProps('list')">
        <li role="presentation">
          <button type="button" role="option" x-bind="$store.selection.itemProps('list', 'a')" @click="$store.selection.select('list', 'a')">Alpha</button>
        </li>
        <li role="presentation">
          <button type="button" role="option" x-bind="$store.selection.itemProps('list', 'b')" @click="$store.selection.select('list', 'b')">Beta</button>
        </li>
      </ul>
      <output id="selected" x-text="[...$store.selection.get('list').selected].join(',')"></output>
    </main>
    <script type="module" src="/app.js"></script>
  </body>
</html>
`,
    spec: `import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-selection", () => {
  test("selects an item through pointer interaction", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("option", { name: "Alpha" }).click();
    await expect(page.locator("#selected")).toHaveText("a");
    await expect(page.getByRole("option", { name: "Alpha" })).toHaveAttribute("aria-selected", "true");
  });

  test("replaces selection in single mode", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("option", { name: "Alpha" }).click();
    await page.getByRole("option", { name: "Beta" }).click();
    await expect(page.locator("#selected")).toHaveText("b");
  });
});
`,
  },
};

for (const [name, files] of Object.entries(PACKAGES)) {
  const packageDir = path.join(packagesDir, name);
  const fixtureDir = path.join(packageDir, "e2e", "fixture");
  mkdirSync(fixtureDir, { recursive: true });

  writeFileSync(path.join(fixtureDir, "main.ts"), files.main, "utf8");
  writeFileSync(path.join(fixtureDir, "index.html"), files.html, "utf8");
  writeFileSync(path.join(packageDir, "e2e", `${name}.e2e.spec.ts`), files.spec, "utf8");
  console.log(`[generated] ${name}`);
}

console.log("Done.");
