import type AlpineType from "alpinejs";

export type ClipboardMagic = (text: string) => Promise<void>;

function copyViaLegacyCommand(doc: Document): boolean {
  const run = Reflect.get(doc, "execCommand");
  return typeof run === "function" && run.call(doc, "copy", false);
}

async function writeClipboard(text: string): Promise<void> {
  const value = String(text);

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const area = document.createElement("textarea");
  area.value = value;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  copyViaLegacyCommand(document);
  document.body.removeChild(area);
}

/** Alpine.js clipboard plugin. Registers magic `$clipboard(text)`. */
export default function clipboardPlugin(Alpine: AlpineType.Alpine): void {
  Alpine.magic("clipboard", () => writeClipboard);
}

declare global {
  namespace Alpine {
    interface Magics<T> {
      $clipboard: ClipboardMagic;
    }
  }
}
