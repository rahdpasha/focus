import webpush from 'npm:web-push@3.6.7'
import { sendMusePush, trustedEndpoint, type MuseDelivery } from './muse-push.ts'
function assert(value: unknown, message: string) { if (!value) throw new Error(message) }
Deno.test('endpoint allowlist refuses redirects, credentials, non-TLS and foreign hosts', () => {
 for (const url of ['http://web.push.apple.com/a','https://web.push.apple.com.evil.test/a','https://127.0.0.1/a','https://user:pass@fcm.googleapis.com/a','https://fcm.googleapis.com:444/a']) assert(!trustedEndpoint(url),url)
 assert(trustedEndpoint('https://web.push.apple.com/test'),'Apple push must work')
})
Deno.test('Muse sends an encrypted bounded payload; 410 disables only Muse subscription', async () => {
 const vapid=webpush.generateVAPIDKeys()
 const receiver=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveBits'])
 const publicBytes=new Uint8Array(await crypto.subtle.exportKey('raw',receiver.publicKey))
 const b64=(bytes: Uint8Array)=>btoa(String.fromCharCode(...bytes)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_')
 const job: MuseDelivery={outbox_id:'job',lease_id:'lease',endpoint:'https://web.push.apple.com/test',p256dh:b64(publicBytes),auth_key:b64(crypto.getRandomValues(new Uint8Array(16))),signing_jwk:JSON.stringify({d:vapid.privateKey}),public_key:vapid.publicKey,kind:'return',target_id:'private-target-id',tag:'muse-job',expires_at:new Date(Date.now()+60000).toISOString()}
 const original=globalThis.fetch
 let status=201
 globalThis.fetch=async (_url,init) => {
  const headers=new Headers(init?.headers)
  assert(headers.get('content-encoding')==='aes128gcm','Missing encryption')
  assert(Number(headers.get('ttl'))<=60,'TTL too long')
  assert(init?.redirect==='error','Redirects must not be followed')
  assert(!new TextDecoder().decode(init?.body as Uint8Array).includes('private-target-id'),'Plaintext payload')
  return new Response(null,{status})
 }
 try {
  const ok=await sendMusePush(job);assert(ok.accepted,'201 must be accepted')
  status=410;const gone=await sendMusePush(job);assert(gone.permanent && !gone.accepted,'410 must expire')
  status=429;const retry=await sendMusePush(job);assert(!retry.permanent && !retry.accepted,'429 must retry')
 } finally {globalThis.fetch=original}
})
