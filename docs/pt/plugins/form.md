---
title: "Form"
description: "Estado de formulário headless e validação para Alpine.js."
---

Package: `@ailuracode/alpine-form`

Estado de formulário headless e validação para Alpine.js. Rastreia `dirty`, `touched`, `valid`, `submitting` e `submitted`; executa validação síncrona e assíncrona; mapeia erros do servidor (incluindo ponteiros JSON:API); e reinicia — sem renderizar controles nem substituir `x-model`.

## Instalação

```bash
pnpm add @ailuracode/alpine-form alpinejs
```

## Configuração

```js
import Alpine from "alpinejs";
import { formPlugin } from "@ailuracode/alpine-form";

Alpine.plugin(formPlugin({
  defaultValidateOn: "submit",
}));

Alpine.start();
```

O plugin registra `$store.form` e o magic `$form`.

## API semelhante ao TanStack Form

Use `createForm()` para uma API alinhada com o [TanStack Form](https://tanstack.com/form):

```ts
import { createForm } from "@ailuracode/alpine-form";
import { z } from "zod";

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const form = createForm({
  defaultValues: { email: "", password: "" },
  validators: {
    onSubmit: signUpSchema, // Standard Schema — Zod 3.24+, Valibot, ArkType
  },
  onSubmit: async ({ value }) => {
    await fetch("/api/signup", { method: "POST", body: JSON.stringify(value) });
  },
});

const email = form.field("email", {
  onChange: ({ value }) => (value ? undefined : "Required"),
  onChangeAsyncDebounceMs: 300,
  onChangeAsync: async ({ value }) => {
    const taken = await checkEmailTaken(value);
    return taken ? "Email already registered" : undefined;
  },
});

email.handleChange("user@example.com");
email.handleBlur();

await form.handleSubmit();

// Estado estilo TanStack
form.state.canSubmit;
form.state.isPristine;
email.state.meta.errors;
email.state.meta.errorMap.onChange;
```

### API de campo

| Membro | Equivalente TanStack | Descrição |
|--------|---------------------|-------------|
| `field(name, validators?)` | `form.Field` | Retorna um handle de campo |
| `handleChange(value)` | `field.handleChange` | Atualiza o valor e executa os validadores `onChange` |
| `handleBlur()` | `field.handleBlur` | Marca como tocado e executa os validadores `onBlur` |
| `state.value` | `field.state.value` | Valor atual do campo |
| `state.meta.errors` | `field.state.meta.errors` | Todas as mensagens de erro ativas |
| `state.meta.errorMap` | `field.state.meta.errorMap` | Erros por gatilho (`onChange`, `onBlur`, `onSubmit`) |
| `parseValueWithSchema(schema)` | `fieldApi.parseValueWithSchema` | Valida um valor com Standard Schema |

### API de formulário

| Membro | Equivalente TanStack | Descrição |
|--------|---------------------|-------------|
| `handleSubmit()` | `form.handleSubmit` | Valida com os validadores `onSubmit` e então chama `onSubmit` |
| `state.values` | `form.state.values` | Valores atuais do formulário |
| `state.canSubmit` | `form.state.canSubmit` | `true` quando o formulário não tem erros |
| `state.isPristine` | `form.state.isPristine` | `true` quando nenhum campo está sujo |
| `state.errorMap` | `form.state.errorMap` | Erros no nível do formulário por gatilho |

## Zod e Standard Schema

O pacote **não** inclui o Zod. Qualquer biblioteca que implemente [Standard Schema v1](https://github.com/standard-schema/standard-schema) funciona por duck typing:

```ts
import { createStandardSchemaAdapter, isStandardSchema } from "@ailuracode/alpine-form";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

// Com createForm (recomendado)
const form = createForm({
  defaultValues: { email: "" },
  validators: { onSubmit: schema },
});

// Com $store.form / FormController
$store.form.register("signup", {
  initialValues: { email: "" },
  adapter: createStandardSchemaAdapter(schema),
});
```

Bibliotecas de schema compatíveis (quando expõem `~standard`): **Zod**, **Valibot**, **ArkType**, **Effect/Schema**.

## API do store

### Estado por formulário

| Propriedade | Tipo | Descrição |
|----------|------|-------------|
| `values` | `Record<string, unknown>` | Valores atuais do formulário (suporta caminhos aninhados) |
| `initialValues` | `Record<string, unknown>` | Valores capturados no registro / base de reinício |
| `committedValues` | `Record<string, unknown>` | Valores após o último envio bem-sucedido |
| `fields` | `Record<string, FieldState>` | Metadados por campo indexados por caminho |
| `dirty` | `boolean` | `true` quando algum campo difere do valor inicial |
| `touched` | `boolean` | `true` quando algum campo perdeu o foco |
| `valid` | `boolean` | `true` quando não há erros de validação |
| `invalid` | `boolean` | `true` quando existem erros de campo ou formulário |
| `validating` | `boolean` | `true` enquanto a validação assíncrona está em andamento |
| `submitting` | `boolean` | `true` enquanto o handler de envio está em execução |
| `submitted` | `boolean` | `true` após um envio bem-sucedido |
| `formErrors` | `readonly string[]` | Erros sem campo |

### Métodos

| Método | Descrição |
|--------|-------------|
| `register(id, options?)` | Registra uma instância de formulário |
| `unregister(id)` | Remove um formulário e aborta o trabalho em andamento |
| `registerField(formId, path, options?)` | Registra um campo com validador opcional |
| `unregisterField(formId, path)` | Remove um campo dinâmico |
| `setValue(formId, path, value)` | Atualiza o valor de um campo |
| `touch(formId, path)` | Marca um campo como tocado |
| `validate(formId)` | Executa os validadores e retorna se o formulário é válido |
| `submit(formId, handler)` | Valida e então executa o handler de envio |
| `reset(formId, options?)` | Reinicia para os valores iniciais ou confirmados |
| `setServerErrors(formId, fieldErrors, formErrors?)` | Aplica erros de validação do servidor |
| `fieldProps(formId, path, options?)` | Propriedades ARIA headless (`aria-invalid`, `aria-describedby`) |
| `focusFirstError(formId, root?)` | Foca o primeiro campo inválido dentro de um elemento raiz |
| `announceErrors(formId, liveRegion?)` | Constrói e opcionalmente anuncia um resumo de erros |

## Adaptadores de validação

Use `ValidationAdapter` para validação entre campos ou assíncrona sem incluir uma biblioteca de schemas:

```ts
import { composeValidationAdapters, createFieldValidatorsAdapter } from "@ailuracode/alpine-form";

const adapter = composeValidationAdapters([
  createFieldValidatorsAdapter({
    email: (value) => (value ? null : "Required"),
  }),
  {
    async validate(values, { signal }) {
      if (signal.aborted) {
        return { valid: true };
      }
      return values.password === values.confirm
        ? { valid: true }
        : { fieldErrors: { confirm: ["Passwords must match"] } };
    },
  },
]);
```

## Erros do servidor JSON:API

```ts
import { mapJsonApiErrors } from "@ailuracode/alpine-form";

const { fieldErrors, formErrors } = mapJsonApiErrors(response.errors);
$store.form.setServerErrors("signup", fieldErrors, formErrors);
```

Ponteiros como `/data/attributes/email` são mapeados para o caminho de campo `email`.

## Acessibilidade

- Vincule `fieldProps()` para `aria-invalid` e `aria-describedby`.
- Marque os controles com `data-form-field="path"` para que `focusFirstError()` possa mover o foco ao enviar.
- Envie `announceErrors()` para uma região viva para anúncios a leitores de tela.

## Controller independente

```ts
import { createFormController } from "@ailuracode/alpine-form";

const form = createFormController();
form.register("contact");
form.on("change", (detail) => {
  console.log(detail.formId, detail.source);
});
```

## Fora de escopo

- Renderizar inputs ou labels
- Substituir `x-model`
- Incluir Zod, Yup ou outras bibliotecas de schemas
