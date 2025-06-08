export function isUrl(value: string) {
  try {
    new URL(value);
  } catch {
    return false;
  }
  return true;
}
