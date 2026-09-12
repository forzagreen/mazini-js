export type MaziniErrorCode =
  | "bad_root"
  | "unknown_wazn"
  | "reduced_not_applicable"
  | "unsupported_weakness"
  | "invalid_radicals"
  | "internal";

/** Every error the engine raises on purpose. `code` is stable; `message` may change. */
export class MaziniError extends Error {
  readonly code: MaziniErrorCode;
  constructor(code: MaziniErrorCode, message: string) {
    super(message);
    this.name = "MaziniError";
    this.code = code;
  }
}

export function internal(message: string): never {
  throw new MaziniError("internal", "Internal error: " + message);
}
