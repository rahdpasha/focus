// Remote Web Push sender for installed Home Screen FOCUS apps.
// Called by the database cron only when at least one due notification exists.
// No user data or VAPID private key is embedded in this source file.
import { createClient } from 'npm:@supabase/supabase-js@2.116.0'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

type Delivery = {
  job_id: string
  outbox_id: string
  endpoint: string
  signing_jwk: string
  public_key: string
}

function encodeBase64Url(input: Uint8Array): string {
  let binary = ''
  for (const char of input) binary += String.fromCharCode(char)
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function b64Json(data: Record<string, unknown>): string {
  return encodeBase64Url(new TextEncoder().encode(JSON.stringify(data)))
}

function isTrustedPushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint)
    const hostname = url.hostname.toLowerCase()
    return url.protocol === 'https:' &&
      !url.username && !url.password &&
      (
        hostname === 'web.push.apple.com' ||
        hostname.endsWith('.push.apple.com') ||
        hostname === 'fcm.googleapis.com' ||
        hostname === 'updates.push.services.mozilla.com' ||
        hostname.endsWith('.notify.windows.com')
      )
  } catch {
    return false
  }
}

async function sendWebPush(delivery: Delivery): Promise<{ ok: boolean; permanent: boolean }> {
  if (!isTrustedPushEndpoint(delivery.endpoint)) return { ok: false, permanent: true }

  const jsonWebKey = JSON.parse(delivery.signing_jwk) as JsonWebKey
  const signingKey = await crypto.subtle.importKey(
    'jwk',
    jsonWebKey,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  )
  const pushOrigin = new URL(delivery.endpoint).origin
  const now = Math.floor(Date.now() / 1000)
  const header = b64Json({ typ: 'JWT', alg: 'ES256' })
  const payload = b64Json({
    aud: pushOrigin,
    exp: now + 3600,
    sub: 'https://focus-one-zeta.vercel.app',
  })
  const unsigned = header + '.' + payload
  const signature = new Uint8Array(await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    signingKey,
    new TextEncoder().encode(unsigned),
  ))
  const vapidToken = unsigned + '.' + encodeBase64Url(signature)

  // An empty Web Push payload needs no content encryption. The service worker
  // generates a user-visible, generic completion notification on receipt.
  const response = await fetch(delivery.endpoint, {
    method: 'POST',
    headers: {
      Authorization: 'vapid t=' + vapidToken + ', k=' + delivery.public_key,
      TTL: '3600',
      Urgency: 'high',
    },
  })
  return {
    ok: response.status === 201 || response.status === 202 || response.ok,
    permanent: response.status === 404 || response.status === 410 || response.status === 400,
  }
}

Deno.serve(async (request: Request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const bearer = request.headers.get('authorization') ?? ''
  const token = bearer.startsWith('Bearer ') ? bearer.slice(7) : ''
  if (token.length < 40) return new Response('Unauthorized', { status: 401 })

  const { data, error } = await supabase.rpc('focus_claim_push_jobs', { p_token: token })
  if (error) {
    console.error('Focus push claim failed:', error.code)
    return new Response('Unauthorized or unavailable', { status: 401 })
  }

  let delivered = 0
  for (const job of (data ?? []) as Delivery[]) {
    let ok = false
    let permanent = false
    try {
      const result = await sendWebPush(job)
      ok = result.ok
      permanent = result.permanent
    } catch (error) {
      console.error('Focus push failed:', error instanceof Error ? error.name : 'unknown')
    }
    const { error: ackError } = await supabase.rpc('focus_ack_push_job', {
      p_token: token,
      p_outbox_id: job.outbox_id,
      p_delivered: ok,
      p_permanent_failure: permanent,
    })
    if (ackError) console.error('Focus push ack failed:', ackError.code)
    if (ok) delivered++
  }

  return Response.json({ processed: (data ?? []).length, delivered })
})
