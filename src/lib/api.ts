import { getToken, clearToken } from "./auth-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface ApiSuccess<T> {
  ok: true;
  data: T;
}
interface ApiError {
  ok: false;
  error: { code: string; message: string };
}
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/**
 * Thin wrapper around fetch for talking to the Express API. Automatically
 * attaches the saved JWT (if there is one) as a Bearer token, and always
 * resolves to the same { ok, data } / { ok, error } shape our backend
 * uses - so callers can just check `if (!result.ok)`.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = getToken();

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    const body = (await res.json()) as ApiResponse<T>;

    /**
     * Handle an expired or invalid token in one place, rather than in
     * every page. Tokens last 7 days, and useRequireAuth only checks
     * that a token *exists*, not that it's still valid - so without
     * this, an expired token leaves the app in a broken half-logged-in
     * state where the guard passes but every request fails.
     *
     * Matched on error code, not just the 401 status: the login
     * endpoint also returns 401 (for a wrong password), and redirecting
     * on that would stop the login page from ever showing "incorrect
     * email or password". Only requireAuth emits UNAUTHORIZED and
     * INVALID_TOKEN.
     *
     * window.location rather than the router: a full reload clears all
     * in-memory state, which is what we want when a session ends.
     */
    if (res.status === 401 && !body.ok && typeof window !== "undefined") {
      const code = body.error.code;
      if (code === "UNAUTHORIZED" || code === "INVALID_TOKEN") {
        clearToken();
        window.location.href = "/login";
      }
    }

    return body;
  } catch (err) {
    return {
      ok: false,
      error: {
        code: "NETWORK_ERROR",
        message: err instanceof Error ? err.message : "Could not reach the server",
      },
    };
  }
}

/**
 * Uploads files as multipart/form-data.
 *
 * Separate from apiFetch because that sets Content-Type to
 * application/json. For FormData the browser must set the header
 * itself - it has to include a generated boundary marker, and setting
 * it by hand breaks the request.
 */
export async function apiUpload<T>(path: string, formData: FormData): Promise<ApiResponse<T>> {
  const token = getToken();

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    return (await res.json()) as ApiResponse<T>;
  } catch (err) {
    return {
      ok: false,
      error: {
        code: "NETWORK_ERROR",
        message: err instanceof Error ? err.message : "Could not reach the server",
      },
    };
  }
}
export type StreamEvent =
  | {
      type: "start";
      userMessageId?: string;
    }
  | {
      type: "token";
      content?: string;
    }
  | {
      type: "reasoning";
      content?: string;
    }
  | {
      type: "tool_start";
      tool?: string;
      name?: string;
      input?: unknown;
      data?: { input?: unknown };
    }
  | {
      type: "tool_end";
      tool?: string;
      name?: string;
      output?: string | unknown;
      data?: { output?: string | unknown };
    }
  | {
      type: "final";
      ai_response?: string;
      content?: string;
      state?: string;
    }
  | {
      type: "done";
      content?: string;
      ok?: boolean;
      assistantMessageId?: string;
    }
  | {
      type: "error";
      message?: string;
      content?: string;
    };

/**
 * Reads a streaming response, calling onEvent for each event as it
 * arrives.
 *
 * Separate from apiFetch because that calls .json(), which waits for
 * the whole body - exactly what we're trying to avoid here.
 *
 * Returns an error string if the request itself failed. Once the stream
 * has started, failures arrive as events instead, since the status code
 * has already been sent and can't be changed.
 */
export async function apiStream(
  path: string,
  body: unknown,
  onEvent: (event: StreamEvent) => void,
): Promise<string | null> {
  const token = getToken();

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    // A non-2xx here means it failed before streaming began, so the
    // body is still ordinary JSON.
    if (!res.ok) {
      const failed = (await res.json()) as ApiResponse<unknown>;

      if (res.status === 401 && !failed.ok && typeof window !== "undefined") {
        const code = failed.error.code;
        if (code === "UNAUTHORIZED" || code === "INVALID_TOKEN") {
          clearToken();
          window.location.href = "/login";
        }
      }

      return failed.ok ? "Something went wrong" : failed.error.message;
    }

    if (!res.body) return "The server sent no response";

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      // The last piece may be half a line - hold it back until the rest
      // arrives.
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload) continue;
        try {
          const event = JSON.parse(payload) as StreamEvent;
          onEvent(event);
          if (event.type === "token" || event.type === "reasoning") {
            await new Promise((r) => setTimeout(r, 15));
          }
        } catch {
          // Ignore a malformed event rather than dropping the answer.
        }
      }
    }

    return null;
  } catch (err) {
    return err instanceof Error ? err.message : "Could not reach the server";
  }
}