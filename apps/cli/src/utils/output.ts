/**
 * Unified MCP-compatible JSON output for all CLI commands.
 *
 * Every command MUST use these helpers for its final output so that
 * AI agents (via MCP tool calls) can reliably parse responses.
 *
 * ── Success ──
 *   { "success": true, "result": { ... } }
 *
 * ── Error ──
 *   { "success": false, "error": { "code": <number>, "message": <string>, "data"?: { ... } } }
 *
 * ── Error Code Conventions (JSON-RPC reserved range) ──
 *   -32602  Invalid params (bad input, missing required fields)
 *   -32001  Insufficient balance
 *   -32002  Account not ready (not initialized, not deployed, not found)
 *   -32003  Sponsorship failed
 *   -32004  Build / estimation failed
 *   -32005  Sign / send failed
 *   -32006  Execution reverted (UserOp included but reverted on-chain)
 *   -32007  Hook authorization failed
 *   -32010  Email not bound
 *   -32011  Safety delay not elapsed
 *   -32012  OTP verification failed
 *   -32000  Unknown / internal error
 *
 * ── Human-Readable Mode ──
 *   When --json is NOT set (default for interactive use), commands may
 *   additionally emit human-friendly output via display.ts helpers.
 *   The JSON output is ALWAYS emitted to stdout regardless of mode.
 */

import { sanitizeErrorMessage } from './display';

// ─── Global JSON Mode Flag ────────────────────────────────────────────

let _jsonMode = false;

/** Enable JSON-only mode (suppresses human-readable output). */
export function setJsonMode(enabled: boolean): void {
  _jsonMode = enabled;
}

/** Check if JSON-only mode is active. */
export function isJsonMode(): boolean {
  return _jsonMode;
}

// ─── Error Codes ──────────────────────────────────────────────────────

export const ErrorCode = {
  INVALID_PARAMS: -32602,
  INSUFFICIENT_BALANCE: -32001,
  ACCOUNT_NOT_READY: -32002,
  SPONSOR_FAILED: -32003,
  BUILD_FAILED: -32004,
  SEND_FAILED: -32005,
  EXECUTION_REVERTED: -32006,
  HOOK_AUTH_FAILED: -32007,
  EMAIL_NOT_BOUND: -32010,
  SAFETY_DELAY: -32011,
  OTP_VERIFY_FAILED: -32012,
  INTERNAL: -32000,
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

// ─── Structured Error Class ───────────────────────────────────────────

/**
 * Structured CLI error with JSON-RPC error code.
 * Throw this from any command; the top-level handler will format it.
 */
export class CliError extends Error {
  code: ErrorCodeValue;
  data?: Record<string, unknown>;

  constructor(code: ErrorCodeValue, message: string, data?: Record<string, unknown>) {
    super(message);
    this.name = 'CliError';
    this.code = code;
    this.data = data;
  }
}

// ─── Output Helpers ───────────────────────────────────────────────────

/**
 * Emit a structured success response to stdout.
 *
 * @param result  The result payload (will be JSON-serialized)
 */
export function outputSuccess(result: Record<string, unknown>): void {
  console.log(JSON.stringify({ success: true, result }, null, 2));
}

/**
 * Emit a structured error response to stderr.
 * Sets process.exitCode = 1.
 *
 * @param code     JSON-RPC error code
 * @param message  Human-readable error description
 * @param data     Optional structured context
 */
export function outputError(code: ErrorCodeValue, message: string, data?: Record<string, unknown>): void {
  const output: Record<string, unknown> = {
    success: false,
    error: {
      code,
      message: sanitizeErrorMessage(message),
      ...(data && Object.keys(data).length > 0 ? { data } : {}),
    },
  };
  console.error(JSON.stringify(output, null, 2));
  process.exitCode = 1;
}

/**
 * Handle any thrown error and emit structured JSON error.
 * Use as the catch-all in command action handlers.
 */
export function handleError(err: unknown): void {
  if (err instanceof CliError) {
    outputError(err.code, err.message, err.data);
  } else {
    outputError(ErrorCode.INTERNAL, sanitizeErrorMessage((err as Error).message ?? String(err)));
  }
}
