---
title: "Form"
description: "Package: @ailuracode/alpine-form"
---

Package: `@ailuracode/alpine-form`

Headless form state and validation for Alpine.js. Track `dirty`, `touched`, `valid`, `submitting`, and `submitted`; run sync and async validation; map server errors (including JSON:API pointers); and reset — without rendering controls or replacing `x-model`.

## Install

```bash
pnpm add @ailuracode/alpine-form alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import { formPlugin } from "@ailuracode/alpine-form";

Alpine.plugin(formPlugin({
  defaultValidateOn: "submit",
}));

Alpine.start();
```

The plugin registers `$store.form` and the `$form` magic.

## Store API

### Per-form state

| Property | Type | Description |
|----------|------|-------------|
| `values` | `Record<string, unknown>` | Current form values (supports nested paths) |
| `initialValues` | `Record<string, unknown>` | Values captured at registration / reset baseline |
| `committedValues` | `Record<string, unknown>` | Values after the last successful submit |
| `fields` | `Record<string, FieldState>` | Per-field metadata keyed by path |
| `dirty` | `boolean` | `true` when any field differs from its initial value |
| `touched` | `boolean` | `true` when any field was blurred |
| `valid` | `boolean` | `true` when there are no validation errors |
| `invalid` | `boolean` | `true` when field or form errors exist |
| `validating` | `boolean` | `true` while async validation is in flight |
| `submitting` | `boolean` | `true` while a submit handler is running |
| `submitted` | `boolean` | `true` after a successful submit |
| `formErrors` | `readonly string[]` | Non-field errors |

### Methods

| Method | Description |
|--------|-------------|
| `register(id, options?)` | Register a form instance |
| `unregister(id)` | Remove a form and abort in-flight work |
| `registerField(formId, path, options?)` | Register a field with optional validator |
| `unregisterField(formId, path)` | Remove a dynamic field |
| `setValue(formId, path, value)` | Update a field value |
| `touch(formId, path)` | Mark a field as touched |
| `validate(formId)` | Run validators and return whether the form is valid |
| `submit(formId, handler)` | Validate then run the submit handler |
| `reset(formId, options?)` | Reset to initial or committed values |
| `setServerErrors(formId, fieldErrors, formErrors?)` | Apply server-side validation errors |
| `fieldProps(formId, path, options?)` | Headless ARIA props (`aria-invalid`, `aria-describedby`) |
| `focusFirstError(formId, root?)` | Focus the first invalid field inside a root element |
| `announceErrors(formId, liveRegion?)` | Build and optionally announce an error summary |

## Validation adapters

Use `ValidationAdapter` for cross-field or async validation without bundling a schema library:

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

## JSON:API server errors

```ts
import { mapJsonApiErrors } from "@ailuracode/alpine-form";

const { fieldErrors, formErrors } = mapJsonApiErrors(response.errors);
$store.form.setServerErrors("signup", fieldErrors, formErrors);
```

Pointers like `/data/attributes/email` map to the `email` field path.

## Accessibility

- Bind `fieldProps()` for `aria-invalid` and `aria-describedby`.
- Mark controls with `data-form-field="path"` so `focusFirstError()` can move focus on submit.
- Pipe `announceErrors()` into a live region for screen-reader announcements.

## Standalone controller

```ts
import { createFormController } from "@ailuracode/alpine-form";

const form = createFormController();
form.register("contact");
form.on("change", (detail) => {
  console.log(detail.formId, detail.source);
});
```

## Non-goals

- Rendering inputs or labels
- Replacing `x-model`
- Bundling Zod, Yup, or other schema libraries
