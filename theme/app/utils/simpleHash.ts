export function simpleHash(url: string): string {
  let hash = 5381;
  for (let i = 0; i < url.length; i++) {
    hash = (hash * 33) ^ url.charCodeAt(i);
  }
  // Convert to unsigned and then base-36 (0-9a-z)
  return (hash >>> 0).toString(36);
}
