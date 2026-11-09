// Encrypted payloads use the existing VAPID identity; never log subscriptions or keys.
import webpush from 'npm:web-push@3.6.7'
export type MuseDelivery = {
 outbox_id: string; lease_id: string; endpoint: string; p256dh: string; auth_key: string;
 signing_jwk: string; public_key: string; kind: 'departure' | 'return' | 'task' | 'test';
 target_id: string; tag: string; expires_at: string;
}
export function trustedEndpoint(endpoint: string): boolean {
 try {
  const u = new URL(endpoint)
  return u.protocol === 'https:' && !u.username && !u.password && (!u.port || u.port === '443') &&
   (u.hostname === 'web.push.apple.com' || u.hostname.endsWith('.push.apple.com') || u.hostname === 'fcm.googleapis.com' || u.hostname === 'updates.push.services.mozilla.com' || u.hostname.endsWith('.notify.windows.com'))
 } catch { return false }
}
export async function sendMusePush(job: MuseDelivery): Promise<{ accepted: boolean; permanent: boolean }> {
 if (!trustedEndpoint(job.endpoint)) return { accepted: false, permanent: true }
 const ttl = Math.min(60, Math.floor((Date.parse(job.expires_at) - Date.now()) / 1000))
 if (ttl <= 0) return { accepted: false, permanent: false }
 const key = JSON.parse(job.signing_jwk)
 const details = webpush.generateRequestDetails({ endpoint: job.endpoint, keys: { p256dh: job.p256dh, auth: job.auth_key } }, JSON.stringify({
  type: 'muse', kind: job.kind, target: job.target_id, tag: job.tag, expiresAt: job.expires_at,
 }), { TTL: ttl, urgency: 'normal', contentEncoding: 'aes128gcm', vapidDetails: {
  subject: 'https://focus-one-zeta.vercel.app', publicKey: job.public_key, privateKey: key.d,
 } })
 const response = await fetch(job.endpoint, { method: 'POST', headers: details.headers, body: new Uint8Array(details.body), redirect: 'error', signal: AbortSignal.timeout(8000) })
 return { accepted: response.ok, permanent: response.status === 404 || response.status === 410 }
}
