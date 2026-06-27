---
title: "Geo"
description: "Geolocalização e permissões com o store $store.geo."
---

Package: `@ailuracode/alpinejs-geo`

Geolocalização reativa via store `$store.geo`. Encapsula a [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API) do navegador com requisições pontuais e monitoramento contínuo de posição.

## Instalação

```bash
npm install @ailuracode/alpinejs-geo alpinejs
```

## Configuração

```js
import Alpine from "alpinejs";
import geo from "@ailuracode/alpinejs-geo";

Alpine.plugin(geo);
Alpine.start();
```

## Store API

### Estado

| Propriedade | Tipo | Descrição |
|----------|------|-------------|
| `latitude` | `number \| null` | Última latitude conhecida em graus decimais |
| `longitude` | `number \| null` | Última longitude conhecida em graus decimais |
| `accuracy` | `number \| null` | Raio de precisão em metros |
| `altitude` | `number \| null` | Altitude em metros acima do elipsoide |
| `altitudeAccuracy` | `number \| null` | Precisão da altitude em metros |
| `heading` | `number \| null` | Direção do deslocamento em graus |
| `speed` | `number \| null` | Velocidade em metros por segundo |
| `timestamp` | `number \| null` | Timestamp da posição (Unix ms) |
| `error` | `string \| null` | Última mensagem de erro |
| `errorCode` | `number \| null` | Código de erro de geolocalização (`1` negado, `2` indisponível, `3` timeout) |
| `loading` | `boolean` | `true` enquanto um `request()` pontual está pendente |
| `watching` | `boolean` | `true` enquanto `watch()` está ativo |

### Getters

| Getter | Tipo | Descrição |
|--------|------|-------------|
| `hasPosition` | `boolean` | `true` quando latitude e longitude estão disponíveis |
| `isSupported` | `boolean` | `true` quando `navigator.geolocation` existe |
| `isWatching` | `boolean` | Alias para `watching` |
| `isLoading` | `boolean` | Alias para `loading` |
| `hasError` | `boolean` | `true` quando `error` está definido |

### Ações

| Método | Retorno | Descrição |
|--------|---------|-------------|
| `request(options?)` | `Promise<boolean>` | Posição pontual via `getCurrentPosition` |
| `watch(options?)` | `boolean` | Inicia `watchPosition`; retorna `false` se não suportado ou já monitorando |
| `unwatch()` | `boolean` | Para o monitoramento ativo; retorna `false` se nenhum estiver ativo |
| `reset()` | `boolean` | Limpa posição e estado de erro sem parar um watch |

Todas as ações aceitam [PositionOptions](https://developer.mozilla.org/en-US/docs/Web/API/PositionOptions) opcionais: `enableHighAccuracy`, `timeout`, `maximumAge`.

## Exemplos HTML

```html
<button
  @click="$store.geo.request({ enableHighAccuracy: true })"
  :disabled="!$store.geo.isSupported || $store.geo.isLoading"
>
  Use my location
</button>

<p x-show="$store.geo.hasPosition">
  You are at
  <span x-text="$store.geo.latitude.toFixed(4)"></span>,
  <span x-text="$store.geo.longitude.toFixed(4)"></span>
  (±<span x-text="Math.round($store.geo.accuracy)"></span> m)
</p>

<p x-show="$store.geo.hasError" x-text="$store.geo.error"></p>
```

```html
<button
  x-show="!$store.geo.isWatching"
  @click="$store.geo.watch()"
>
  Start tracking
</button>

<button
  x-show="$store.geo.isWatching"
  @click="$store.geo.unwatch()"
>
  Stop tracking
</button>
```

## Notas

- Exige permissão do usuário em contextos seguros (HTTPS ou localhost)
- `request()` e `watch()` compartilham o mesmo estado reativo; uma atualização bem-sucedida limpa o erro anterior
- `reset()` limpa as coordenadas armazenadas, mas não para um watch ativo — chame `unwatch()` primeiro se necessário
- O acesso somente leitura ao ambiente não é exposto como magic; use a store para estado compartilhado e ações entre componentes
