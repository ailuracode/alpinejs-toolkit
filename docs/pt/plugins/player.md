---
title: "Player"
description: "Controladores reativos para reprodução nativa de áudio e vídeo com x-audio e x-video."
---

Package: `@ailuracode/alpine-player`

Diretivas Alpine.js para **reprodução nativa de áudio e vídeo** — controladores reativos para `<audio>` e `<video>` via `x-audio` e `x-video`.

**Agnóstico a framework CSS** — sem chrome de player nem estilos. Você liga elementos nativos e conecta seus próprios controles.

> **Não é [`@ailuracode/alpine-media`](./media.md)** — esse pacote gerencia breakpoints do viewport, dimensões e media features do navegador (`$store.media`). **Player** controla apenas a reprodução de `<audio>` / `<video>`.

## Instalação

```bash
pnpm add @ailuracode/alpine-player alpinejs
```

## Início rápido

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

## Exemplo de áudio

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

## Exemplo de vídeo

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

  <button type="button" @click="player.toggleFullscreen()">Tela cheia</button>

  <button type="button" @click="player.togglePictureInPicture()">
    Picture in Picture
  </button>
</div>
```

## API de diretivas

### `x-audio`

Liga um controlador de áudio reativo ao escopo Alpine atual. Deve ser usado em `HTMLAudioElement`.

```html
<audio x-audio="player" src="/track.ogg"></audio>
```

### `x-video`

Liga um controlador de vídeo reativo ao escopo atual. Deve ser usado em `HTMLVideoElement`.

```html
<video x-video="player" src="/clip.mp4" playsinline></video>
```

### Eventos nativos

As diretivas **não** emitem eventos customizados duplicados. Continue usando listeners nativos:

```html
<audio x-audio="audio" @play="onPlay()" @ended="playNext()"></audio>
<video x-video="video" @enterpictureinpicture="onEnterPiP()"></video>
```

## API do controlador

Estado e comandos compartilhados:

| Estado / comando | Descrição |
| --- | --- |
| `element` | `HTMLAudioElement` ou `HTMLVideoElement` ligado |
| `paused` / `playing` | Estado de reprodução |
| `muted` / `ended` | Mudo e fim da faixa |
| `loading` / `ready` | Buffering via `readyState` |
| `currentTime` / `duration` / `progress` | Tempo (`progress` entre `0` e `1`) |
| `play()` / `pause()` / `toggle()` | Controles de reprodução |
| `seek()` / `seekBy()` / `restart()` | Linha do tempo |
| `setVolume()` / `volumeBy()` / `mute()` / `unmute()` / `toggleMute()` | Volume |
| `setPlaybackRate(rate)` | Taxa de reprodução |

`VideoController` adiciona `fullscreen`, `pictureInPicture`, e métodos de tela cheia / PiP (com detecção de suporte).

## Uso standalone (sem Alpine)

```ts
import { createAudioController, createVideoController } from "@ailuracode/alpine-player";

const audio = createAudioController(document.querySelector("audio")!);
audio.mount();
await audio.play();

const video = createVideoController(document.querySelector("video")!);
video.mount();
await video.toggleFullscreen();
```

## Erros

`PlayerError` com códigos estáveis: `PLAYER_INVALID_ELEMENT`, `PLAYER_MISSING_EXPRESSION`, `PLAYER_PICTURE_IN_PICTURE_UNSUPPORTED`.

## Pacotes relacionados

| Pacote | Responsabilidade |
| --- | --- |
| `@ailuracode/alpine-player` | Reprodução `<audio>` / `<video>` |
| `@ailuracode/alpine-media` | Breakpoints e `matchMedia` (`$store.media`) |

Demo interativa em `/playground/player/` do site de documentação.
