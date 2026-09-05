import { getClassworkConfig } from "@/lib/classwork/config";

/**
 * Which Canvas a person connects to.
 *
 * One school for now, named by CANVAS_INSTANCE_URL, because a developer key is
 * issued by one school's admin and is good for that school only. The host is
 * still a column on the connection and a parameter on every adapter call, so
 * a table of instances (each with its own key) can replace this function
 * without touching the adapter or the schema.
 */
export function resolveCanvasInstance(): string | null {
  const url = getClassworkConfig().CANVAS_INSTANCE_URL;
  return url ? url.replace(/\/$/, "") : null;
}
