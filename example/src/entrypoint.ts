import type { Alpine } from "alpinejs";
import attention from "@ailuracode/alpine-attention";
import battery from "@ailuracode/alpine-battery";
import calendar from "@ailuracode/alpine-calendar";
import clipboard from "@ailuracode/alpine-clipboard";
import exportPlugin from "@ailuracode/alpine-export";
import geo from "@ailuracode/alpine-geo";
import network from "@ailuracode/alpine-network";
import visibility from "@ailuracode/alpine-visibility";
import notify from "@ailuracode/alpine-notify";
import platform from "@ailuracode/alpine-platform";
import query from "@ailuracode/alpine-query";
import {
	createAlpineNanostoresAdapter,
	NanoStores,
} from "@ailuracode/alpine-query-adapter-nanostores";
import queryDevtools from "@ailuracode/alpine-query-devtools";
import screen from "@ailuracode/alpine-screen";
import scroll from "@ailuracode/alpine-scroll";
import share from "@ailuracode/alpine-share";
import theme from "@ailuracode/alpine-theme";
import touch from "@ailuracode/alpine-touch";
import { registerQueryDemos } from "./query-demos.js";

export default (Alpine: Alpine) => {
	Alpine.plugin(
		theme({
			onChange({ resolved }) {
				document.documentElement.dataset.theme = resolved;
				document.documentElement.style.colorScheme = resolved;
			},
		}),
	);
	Alpine.plugin(screen);
	Alpine.plugin(scroll);
	Alpine.plugin(share);
	Alpine.plugin(network);
	Alpine.plugin(visibility);
	Alpine.plugin(battery);
	Alpine.plugin(calendar);
	Alpine.plugin(attention);
	Alpine.plugin(clipboard);
	Alpine.plugin(exportPlugin);
	Alpine.plugin(geo);
	Alpine.plugin(touch);
	Alpine.plugin(platform);
	Alpine.plugin(NanoStores);
	Alpine.plugin(query({ adapter: createAlpineNanostoresAdapter }));
	Alpine.plugin(queryDevtools({ position: "bottom" }));
	registerQueryDemos(Alpine);
	Alpine.plugin(notify);
};
