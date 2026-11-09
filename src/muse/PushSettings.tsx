import { useEffect, useState } from "react";
import { supabase } from "../api/supabaseClient";
import {
  prepareFocusBackgroundPush,
  enableMuseBackgroundPush,
  disableMuseBackgroundPush,
  musePushDeviceState,
  testMuseBackgroundPush,
} from "../utils/backgroundPush";
import { useI18n } from "../useI18n";
export default function PushSettings({ userId }: { userId: string | null }) {
  const { tr: t } = useI18n();
  const [ready, setReady] = useState(false),
    [enabled, setEnabled] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    let live = true;
    async function prepare() {
      if (!userId || !supabase) return;
      try {
        const supported = await prepareFocusBackgroundPush();
        const { data, error } = await supabase.rpc("muse_push_ready");
        const device = await musePushDeviceState(userId);
        if (live) {
          setReady(supported && !error && data === true);
          setEnabled(device.enabled);
        }
      } catch {
        if (live)
          setMessage(
            t(
              "Alerts are unavailable on this device right now.",
              "ئاگادارکردنەوە لەم ئامێرە ئێستا بەردەست نییە.",
            ),
          );
      }
    }
    void prepare();
    return () => {
      live = false;
    };
  }, [userId, t]);
  async function toggle() {
    if (!userId) return;
    setBusy(true);
    try {
      if (enabled) await disableMuseBackgroundPush(userId);
      else await enableMuseBackgroundPush(userId);
      setEnabled(!enabled);
      setMessage(
        enabled
          ? t(
              "Muse alerts are off on this device.",
              "ئاگادارکردنەوەی Muse داخرا.",
            )
          : t(
              "Enabled. Send a test, then close the app to check this device.",
              "چالاک کرا. تاقیکردنەوە بنێرە و ئەپەکە دابخە.",
            ),
      );
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : t("Please try again.", "دووبارە هەوڵ بدەرەوە."),
      );
    } finally {
      setBusy(false);
    }
  }
  async function test() {
    setBusy(true);
    try {
      await testMuseBackgroundPush();
      setMessage(
        t(
          "Test queued for about one minute from now. Close FOCUS and check your notifications. Queued does not mean received.",
          "تاقیکردنەوە بۆ نزیکەی یەک خولەکی داهاتوو دانرا. FOCUS دابخە و ئاگادارکردنەوەکانت بپشکنە.",
        ),
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not schedule test.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="settings-section">
      <h3>{t("Muse background alerts", "ئاگادارکردنەوەی پاشبنەمای Muse")}</h3>
      <p>
        {t(
          "Optional, on this device. On iPhone, open FOCUS from your Home Screen first.",
          "ئارەزوومەندانە بۆ ئەم ئامێرە. لە ئایفۆن FOCUS لە شاشەی سەرەکی بکەرەوە.",
        )}
      </p>
      <p className="small-muted">
        {t(
          "Up to four reminders a day. Quiet hours: 22:00–07:00, Kurdistan time. Old reminders expire after 30 minutes. Sound and delivery depend on your device settings and connection.",
          "تا چوار بیرخستنەوە لە ڕۆژێکدا. کاتی بێدەنگی: ٢٢:٠٠–٠٧:٠٠ بە کاتی کوردستان. بیرخستنەوە کۆنەکان دوای ٣٠ خولەک بەسەردەچن.",
        )}
      </p>
      {!ready && (
        <p>
          {t(
            "Not ready here yet. Sign in and use a supported, updated app. In-app checklists still work.",
            "هێشتا ئامادە نییە. بچۆ ژوورەوە و ئەپە نوێکراوەکە بەکاربهێنە. لیستی ناو ئەپ کار دەکات.",
          )}
        </p>
      )}
      <div className="routine-actions">
        <button
          className="outline"
          disabled={busy || (!ready && !enabled)}
          onClick={toggle}
        >
          {enabled
            ? t("Turn off Muse alerts", "داخستنی ئاگادارکردنەوەی Muse")
            : t("Enable Muse alerts", "چالاککردنی ئاگادارکردنەوەی Muse")}
        </button>
        {enabled && (
          <button className="outline" disabled={busy || !ready} onClick={test}>
            {t("Send background test", "ناردنی تاقیکردنەوەی پاشبنەما")}
          </button>
        )}
      </div>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
