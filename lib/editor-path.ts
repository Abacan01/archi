export function parseEditorPath(path: string) {
  const segments: Array<string | number> = [];

  path.replace(/([^[.\]]+)|\[(\d+)\]/g, (_, key, index) => {
    segments.push(index !== undefined ? Number(index) : key);
    return "";
  });

  return segments;
}

export function getNestedValue(source: unknown, path: string) {
  const segments = parseEditorPath(path);
  let current: any = source;

  for (const segment of segments) {
    if (current == null) {
      return undefined;
    }
    current = current[segment as any];
  }

  return current;
}

export function setNestedValue<T>(source: T, path: string, nextValue: unknown): T {
  const segments = parseEditorPath(path);
  if (segments.length === 0 || source == null || typeof source !== "object") {
    return source;
  }

  const root = Array.isArray(source) ? [...source] : { ...(source as Record<string, unknown>) };
  let current: any = root;
  let sourceCurrent: any = source;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    const nextSegment = segments[index + 1];
    const existing = sourceCurrent?.[segment as any];

    const clone = Array.isArray(existing)
      ? [...existing]
      : existing && typeof existing === "object"
        ? { ...existing }
        : typeof nextSegment === "number"
          ? []
          : {};

    current[segment as any] = clone;
    current = clone;
    sourceCurrent = existing;
  }

  const lastSegment = segments[segments.length - 1];
  current[lastSegment as any] = nextValue;
  return root as T;
}