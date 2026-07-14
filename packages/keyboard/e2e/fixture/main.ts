import keyboardPlugin from "@ailuracode/alpine-keyboard";
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
