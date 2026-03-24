/**
 * Audit context management for request-scoped metadata.
 * Set before a request and cleared after.
 *
 * Usage in a route handler:
 *   setAuditContext({ userId: session.user.id, ipAddress: req.headers.get("x-forwarded-for") ?? undefined })
 *   try {
 *     // do work
 *   } finally {
 *     clearAuditContext()
 *   }
 */
interface AuditContext {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

const ctx: AuditContext = {};

export function setAuditContext(c: AuditContext) {
  if (c.userId !== undefined) ctx.userId = c.userId;
  if (c.ipAddress !== undefined) ctx.ipAddress = c.ipAddress;
  if (c.userAgent !== undefined) ctx.userAgent = c.userAgent;
}

export function clearAuditContext() {
  ctx.userId = undefined;
  ctx.ipAddress = undefined;
  ctx.userAgent = undefined;
}

export function getAuditContext(): AuditContext {
  return { ...ctx };
}
