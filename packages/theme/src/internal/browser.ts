import { safeDocument } from "../core-deps.js";

/** Get the document element, or null if none exists */
export const safeDocumentElement = () => safeDocument()?.documentElement ?? null;
