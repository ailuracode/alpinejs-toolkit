# @ailuracode/alpine-player

Alpine.js directives for **native audio and video playback** — reactive controllers for `<audio>` and `<video>` elements via `x-audio` and `x-video`.

This package is separate from [`@ailuracode/alpine-media`](https://www.npmjs.com/package/@ailuracode/alpine-media), which owns viewport breakpoints, dimensions, and browser media-feature state.

## Install

```bash
pnpm add @ailuracode/alpine-player alpinejs
```

## Setup

```ts
import Alpine from "alpinejs";
import { playerPlugin } from "@ailuracode/alpine-player";

Alpine.plugin(playerPlugin());
Alpine.start();
```

## Audio

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

## Video

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

Binds a reactive {@link AudioController} to the current Alpine scope. Must be used on `HTMLAudioElement`.

```html
<audio x-audio="player"></audio>
```

### `x-video`

Binds a reactive {@link VideoController} to the current Alpine scope. Must be used on `HTMLVideoElement`.

```html
<video x-video="player"></video>
```

Native media events (`@play`, `@pause`, `@ended`, `@error`, `@enterpictureinpicture`, and others) continue to work on the element. The directives do not emit duplicate custom events.

## Controller API

Both controllers expose shared playback state and commands:

| State / command | Description |
| --- | --- |
| `element` | Bound `HTMLAudioElement` or `HTMLVideoElement` |
| `paused` / `playing` | Playback state |
| `muted` / `ended` | Mute and end state |
| `loading` / `ready` | Buffering readiness from `readyState` |
| `currentTime` / `duration` / `progress` | Timing (`progress` is `0`–`1`) |
| `volume` / `playbackRate` | Output level and rate |
| `play()` / `pause()` / `toggle()` | Playback controls |
| `seek(time)` / `seekBy(seconds)` / `restart()` | Timeline controls |
| `setVolume()` / `volumeBy()` / `mute()` / `unmute()` / `toggleMute()` | Volume controls |
| `setPlaybackRate(rate)` | Rate control |

`VideoController` additionally exposes:

| State / command | Description |
| --- | --- |
| `fullscreen` | Whether the video element is fullscreen |
| `pictureInPicture` | Whether the video is in Picture-in-Picture |
| `requestFullscreen()` / `exitFullscreen()` / `toggleFullscreen()` | Fullscreen controls |
| `requestPictureInPicture()` / `exitPictureInPicture()` / `togglePictureInPicture()` | PiP controls (feature-detected) |

## Standalone usage (no Alpine)

```ts
import {
  createAudioController,
  createPlayerController,
  createVideoController,
} from "@ailuracode/alpine-player";

const audio = createAudioController(document.querySelector("audio")!);
audio.mount();
audio.play();

const video = createVideoController(document.querySelector("video")!);
video.mount();
await video.toggleFullscreen();
```

## Browser, SSR, and lifecycle

- Importing the package is SSR-safe — browser APIs are accessed only after `mount()` on a controller or when a directive initializes on a connected element.
- `play()` returns the native `HTMLMediaElement.play()` promise, including rejections.
- `seek()` clamps values when duration is known; unknown, `NaN`, and `Infinity` durations are handled safely.
- Event listeners are removed when Alpine destroys the directive or when `destroy()` is called on a standalone controller.
- Picture-in-Picture methods reject with `PlayerError` when the browser does not support PiP.

## Composition and related packages

| Package | Responsibility |
| --- | --- |
| `@ailuracode/alpine-player` | Native `<audio>` / `<video>` playback |
| `@ailuracode/alpine-media` | Viewport breakpoints and `matchMedia` features |

## License

MIT
