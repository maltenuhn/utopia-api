export function defaultIfNull<T>(
  defaultValue: T,
  value: T | null | undefined
): T {
  if (value == null) {
    return defaultValue;
  } else {
    return value;
  }
}
