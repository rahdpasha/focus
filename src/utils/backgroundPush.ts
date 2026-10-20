import { supabase } from '../api/supabaseClient'

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

/**
 * Must be invoked directly from a user-tapped button.
 * iOS only offers this permission in installed Home Screen PWAs.
 */
export async function enableFocusBackgroundPush(userId: string): Promise<void> {
  if (!supportsBackgroundPush() || !supabase) {
    throw new Error('Install FOCUS on your Home Screen to enable background alerts.')
  }

  // Request permission before the first await loses the user gesture on iOS.
  const permissionRequest = Notification.permission === 'default'
    ? Notification.requestPermission()
    : Promise.resolve(Notification.permission)
  const permission = await permissionRequest
  if (permission !== 'granted') {
    throw new Error('Notifications are blocked. Allow FOCUS notifications in iPhone Settings.')
  }

  const registration = await navigator.serviceWorker.ready
  const { data, error } = await supabase.rpc('focus_vapid_public_key')
  if (error || typeof data !== 'string') {
    throw new Error('Background notifications are not configured yet.')
  }

  const previous = await registration.pushManager.getSubscription()
  const subscription = previous ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: decodeVapidKey(data),
  })

  const { error: saveError } = await supabase
    .from('focus_push_subscriptions')
    .upsert({ user_id: userId, endpoint: subscription.endpoint }, { onConflict: 'endpoint' })

  if (saveError) throw new Error('Could not save your device for background alerts.')
}

export async function hasFocusBackgroundPush(): Promise<boolean> {
  if (!supportsBackgroundPush() || Notification.permission !== 'granted') return false
  try {
    const registration = await navigator.serviceWorker.ready
    return Boolean(await registration.pushManager.getSubscription())
  } catch {
    return false
  }
}
