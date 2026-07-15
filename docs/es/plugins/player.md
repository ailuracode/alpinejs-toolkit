---
title: "Player"
description: "Controladores reactivos para reproducción nativa de audio y video con x-audio y x-video."
---

Package: `@ailuracode/alpine-player`

Directivas Alpine.js para **reproducción nativa de audio y video** — controladores reactivos para `<audio>` y `<video>` mediante `x-audio` y `x-video`.

**Agnóstico al framework CSS** — sin chrome de reproductor ni estilos. Tú enlazas elementos nativos y conectas tus propios controles.

> **No es [`@ailuracode/alpine-media`](./media.md)** — ese paquete gestiona breakpoints del viewport, dimensiones y media features del navegador (`$store.media`). **Player** solo controla la reproducción de `<audio>` / `<video>`.

## Instalación

```bash
pnpm add @ailuracode/alpine-player alpinejs
```

## Inicio rápido

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

## Ejemplo de audio

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

## Ejemplo de video

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

  <button type="button" @click="player.toggleFullscreen()">Pantalla completa</button>

  <button type="button" @click="player.togglePictureInPicture()">
    Picture in Picture
  </button>
</div>
```

## API de directivas

### `x-audio`

Enlaza un controlador de audio reactivo al scope actual de Alpine. Debe usarse en `HTMLAudioElement`.

```html
<audio x-audio="player" src="/track.ogg"></audio>
```

### `x-video`

Enlaza un controlador de video reactivo al scope actual. Debe usarse en `HTMLVideoElement`.

```html
<video x-video="player" src="/clip.mp4" playsinline></video>
```

### Eventos nativos

Las directivas **no** emiten eventos personalizados duplicados. Sigue usando listeners nativos:

```html
<audio x-audio="audio" @play="onPlay()" @ended="playNext()"></audio>
<video x-video="video" @enterpictureinpicture="onEnterPiP()"></video>
```

## API del controlador

Estado y comandos compartidos:

| Estado / comando | Descripción |
| --- | --- |
| `element` | `HTMLAudioElement` o `HTMLVideoElement` enlazado |
| `paused` / `playing` | Estado de reproducción |
| `muted` / `ended` | Silencio y fin de pista |
| `loading` / `ready` | Buffering según `readyState` |
| `currentTime` / `duration` / `progress` | Tiempo (`progress` entre `0` y `1`) |
| `play()` / `pause()` / `toggle()` | Controles de reproducción |
| `seek()` / `seekBy()` / `restart()` | Control de línea de tiempo |
| `setVolume()` / `volumeBy()` / `mute()` / `unmute()` / `toggleMute()` | Volumen |
| `setPlaybackRate(rate)` | Velocidad de reproducción |

`VideoController` añade `fullscreen`, `pictureInPicture`, y métodos de pantalla completa / PiP (con detección de capacidades).

## Uso standalone (sin Alpine)

```ts
import { createAudioController, createVideoController } from "@ailuracode/alpine-player";

const audio = createAudioController(document.querySelector("audio")!);
audio.mount();
await audio.play();

const video = createVideoController(document.querySelector("video")!);
video.mount();
await video.toggleFullscreen();
```

## Errores

`PlayerError` con códigos estables: `PLAYER_INVALID_ELEMENT`, `PLAYER_MISSING_EXPRESSION`, `PLAYER_PICTURE_IN_PICTURE_UNSUPPORTED`.

## Paquetes relacionados

| Paquete | Responsabilidad |
| --- | --- |
| `@ailuracode/alpine-player` | Reproducción `<audio>` / `<video>` |
| `@ailuracode/alpine-media` | Breakpoints y `matchMedia` (`$store.media`) |

Demo interactiva en `/playground/player/` del sitio de documentación.
