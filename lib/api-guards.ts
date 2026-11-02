import { createHash, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Server-side request guards shared by the API routes.
 *
 * The write routes are intentionally unauthenticated (see CLAUDE.md "Security
 * context"), so these checks are the only thing standing between arbitrary
 * input and the Admin SDK. Never rely on client-side validation instead.
 */

export const MAX_PLAYER_NAME_LENGTH = 50

// Firestore auto-IDs are 20 alphanumeric chars. Allowing `_`/`-` and up to 128
// chars leaves headroom without letting `/` turn a doc ID into a nested path.
const DOC_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/

// Control, format (bidi overrides, zero-width), surrogate, and unassigned code points.
const DISALLOWED_NAME_CHARS = /\p{C}/u

export function isValidDocId(value: unknown): value is string {
  return typeof value === 'string' && DOC_ID_PATTERN.test(value)
}

/**
 * Normalizes a player name, or returns an error message if it is unacceptable.
 * Accented and non-Latin letters are allowed; invisible/control characters are not.
 */
export function parsePlayerName(
  value: unknown
): { ok: true; name: string } | { ok: false; error: string } {
  if (typeof value !== 'string') {
    return { ok: false, error: 'Player name is required' }
  }

  const name = value.normalize('NFC').replace(/\s+/g, ' ').trim()

  if (name === '') {
    return { ok: false, error: 'Player name is required' }
  }
  if (DISALLOWED_NAME_CHARS.test(name)) {
    return { ok: false, error: 'Player name contains invalid characters' }
  }
  if ([...name].length > MAX_PLAYER_NAME_LENGTH) {
    return {
      ok: false,
      error: `Player name must be at most ${MAX_PLAYER_NAME_LENGTH} characters`,
    }
  }

  return { ok: true, name }
}

/**
 * Parses a JSON object body. Rejects non-JSON content types, which also forces
 * cross-origin browser callers through a CORS preflight that Next.js does not
 * approve — this blocks `<form enctype="text/plain">` CSRF posts.
 */
export async function readJsonBody(
  request: NextRequest
): Promise<{ ok: true; body: Record<string, unknown> } | { ok: false; response: NextResponse }> {
  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().startsWith('application/json')) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 415 }
      ),
    }
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    body = undefined
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }),
    }
  }

  return { ok: true, body: body as Record<string, unknown> }
}

/**
 * Checks `Authorization: Bearer <CRON_SECRET>` in constant time.
 * Fails closed when CRON_SECRET is unset — previously the expected header
 * became the literal string "Bearer undefined", which anyone could send.
 */
export function isAuthorizedCronRequest(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[AUTH] CRON_SECRET is not configured; rejecting request')
    return false
  }

  const provided = request.headers.get('authorization') ?? ''
  // Hash both sides so timingSafeEqual gets equal-length buffers and the
  // comparison time does not leak the secret's length.
  const digest = (s: string) => createHash('sha256').update(s).digest()
  return timingSafeEqual(digest(provided), digest(`Bearer ${secret}`))
}
