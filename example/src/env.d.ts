/// <reference types="astro/client" />
/// <reference types="@types/alpinejs" />
/// <reference path="../../packages/theme/src/global.d.ts" />
/// <reference path="../../packages/screen/src/global.d.ts" />
/// <reference path="../../packages/scroll/src/global.d.ts" />
/// <reference path="../../packages/network/src/global.d.ts" />
/// <reference path="../../packages/visibility/src/global.d.ts" />
/// <reference path="../../packages/battery/src/global.d.ts" />
/// <reference path="../../packages/clipboard/src/global.d.ts" />
/// <reference path="../../packages/touch/src/global.d.ts" />
/// <reference path="../../packages/platform/src/global.d.ts" />
/// <reference path="../../packages/notify/src/global.d.ts" />

interface Window {
	Alpine: import("alpinejs").Alpine;
}
