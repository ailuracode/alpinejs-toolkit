import { safeDocument } from "@ailuracode/alpine-core";

/** Get the document element, or null if none exists */
export const safeDocumentElement = () => safeDocument()?.documentElement ?? null;
