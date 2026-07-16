import { safeDocument } from "@ailuracode/alpine-core/browser";

/** Get the document element, or null if none exists */
export const safeDocumentElement = () => safeDocument()?.documentElement ?? null;
