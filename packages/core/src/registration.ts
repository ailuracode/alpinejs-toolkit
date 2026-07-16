import type Base from "alpinejs";
import { ToolkitError } from "./error";
import type { Alpine } from "./type";

export interface RegistrationGuardOptions {
  readonly override?: boolean;
}

type RegistrationKind = "store" | "magic" | "directive";

export class RegistrationError extends ToolkitError {
  readonly kind: RegistrationKind;
  readonly registrationName: string;
  readonly packageName: string;

  constructor(kind: RegistrationKind, name: string, packageName: string) {
    super(
      `${kind} "${name}" already registered. Use { override: true } in ${packageName}Plugin() to replace, or pass a unique key to register it under a different name.`,
      "REGISTRATION_COLLISION"
    );
    this.kind = kind;
    this.registrationName = name;
    this.packageName = packageName;
  }
}

const registeredMagics = new Set<string>();
const registeredDirectives = new Set<string>();

export function resetRegistrationTracking(): void {
  registeredMagics.clear();
  registeredDirectives.clear();
}

export function untrackMagic(name: string): void {
  registeredMagics.delete(name);
}

export function untrackDirective(name: string): void {
  registeredDirectives.delete(name);
}

export function guardStore<TStore>(
  alpine: Alpine,
  name: string,
  value: TStore,
  packageName: string,
  options: RegistrationGuardOptions = {}
): TStore {
  const existing = alpine.store(name);
  if (existing && !options.override) {
    throw new RegistrationError("store", name, packageName);
  }
  alpine.store(name, value);
  return alpine.store(name) as TStore;
}

export function guardMagic(
  alpine: Alpine,
  name: string,
  accessor: () => unknown,
  packageName: string,
  options: RegistrationGuardOptions = {}
): void {
  const tracked = registeredMagics.has(name);
  if (tracked && !options.override) {
    throw new RegistrationError("magic", name, packageName);
  }
  registeredMagics.add(name);
  alpine.magic(name, accessor as never);
}

export function guardDirective(
  alpine: Alpine,
  name: string,
  handler: Base.DirectiveCallback,
  packageName: string,
  options: RegistrationGuardOptions = {}
): unknown {
  const tracked = registeredDirectives.has(name);
  if (tracked && !options.override) {
    throw new RegistrationError("directive", name, packageName);
  }
  registeredDirectives.add(name);
  return alpine.directive(name, handler);
}
