import type AlpineType from "alpinejs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMagicHarness } from "../../../test/mock-alpine.js";
import exportPlugin, {
  createExportMagic,
  type ExportMagic,
  exportData,
  isExportSupported,
} from "../src/index.js";

function installExportDom(): {
  click: ReturnType<typeof vi.fn>;
  anchors: HTMLAnchorElement[];
} {
  const anchors: HTMLAnchorElement[] = [];
  const click = vi.fn();

  vi.spyOn(document.body, "appendChild").mockImplementation((node) => {
    if (node instanceof HTMLAnchorElement) {
      anchors.push(node);
      node.click = click;
    }

    return node;
  });
  vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);

  return { click, anchors };
}

describe("@ailuracode/alpinejs-export", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("helpers", () => {
    it("isExportSupported() is true in a browser-like environment", () => {
      expect(isExportSupported()).toBe(true);
    });

    it("exportData() exports a URL via a temporary anchor", async () => {
      const { click, anchors } = installExportDom();

      await expect(exportData("/files/report.pdf", "report.pdf")).resolves.toBe(true);

      expect(anchors).toHaveLength(1);
      expect(anchors[0]?.href).toContain("/files/report.pdf");
      expect(anchors[0]?.download).toBe("report.pdf");
      expect(click).toHaveBeenCalledTimes(1);
    });

    it("exportData() accepts a filename shorthand string", async () => {
      const { anchors } = installExportDom();

      await expect(exportData("/data.json", "export.json")).resolves.toBe(true);

      expect(anchors[0]?.download).toBe("export.json");
    });

    it("exportData() exports plain text as a blob", async () => {
      const { click, anchors } = installExportDom();
      const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:demo");
      const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(vi.fn());

      await expect(exportData("hello world", { filename: "hello.txt" })).resolves.toBe(true);

      expect(createObjectURL).toHaveBeenCalled();
      expect(anchors[0]?.href).toBe("blob:demo");
      expect(anchors[0]?.download).toBe("hello.txt");
      expect(click).toHaveBeenCalledTimes(1);

      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:demo");
    });

    it("exportData() requires a filename for plain text", async () => {
      installExportDom();

      await expect(exportData("hello world")).resolves.toBe(false);
    });

    it("exportData() exports Blob and File payloads", async () => {
      const { anchors } = installExportDom();
      vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:file");

      const file = new File(["content"], "notes.md", { type: "text/markdown" });

      await expect(exportData(file)).resolves.toBe(true);
      expect(anchors[0]?.download).toBe("notes.md");

      const blob = new Blob(["content"], { type: "application/json" });
      await expect(exportData(blob, "data.json")).resolves.toBe(true);
      expect(anchors.at(-1)?.download).toBe("data.json");
    });

    it("exportData() resolves false when exports are unavailable", async () => {
      vi.stubGlobal("document", undefined);

      await expect(exportData("/missing.txt", "missing.txt")).resolves.toBe(false);
    });
  });

  describe("plugin registration", () => {
    it("registers only the $export magic", () => {
      const store = vi.fn();
      let magicApi: ExportMagic | undefined;

      const Alpine = {
        store,
        magic(_name: string, factory: () => ExportMagic) {
          magicApi = factory();
        },
      };

      exportPlugin(Alpine as unknown as AlpineType.Alpine);

      expect(store).not.toHaveBeenCalled();
      expect(typeof magicApi).toBe("function");
      expect(magicApi?.isSupported).toBe(true);
    });

    it("registers callable $export magic", async () => {
      const { click } = installExportDom();
      const { export: exportFile } = createMagicHarness(exportPlugin) as { export: ExportMagic };

      expect(exportFile.isSupported).toBe(true);
      await expect(exportFile("https://example.com/file.txt", "file.txt")).resolves.toBe(false);
      expect(click).not.toHaveBeenCalled();
    });

    it("createExportMagic() exposes the public API", () => {
      const magic = createExportMagic();

      expect(magic.isSupported).toBe(isExportSupported());
    });
  });
});
