import commandPlugin from "@ailuracode/alpine-command";
import scrollPlugin from "@ailuracode/alpine-scroll";
import Alpine from "alpinejs";

Alpine.plugin(scrollPlugin({}));
Alpine.plugin(commandPlugin({}));

Alpine.data("commandFixture", () => ({
  ran: "none",
  init() {
    const command = this.$store.command as {
      register(item: { id: string; label: string; keywords: string[]; action: () => void }): void;
    };
    command.register({
      id: "copy",
      label: "Copy",
      keywords: ["copy"],
      action: () => {
        this.ran = "copy";
      },
    });
    command.register({
      id: "paste",
      label: "Paste",
      keywords: ["paste"],
      action: () => {
        this.ran = "paste";
      },
    });
  },
}));

Alpine.start();
