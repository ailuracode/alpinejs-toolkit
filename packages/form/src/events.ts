/**
 * Typed event map for `@ailuracode/alpine-form`.
 */

import type { FormChangeDetail, FormSubmitDetail, FormSubmitErrorDetail } from "./types.js";

export interface FormEvents extends Record<string, unknown> {
  change: FormChangeDetail;
  submit: FormSubmitDetail;
  "submit-error": FormSubmitErrorDetail;
}
