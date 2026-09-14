import "server-only";

/**
 * The two mixers, described the same way so the caller does not care which
 * one answered.
 *
 * Only the wire format lives here: the URL, the headers, the body shape and
 * how to find the reply. Retries, budget and failover are in server.ts and are
 * the same whichever provider is running, because they are policy rather than
 * protocol.
 *
 * Env names carry no vendor, matching the rest of the app. The primary is
 * MODEL_API_KEY with FAST_MODEL and REASONING_MODEL; the standby is
 * FALLBACK_MODEL_API_KEY with FALLBACK_FAST_MODEL. A model identifier belongs
 * to the provider and changes on their schedule, so it stays deployment config.
 */

export type MixPart =
  | { type: "text"; text: string }
  | { type: "image"; data: string; mime_type: string };

export type MixProvider = {
  /** Shown in logs and stored beside a generated set, so a run is traceable. */
  readonly label: string;
  readonly model: string;
  send(input: {
    instruction: string;
    parts: MixPart[];
    schema: unknown;
    signal: AbortSignal;
  }): Promise<Response>;
  /** The JSON text out of a successful reply, or null when there is none. */
  read(payload: Record<string, unknown> | null): string | null;
};

/** The message out of either provider's error envelope. */
export function errorDetail(payload: Record<string, unknown> | null): string | null {
  if (!payload || typeof payload.error !== "object" || !payload.error) return null;
  const message = (payload.error as Record<string, unknown>).message;
  return message ? String(message) : null;
}

/** Google's interactions endpoint, which has been the primary throughout. */
export function primaryProvider(model: string): MixProvider | null {
  const apiKey = process.env.MODEL_API_KEY;
  if (!apiKey || !model) return null;

  return {
    label: model,
    model,
    send: ({ instruction, parts, schema, signal }) =>
      fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
          "Api-Revision": "2026-05-20",
        },
        body: JSON.stringify({
          model,
          store: false,
          system_instruction: instruction,
          input: parts,
          response_format: { type: "text", mime_type: "application/json", schema },
        }),
        signal,
      }),
    read: (payload) => {
      const steps = Array.isArray(payload?.steps) ? payload.steps : [];
      for (let index = steps.length - 1; index >= 0; index -= 1) {
        const step = steps[index] as Record<string, unknown>;
        if (step.type !== "model_output" || !Array.isArray(step.content)) continue;
        for (const part of step.content as Array<Record<string, unknown>>) {
          if (part.type === "text" && typeof part.text === "string") return part.text;
        }
      }
      return null;
    },
  };
}

/**
 * The standby, on OpenAI's chat completions endpoint.
 *
 * It asks for JSON mode rather than a strict schema, and carries the schema in
 * the instruction instead. Strict schema mode constrains what a schema may
 * look like and is not offered by every model, so binding the standby to it
 * would mean the rescue path failing on exactly the day it is needed. The
 * shapes this app asks for are already re-checked in lib/mix/contracts.ts
 * whichever provider answered, so a schema that guides rather than binds loses
 * nothing. JSON mode also requires the word JSON in the prompt, which the
 * appended schema block satisfies.
 */
export function fallbackProvider(): MixProvider | null {
  const apiKey = process.env.FALLBACK_MODEL_API_KEY;
  const model = process.env.FALLBACK_FAST_MODEL ?? "";
  if (!apiKey || !model) return null;

  return {
    label: model,
    model,
    send: ({ instruction, parts, schema, signal }) =>
      fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: `${instruction}\n\nReply with JSON alone, matching this schema:\n${JSON.stringify(schema)}`,
            },
            {
              role: "user",
              content: parts.map((part) =>
                part.type === "text"
                  ? { type: "text", text: part.text }
                  : {
                      type: "image_url",
                      image_url: { url: `data:${part.mime_type};base64,${part.data}` },
                    },
              ),
            },
          ],
          response_format: { type: "json_object" },
        }),
        signal,
      }),
    read: (payload) => {
      const choices = Array.isArray(payload?.choices) ? payload.choices : [];
      const first = choices[0] as Record<string, unknown> | undefined;
      const message = first?.message as Record<string, unknown> | undefined;
      return typeof message?.content === "string" ? message.content : null;
    },
  };
}

/** True when a standby is configured and failover can actually happen. */
export function fallbackConfigured(): boolean {
  return fallbackProvider() !== null;
}
