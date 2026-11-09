/* Shared with service-worker tests. No personal titles or checklist contents on lock screen. */
(function (root) {
  root.museNotification = function (payload, now) {
    if (!payload || payload.type !== 'muse') return null;
    const kind = ['departure', 'return', 'task', 'test'].includes(payload.kind) ? payload.kind : 'task';
    const target = typeof payload.target === 'string' ? payload.target.slice(0, 100) : '';
    const messages = {
      departure: 'Before you go: open your belongings checklist.',
      return: 'Time to check the belongings you took.',
      task: 'You have a reminder to review.',
      test: 'Your Muse test reached this device.',
    };
    const expired = !Number.isFinite(Date.parse(payload.expiresAt)) || Date.parse(payload.expiresAt) <= now;
    return {
      title: 'Muse',
      options: {
        body: expired ? 'Open Muse to review your current reminders.' : messages[kind],
        icon: '/icon-192.png', badge: '/icon-192.png',
        tag: typeof payload.tag === 'string' && /^muse-[a-zA-Z0-9-]{1,64}$/.test(payload.tag) ? payload.tag : 'muse-reminder',
        renotify: false, silent: expired,
        data: { url: '/#muse?' + new URLSearchParams({ kind, target }).toString() },
      },
    };
  };
})(globalThis);
