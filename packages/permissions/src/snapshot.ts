import type {
  NormalizedPermissionState,
  PermissionAvailability,
  PermissionSnapshot,
} from "./types.js";

export function createInitialSnapshot(
  availability: PermissionAvailability,
  options: {
    requiresUserGesture?: boolean;
    permission?: NormalizedPermissionState;
  } = {}
): PermissionSnapshot {
  const supported = availability === "available";

  return {
    permission: options.permission ?? "unknown",
    availability,
    requestState: "idle",
    canRequest: supported,
    requiresUserGesture: options.requiresUserGesture ?? true,
    error: null,
    result: null,
  };
}

export function deriveCanRequest(
  snapshot: Pick<PermissionSnapshot, "permission" | "availability" | "requestState">
): boolean {
  if (snapshot.availability !== "available") {
    return false;
  }

  if (snapshot.requestState === "requesting") {
    return false;
  }

  return snapshot.permission === "prompt" || snapshot.permission === "unknown";
}

export function normalizePermissionState(
  state: PermissionState | NormalizedPermissionState | null | undefined
): NormalizedPermissionState {
  if (state === "granted" || state === "prompt" || state === "denied") {
    return state;
  }

  return "unknown";
}
