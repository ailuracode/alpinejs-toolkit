# @ailuracode/alpine-player

Alpine.js directives for **native audio and video playback** — reactive controllers for `<audio>` and `<video>` via `x-audio` and `x-video`.

**CSS-framework agnostic** — no player chrome, no styles. You bind native elements, wire your own controls, and keep full markup control.

> **Not [`@ailuracode/alpine-media`](./media.md)** — that package owns viewport breakpoints, dimensions, and browser media-feature state (`$store.media`). **Player** owns `<audio>` / `<video>` playback only.

## Install

```bash
pnpm add @ailuracode/alpine-player alpinejs
```

## Quick start

```ts
import Alpine from "alpinejs";
import { playerPlugin } from "@ailuracode/alpine-player";

Alpine.plugin(playerPlugin());
Alpine.start();
```

```html
<div x-data>
  <audio x-audio="player" src="/audio/track.ogg" preload="metadata"></audio>
  <button type="button" @click="player.toggle()">
    <span x-text="player.playing ? 'Pause' : 'Play'"></span>
  </button>
</div>
```

## Audio example

```html
<div x-data>
  <audio
    x-audio="player"
    src="/audio/podcast.mp3"
    preload="metadata"
    @ended="playNext()"
    @error="handleAudioError($event)"
  ></audio>

  <button type="button" @click="player.toggle()">
    <span x-text="player.playing ? 'Pause' : 'Play'"></span>
  </button>

  <button type="button" @click="player.seekBy(-10)">-10s</button>
  <button type="button" @click="player.seekBy(10)">+10s</button>

  <button type="button" @click="player.toggleMute()">
    <span x-text="player.muted ? 'Unmute' : 'Mute'"></span>
  </button>

  <input
    type="range"
    min="0"
    :max="player.duration"
    :value="player.currentTime"
    @input="player.seek($event.target.valueAsNumber)"
  />
</div>
```

## Video example

```html
<div x-data>
  <video
    x-video="player"
    src="/video/demo.mp4"
    poster="/video/poster.jpg"
    preload="metadata"
    playsinline
    @ended="onVideoEnded()"
    @error="handleVideoError($event)"
  ></video>

  <button type="button" @click="player.toggle()">
    <span x-text="player.playing ? 'Pause' : 'Play'"></span>
  </button>

  <button type="button" @click="player.seekBy(-10)">-10s</button>
  <button type="button" @click="player.seekBy(10)">+10s</button>

  <button type="button" @click="player.toggleFullscreen()">Fullscreen</button>

  <button type="button" @click="player.togglePictureInPicture()">
    Picture in Picture
  </button>
</div>
```

## Directive API

### `x-audio`

Binds a reactive audio controller to the current Alpine scope. **Must** be used on `HTMLAudioElement`.

```html
<audio x-audio="player" src="/track.ogg"></audio>
```

The expression is the scope variable name (`player` in the examples above).

### `x-video`

Binds a reactive video controller to the current Alpine scope. **Must** be used on `HTMLVideoElement`.

```html
<video x-video="player" src="/clip.mp4" playsinline></video>
```

### Native events

The directives do **not** emit duplicate custom events. Keep using native listeners on the element:

```html
<audio
  x-audio="audio"
  @play="onPlay()"
  @pause="onPause()"
  @ended="playNext()"
  @error="handleError($event)"
></audio>

<video
  x-video="video"
  @play="onPlay()"
  @ended="onEnded()"
  @enterpictureinpicture="onEnterPiP()"
  @leavepictureinpicture="onLeavePiP()"
></video>
```

`fullscreenchange` on `document` is observed internally for video fullscreen state — you do not need a custom plugin event.

## Controller API

Both controllers expose shared playback state and commands:

| State / command | Description |
| --- | --- |
| `element` | Bound `HTMLAudioElement` or `HTMLVideoElement` |
| `paused` | Native `element.paused` |
| `playing` | `!element.paused && !element.ended` |
| `muted` / `ended` | Mute and end state |
| `loading` | `readyState < HAVE_FUTURE_DATA` |
| `ready` | `readyState >= HAVE_CURRENT_DATA` |
| `currentTime` / `duration` / `progress` | Timing (`progress` is `0`–`1`) |
| `volume` / `playbackRate` | Output level and rate |
| `play()` / `pause()` / `toggle()` | Playback controls (`play()` returns the native promise) |
| `seek(time)` / `seekBy(seconds)` / `restart()` | Timeline controls |
| `setVolume()` / `volumeBy()` / `mute()` / `unmute()` / `toggleMute()` | Volume controls |
| `setPlaybackRate(rate)` | Rate control |

`VideoController` additionally exposes:

| State / command | Description |
| --- | --- |
| `fullscreen` | Whether the video element is the fullscreen element |
| `pictureInPicture` | Whether the video is in Picture-in-Picture |
| `requestFullscreen()` / `exitFullscreen()` / `toggleFullscreen()` | Fullscreen controls |
| `requestPictureInPicture()` / `exitPictureInPicture()` / `togglePictureInPicture()` | PiP controls (feature-detected) |

State updates when you call controller methods **or** when the native element changes externally (for example through browser controls).

## Plugin options

```ts
playerPlugin({ id: "player" });
```

| Option | Default | Description |
| --- | --- | --- |
| `id` | — | Reserved for future cross-cutting configuration |

## Standalone usage (no Alpine)

```ts
import {
  AudioController,
  createAudioController,
  createPlayerController,
  createVideoController,
  PlayerController,
  VideoController,
} from "@ailuracode/alpine-player";

const audio = createAudioController(document.querySelector("audio")!);
audio.mount();
await audio.play();

const video = createVideoController(document.querySelector("video")!);
video.mount();
await video.toggleFullscreen();

video.destroy();
```

## Errors

`PlayerError` extends `ToolkitError` with stable codes:

| Code | When |
| --- | --- |
| `PLAYER_INVALID_ELEMENT` | `x-audio` / `x-video` used on the wrong element type |
| `PLAYER_MISSING_EXPRESSION` | Directive used without a scope variable name |
| `PLAYER_PICTURE_IN_PICTURE_UNSUPPORTED` | PiP requested in an unsupported browser |

## Browser, SSR, and lifecycle

- Importing the package is SSR-safe — browser APIs are accessed only after `mount()` or directive initialization on a connected element.
- `play()` returns the native `HTMLMediaElement.play()` promise, including autoplay rejections.
- `seek()` clamps values when duration is known; `NaN`, `Infinity`, and unknown durations are handled safely.
- Event listeners are removed when Alpine destroys the directive or when `destroy()` runs on a standalone controller.
- Native `src`, `<source>`, and `<track>` children continue to work — the directives do not replace the element.

## Composition and related packages

| Package | Responsibility |
| --- | --- |
| `@ailuracode/alpine-player` | Native `<audio>` / `<video>` playback (`x-audio`, `x-video`) |
| `@ailuracode/alpine-media` | Viewport breakpoints and `matchMedia` features (`$store.media`) |

Live demo: `/playground/player/` on the documentation site.

## License

MIT
