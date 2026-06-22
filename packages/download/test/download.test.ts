import type AlpineType from "alpinejs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMagicHarness } from "../../../test/mock-alpine.js";
import downloadPlugin, {
  createDownloadMagic,
  type DownloadMagic,
  downloadData,
  isDownloadSupported,
} from "../src/index.js";

function installDownloadDom(): {
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

describe("@ailuracode/alpine-download", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("helpers", () => {
    it("isDownloadSupported() is true in a browser-like environment", () => {
      expect(isDownloadSupported()).toBe(true);
    });

    it("downloadData() downloads a URL via a temporary anchor", async () => {
      const { click, anchors } = installDownloadDom();

      await expect(downloadData("/files/report.pdf", "report.pdf")).resolves.toBe(true);

      expect(anchors).toHaveLength(1);
      expect(anchors[0]?.href).toContain("/files/report.pdf");
      expect(anchors[0]?.download).toBe("report.pdf");
      expect(click).toHaveBeenCalledTimes(1);
    });

    it("downloadData() accepts a filename shorthand string", async () => {
      const { anchors } = installDownloadDom();

      await expect(downloadData("https://example.com/data.json", "export.json")).resolves.toBe(
        true
      );

      expect(anchors[0]?.download).toBe("export.json");
    });

    it("downloadData() downloads plain text as a blob", async () => {
      const { click, anchors } = installDownloadDom();
      const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:demo");
      const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(vi.fn());

      await expect(downloadData("hello world", { filename: "hello.txt" })).resolves.toBe(true);

      expect(createObjectURL).toHaveBeenCalled();
      expect(anchors[0]?.href).toBe("blob:demo");
      expect(anchors[0]?.download).toBe("hello.txt");
      expect(click).toHaveBeenCalledTimes(1);

      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:demo");
    });

    it("downloadData() requires a filename for plain text", async () => {
      installDownloadDom();

      await expect(downloadData("hello world")).resolves.toBe(false);
    });

    it("downloadData() downloads Blob and File payloads", async () => {
      const { anchors } = installDownloadDom();
      vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:file");

      const file = new File(["content"], "notes.md", { type: "text/markdown" });

      await expect(downloadData(file)).resolves.toBe(true);
      expect(anchors[0]?.download).toBe("notes.md");

      const blob = new Blob(["content"], { type: "application/json" });
      await expect(downloadData(blob, "data.json")).resolves.toBe(true);
      expect(anchors.at(-1)?.download).toBe("data.json");
    });

    it("downloadData() resolves false when downloads are unavailable", async () => {
      vi.stubGlobal("document", undefined);

      await expect(downloadData("/missing.txt", "missing.txt")).resolves.toBe(false);
    });
  });

  describe("plugin registration", () => {
    it("registers only the $download magic", () => {
      const store = vi.fn();
      let magicApi: DownloadMagic | undefined;

      const Alpine = {
        store,
        magic(_name: string, factory: () => DownloadMagic) {
          magicApi = factory();
        },
      };

      downloadPlugin(Alpine as unknown as AlpineType.Alpine);

      expect(store).not.toHaveBeenCalled();
      expect(typeof magicApi).toBe("function");
      expect(magicApi?.isSupported()).toBe(true);
    });

    it("registers callable $download magic", async () => {
      const { click } = installDownloadDom();
      const { download } = createMagicHarness(downloadPlugin) as { download: DownloadMagic };

      expect(download.isSupported()).toBe(true);
      await expect(download("https://example.com/file.txt", "file.txt")).resolves.toBe(true);
      expect(click).toHaveBeenCalledTimes(1);
    });

    it("createDownloadMagic() exposes the public API", () => {
      const magic = createDownloadMagic();

      expect(magic.isSupported).toBe(isDownloadSupported);
    });
  });
});
