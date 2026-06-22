import type { Alpine } from "alpinejs";
import battery from "@ailuracode/alpine-battery";
import clipboard from "@ailuracode/alpine-clipboard";
import network from "@ailuracode/alpine-network";
import notify from "@ailuracode/alpine-notify";
import platform from "@ailuracode/alpine-platform";
import screen from "@ailuracode/alpine-screen";
import scroll from "@ailuracode/alpine-scroll";
import theme from "@ailuracode/alpine-theme";
import touch from "@ailuracode/alpine-touch";

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
	Alpine.plugin(network);
	Alpine.plugin(battery);
	Alpine.plugin(clipboard);
	Alpine.plugin(touch);
	Alpine.plugin(platform);
	Alpine.plugin(notify);
};
