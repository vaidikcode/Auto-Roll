/** Strip undefined / non-JSON values so provider + gateway accept tool results. */
export function jsonSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
