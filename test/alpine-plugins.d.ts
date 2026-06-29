/// <reference types="@types/alpinejs" />

declare module "@alpinejs/anchor" {
  const anchor: Alpine.PluginCallback;
  export default anchor;
}

declare module "@alpinejs/collapse" {
  const collapse: Alpine.PluginCallback;
  export default collapse;
}

declare module "@alpinejs/morph" {
  const morph: Alpine.PluginCallback;
  export default morph;
}

interface Window {
  Alpine: Alpine.Alpine;
}
