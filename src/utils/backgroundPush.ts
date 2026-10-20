import { supabase } from '../api/supabaseClient'

// This public signing key identifies the server. The private key is kept in
// Supabase Vault and never reaches a browser.
const VAPID_PUBLIC_KEY = 'BPDIOUyrqErY3Bz4RaqGyAVOh2ihZdj7kLeKw1I5da08KIBZpS3cUK6Nr2aCUjqYSyt2qy2pZRWSZZBfkgUivP4'

let readyRegistration: ServiceWorkerRegistration | null = null
let existingSubscription: PushSubscription | null = null

export function supportsBackgroundPush(): boolean {
  return Boolean(
    supabase &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window,
  )
}

function decodeVapidKey(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let index = 0; index < raw.length; index++) {
    bytes[index] = raw.charCodeAt(index)
  }
  return bytes
}

// Prepare BEFORE the user taps. On iOS, subscribe() must be called directly
// from the tap event, without awaiting a network request or SW registration.
export async function prepareFocusBackgroundPush(): Promise<boolean> {
  if (!supportsBackgroundPush()) return false
  try {
    readyRegistration = await navigator.serviceWorker.ready
    existingSubscription = await readyRegistration.pushManager.getSubscription()
    return true
  } catch {
    return false
  }
}

export async function enableFocusBackgroundPush(userId: string): Promise<void> {
  if (!supportsBackgroundPush() || !supabase) {
    throw new Error('Install FOCUS on your Home Screen to enable background alerts.')
  }
  if (Notification.permission === 'denied') {
    throw new Error('Notifications are blocked. Allow FOCUS notifications in iPhone Settings.')
  }
  if (!readyRegistration) {
    throw new Error('Preparing notifications. Open the Focus page again and retry.')
  }

  // This subscribe() call must occur synchronously inside the user's click
  // handler. If permission is unset, the browser shows the permission prompt.
  const promise = existingSubscription
    ? Promise.resolve(existingSubscription)
    : readyRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeVapidKey(VAPID_PUBLIC_KEY),
      })
  const subscription = await promise

  const { error } = await supabase.from('focus_push_subscriptions').upsert({
    user_id: userId,
    endpoint: subscription.endpoint,
  }, { onConflict: 'endpoint' })
  if (error) throw new Error('Could not save your device for background alerts.')
  existingSubscription = subscription
}

/** Turn off server push for this device. iOS notification permission remains unchanged. */
export async function disableFocusBackgroundPush(userId: string): Promise<void> {
  if (!supabase) throw new Error('FOCUS is not connected.')

  const registration = readyRegistration ??
    ('serviceWorker' in navigator ? await navigator.serviceWorker.ready : null)
  const subscription = existingSubscription ??
    (registration ? await registration.pushManager.getSubscription() : null)

  if (!subscription) {
    existingSubscription = null
    return
  }

  // First remove the endpoint from the delivery database so that an
  // unsubscribe failure cannot leave active server push notifications.
  const { error } = await supabase
    .from('focus_push_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('endpoint', subscription.endpoint)
  if (error) throw new Error('Could not disable background notifications. Try again.')

  await subscription.unsubscribe()
  existingSubscription = null
}

export function hasFocusBackgroundPush(): boolean {
  return Boolean(
    existingSubscription &&
    'Notification' in window &&
    Notification.permission === 'granted',
  )
}
