---
title: "Attention"
description: "Wake Lock e Idle Detection com os magics $wakelock e $idle."
---

Package: `@ailuracode/alpinejs-attention`

Screen Wake Lock e Idle Detection reativos via magics `$wakelock` e `$idle`. Encapsula a [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) e a [Idle Detection API](https://developer.mozilla.org/en-US/docs/Web/API/Idle_Detection_API) quando disponíveis.

## Instalação

```bash
npm install @ailuracode/alpinejs-attention alpinejs
```

## Configuração

```js
import Alpine from "alpinejs";
import attention from "@ailuracode/alpinejs-attention";

Alpine.plugin(attention);
Alpine.start();
```

## `$wakelock` magic

| Propriedade / método | Tipo | Descrição |
|-----------------|------|-------------|
| `isSupported` | `boolean` | `true` quando `navigator.wakeLock` está disponível |
| `isActive` | `boolean` | `true` enquanto um screen wake lock está ativo |
| `isRequesting` | `boolean` | `true` enquanto `request()` está em andamento |
| `error` | `string \| null` | Última mensagem de erro, se houver |
| `request()` | `() => Promise<boolean>` | Adquire um screen wake lock |
| `release()` | `() => Promise<boolean>` | Libera o wake lock atual |

O plugin readquire o wake lock quando a aba fica visível novamente se você chamou `request()` anteriormente e não chamou `release()`.

## `$idle` magic

| Propriedade / método | Tipo | Descrição |
|-----------------|------|-------------|
| `isSupported` | `boolean` | `true` quando `IdleDetector` está disponível |
| `isWatching` | `boolean` | `true` enquanto a detecção de inatividade está em execução |
| `isLoading` | `boolean` | `true` enquanto `start()` está em andamento |
| `isActive` | `boolean` | `true` quando o usuário está ativo |
| `isIdle` | `boolean` | `true` quando o usuário está inativo |
| `userState` | `'active' \| 'idle' \| null` | Estado atual de inatividade do usuário |
| `screenState` | `'locked' \| 'unlocked' \| null` | Estado atual de bloqueio da tela |
| `permission` | `PermissionState \| null` | Última permissão conhecida de idle-detection |
| `threshold` | `number` | Limiar de inatividade em milissegundos (padrão e mínimo `60000`) |
| `error` | `string \| null` | Última mensagem de erro, se houver |
| `requestPermission()` | `() => Promise<PermissionState>` | Solicita permissão de idle-detection |
| `start(options?)` | `(options?: { threshold?: number }) => Promise<boolean>` | Inicia a detecção de inatividade |
| `stop()` | `() => boolean` | Para a detecção de inatividade |

## Exemplos HTML

```html
<section x-data>
  <p x-show="!$wakelock.isSupported">Wake Lock is not supported here.</p>
  <button
    type="button"
    x-show="$wakelock.isSupported"
    @click="$wakelock.isActive ? $wakelock.release() : $wakelock.request()"
    x-text="$wakelock.isActive ? 'Allow sleep' : 'Keep screen awake'"
  ></button>
</section>

<section x-data>
  <p x-show="!$idle.isSupported">Idle Detection is not supported here.</p>
  <button
    type="button"
    x-show="$idle.isSupported && !$idle.isWatching"
    @click="$idle.start()"
  >
    Start idle detection
  </button>
  <p x-show="$idle.isWatching">
    User: <strong x-text="$idle.userState"></strong> ·
    Screen: <strong x-text="$idle.screenState"></strong>
  </p>
  <p x-show="$idle.isIdle" class="hint">User went idle — pause expensive work.</p>
</section>
```

## Notas

- Ambas as APIs exigem um [contexto seguro](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts) (HTTPS ou localhost)
- Idle Detection exige permissão explícita via `requestPermission()` ou `start()`
- O limiar de inatividade deve ser de pelo menos **1 minuto** (`60000` ms); valores menores são limitados automaticamente
- Wake locks são liberados automaticamente quando a aba fica oculta; o plugin os readquire ao retornar quando apropriado
- O suporte entre navegadores é limitado — sempre verifique `isSupported` antes de chamar ações
- Estado de ambiente somente leitura com métodos imperativos — sem store, sem persistência
