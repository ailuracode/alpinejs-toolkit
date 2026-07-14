---
title: "Form"
description: "Estado de formulario headless y validación para Alpine.js."
---

Package: `@ailuracode/alpine-form`

Estado de formulario headless y validación para Alpine.js. Rastrea `dirty`, `touched`, `valid`, `submitting` y `submitted`; ejecuta validación síncrona y asíncrona; mapea errores del servidor (incluidos los punteros JSON:API); y reinicia — sin renderizar controles ni reemplazar `x-model`.

## Instalación

```bash
pnpm add @ailuracode/alpine-form alpinejs
```

## Configuración

```js
import Alpine from "alpinejs";
import { formPlugin } from "@ailuracode/alpine-form";

Alpine.plugin(formPlugin({
  defaultValidateOn: "submit",
}));

Alpine.start();
```

El plugin registra `$store.form` y el magic `$form`.

## API similar a TanStack Form

Usa `createForm()` para una API alineada con [TanStack Form](https://tanstack.com/form):

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

// Estado tipo TanStack
form.state.canSubmit;
form.state.isPristine;
email.state.meta.errors;
email.state.meta.errorMap.onChange;
```

### API de campo

| Miembro | Equivalente TanStack | Descripción |
|--------|---------------------|-------------|
| `field(name, validators?)` | `form.Field` | Devuelve un handle de campo |
| `handleChange(value)` | `field.handleChange` | Actualiza el valor y ejecuta los validadores `onChange` |
| `handleBlur()` | `field.handleBlur` | Marca como tocado y ejecuta los validadores `onBlur` |
| `state.value` | `field.state.value` | Valor actual del campo |
| `state.meta.errors` | `field.state.meta.errors` | Todos los mensajes de error activos |
| `state.meta.errorMap` | `field.state.meta.errorMap` | Errores por disparador (`onChange`, `onBlur`, `onSubmit`) |
| `parseValueWithSchema(schema)` | `fieldApi.parseValueWithSchema` | Valida un valor con Standard Schema |

### API de formulario

| Miembro | Equivalente TanStack | Descripción |
|--------|---------------------|-------------|
| `handleSubmit()` | `form.handleSubmit` | Valida con los validadores `onSubmit` y luego llama a `onSubmit` |
| `state.values` | `form.state.values` | Valores actuales del formulario |
| `state.canSubmit` | `form.state.canSubmit` | `true` cuando el formulario no tiene errores |
| `state.isPristine` | `form.state.isPristine` | `true` cuando ningún campo está sucio |
| `state.errorMap` | `form.state.errorMap` | Errores a nivel de formulario por disparador |

## Zod y Standard Schema

El paquete **no** incluye Zod. Cualquier librería que implemente [Standard Schema v1](https://github.com/standard-schema/standard-schema) funciona por duck typing:

```ts
import { createStandardSchemaAdapter, isStandardSchema } from "@ailuracode/alpine-form";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

// Con createForm (recomendado)
const form = createForm({
  defaultValues: { email: "" },
  validators: { onSubmit: schema },
});

// Con $store.form / FormController
$store.form.register("signup", {
  initialValues: { email: "" },
  adapter: createStandardSchemaAdapter(schema),
});
```

Librerías de esquema compatibles (cuando exponen `~standard`): **Zod**, **Valibot**, **ArkType**, **Effect/Schema**.

## API del store

### Estado por formulario

| Propiedad | Tipo | Descripción |
|----------|------|-------------|
| `values` | `Record<string, unknown>` | Valores actuales del formulario (admite rutas anidadas) |
| `initialValues` | `Record<string, unknown>` | Valores capturados al registrar / base de reinicio |
| `committedValues` | `Record<string, unknown>` | Valores tras el último envío exitoso |
| `fields` | `Record<string, FieldState>` | Metadatos por campo indexados por ruta |
| `dirty` | `boolean` | `true` cuando algún campo difiere de su valor inicial |
| `touched` | `boolean` | `true` cuando algún campo perdió el foco |
| `valid` | `boolean` | `true` cuando no hay errores de validación |
| `invalid` | `boolean` | `true` cuando existen errores de campo o formulario |
| `validating` | `boolean` | `true` mientras hay validación asíncrona en curso |
| `submitting` | `boolean` | `true` mientras se ejecuta el handler de envío |
| `submitted` | `boolean` | `true` tras un envío exitoso |
| `formErrors` | `readonly string[]` | Errores sin campo |

### Métodos

| Método | Descripción |
|--------|-------------|
| `register(id, options?)` | Registra una instancia de formulario |
| `unregister(id)` | Elimina un formulario y aborta el trabajo en curso |
| `registerField(formId, path, options?)` | Registra un campo con validador opcional |
| `unregisterField(formId, path)` | Elimina un campo dinámico |
| `setValue(formId, path, value)` | Actualiza el valor de un campo |
| `touch(formId, path)` | Marca un campo como tocado |
| `validate(formId)` | Ejecuta los validadores y devuelve si el formulario es válido |
| `submit(formId, handler)` | Valida y luego ejecuta el handler de envío |
| `reset(formId, options?)` | Reinicia a los valores iniciales o confirmados |
| `setServerErrors(formId, fieldErrors, formErrors?)` | Aplica errores de validación del servidor |
| `fieldProps(formId, path, options?)` | Propiedades ARIA headless (`aria-invalid`, `aria-describedby`) |
| `focusFirstError(formId, root?)` | Enfoca el primer campo inválido dentro de un elemento raíz |
| `announceErrors(formId, liveRegion?)` | Construye y opcionalmente anuncia un resumen de errores |

## Adaptadores de validación

Usa `ValidationAdapter` para validación entre campos o asíncrona sin incluir una librería de esquemas:

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

## Errores del servidor JSON:API

```ts
import { mapJsonApiErrors } from "@ailuracode/alpine-form";

const { fieldErrors, formErrors } = mapJsonApiErrors(response.errors);
$store.form.setServerErrors("signup", fieldErrors, formErrors);
```

Los punteros como `/data/attributes/email` se mapean a la ruta de campo `email`.

## Accesibilidad

- Enlaza `fieldProps()` para `aria-invalid` y `aria-describedby`.
- Marca los controles con `data-form-field="path"` para que `focusFirstError()` pueda mover el foco al enviar.
- Envía `announceErrors()` a una región en vivo para anuncios a lectores de pantalla.

## Controller independiente

```ts
import { createFormController } from "@ailuracode/alpine-form";

const form = createFormController();
form.register("contact");
form.on("change", (detail) => {
  console.log(detail.formId, detail.source);
});
```

## Fuera de alcance

- Renderizar inputs o labels
- Reemplazar `x-model`
- Incluir Zod, Yup u otras librerías de esquemas
