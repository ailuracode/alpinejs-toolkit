import { mediaIntervals, mediaPlugin } from "@ailuracode/alpine-media";
import Alpine from "alpinejs";

Alpine.plugin(
  mediaPlugin({
    intervals: mediaIntervals([
      { name: "sm", maxWidth: 767 },
      { name: "md", maxWidth: 1023 },
      { name: "lg", maxWidth: 99999 },
    ]),
  })
);
Alpine.start();
