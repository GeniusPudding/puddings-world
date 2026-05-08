/**
 * Performer-only endpoints check Authorization: Bearer <KTV_PERFORMER_KEY>.
 * The performer's iOS / Android app stores this secret locally; web UI
 * never has it (audience pages are anonymous).
 */
export function isAuthorized(req: Request): boolean {
  const expected = process.env.KTV_PERFORMER_KEY;
  if (!expected) return false;
  const header = req.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return false;
  // Constant-time compare to defend against timing attacks
  if (token.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
