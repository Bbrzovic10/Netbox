/**
 * Kleiner fetch-Wrapper: parst JSON und wirft bei Fehlern eine Error mit der
 * serverseitigen Meldung (fuer Toasts).
 */
export async function api<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const isJson = res.headers
    .get("content-type")
    ?.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message =
      (body && (body.error as string)) || `Fehler ${res.status}`;
    throw new Error(message);
  }
  return body as T;
}
