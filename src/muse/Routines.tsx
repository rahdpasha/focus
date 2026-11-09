import { useState, type FormEvent } from "react";
import type { Workspace } from "./domain";
import { respondToRoutine, todayRoutines, type Routine } from "./routines";
import { useI18n } from "../useI18n";

type Props = {
  data: Workspace;
  busy: boolean;
  now: Date;
  save: (state: Workspace) => Promise<boolean>;
  onStarted: (id: string) => void;
  manage?: boolean;
};
export default function Routines({
  data,
  busy,
  now,
  save,
  onStarted,
  manage = false,
}: Props) {
  const { tr: t } = useI18n();
  const [editing, setEditing] = useState<Routine | "new" | null>(null);
  const [error, setError] = useState("");
  const days = [
    t("Sun", "یەکشەممە"),
    t("Mon", "دووشەممە"),
    t("Tue", "سێشەممە"),
    t("Wed", "چوارشەممە"),
    t("Thu", "پێنجشەممە"),
    t("Fri", "هەینی"),
    t("Sat", "شەممە"),
  ];
  const planned = todayRoutines(data, now);
  async function act(id: string, action: "start" | "skip" | "snooze") {
    setError("");
    try {
      const next = respondToRoutine(data, id, action, new Date());
      if ((await save(next)) && action === "start")
        onStarted(next.outings[0].id);
    } catch {
      setError(
        t(
          "Finish or skip your current outing first, and check that this routine has a checklist.",
          "سەرەتا دەرچوونە ئێستاکەت تەواو بکە یان تێپەڕێنە و لیستی ڕۆتینەکە بپشکنە.",
        ),
      );
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const selectedDays = f.getAll("days").map(Number);
    if (!selectedDays.length) {
      setError(t("Choose at least one day.", "لانیکەم یەک ڕۆژ هەڵبژێرە."));
      return;
    }
    const old = editing && editing !== "new" ? editing : null;
    const routine: Routine = {
      id: old?.id ?? crypto.randomUUID(),
      name: String(f.get("name")).trim(),
      templateId: String(f.get("template")),
      days: selectedDays,
      departureTime: String(f.get("departure")),
      returnTime: String(f.get("return")),
      enabled: old?.enabled ?? true,
    };
    if (
      await save({
        ...data,
        routines: old
          ? data.routines.map((r) => (r.id === old.id ? routine : r))
          : [...data.routines, routine],
      })
    ) {
      setEditing(null);
      setError("");
    }
  }
  const draft = editing && editing !== "new" ? editing : null;
  if (!manage && !planned.length) return null;
  return (
    <section
      className="routine-panel"
      aria-label={t("Recurring outings", "دەرچوونی دووبارەبووەوە")}
    >
      <div className="section-heading">
        <h2>
          {manage
            ? t("Your routines", "ڕۆتینەکانت")
            : t("Today’s routines", "ڕۆتینەکانی ئەمڕۆ")}
        </h2>
        {manage && (
          <button
            className="secondary"
            disabled={
              busy || data.routines.length >= 30 || !data.templates.length
            }
            onClick={() => {
              setEditing("new");
              setError("");
            }}
          >
            {t("Add routine", "زیادکردنی ڕۆتین")}
          </button>
        )}
      </div>
      <p className="muted">
        {t(
          "Kurdistan time · Reminders appear while Muse is open. No alerts when closed yet.",
          "کاتی کوردستان · بیرخستنەوەکان کاتێک میوز کراوەیە دەردەکەون. کاتێک داخراوە هێشتا کار ناکەن.",
        )}
      </p>
      {error && <p role="alert">{error}</p>}
      {manage ? (
        <>
          {!data.routines.length && (
            <p>
              {t(
                "Make a checklist part of your week. Only add the routines you need.",
                "لیستێک بکە بە بەشێک لە هەفتەکەت. تەنها ڕۆتینی پێویست زیاد بکە.",
              )}
            </p>
          )}
          {data.routines.map((r) => (
            <div className="routine-row" key={r.id}>
              <div>
                <strong>{r.name}</strong>
                <p>
                  {r.days.map((d) => days[d]).join(" · ")} · {r.departureTime} →{" "}
                  {r.returnTime}
                  {r.returnTime <= r.departureTime
                    ? t(" (next day)", " (ڕۆژی دواتر)")
                    : ""}
                </p>
              </div>
              <div className="routine-actions">
                <button
                  disabled={busy}
                  onClick={() => {
                    setEditing(r);
                    setError("");
                  }}
                >
                  {t("Edit", "دەستکاری")}
                </button>
                <button
                  disabled={busy}
                  aria-pressed={!r.enabled}
                  onClick={() =>
                    save({
                      ...data,
                      routines: data.routines.map((v) =>
                        v.id === r.id ? { ...v, enabled: !v.enabled } : v,
                      ),
                    })
                  }
                >
                  {r.enabled
                    ? t("Pause", "ڕاگرتن")
                    : t("Resume", "بەردەوامبوون")}
                </button>
              </div>
            </div>
          ))}
          {editing && (
            <form
              className="routine-form"
              key={draft?.id ?? "new"}
              onSubmit={submit}
            >
              <label>
                {t("Routine name", "ناوی ڕۆتین")}
                <input
                  name="name"
                  required
                  maxLength={100}
                  defaultValue={draft?.name ?? ""}
                />
              </label>
              <label>
                {t("Checklist", "لیست")}
                <select
                  name="template"
                  defaultValue={draft?.templateId ?? data.templates[0]?.id}
                >
                  {data.templates.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </label>
              <fieldset>
                <legend>{t("Repeat on", "دووبارەکردنەوە لە")}</legend>
                <div className="routine-days">
                  {days.map((day, index) => (
                    <label key={index}>
                      <input
                        type="checkbox"
                        name="days"
                        value={index}
                        defaultChecked={(
                          draft?.days ?? [0, 1, 2, 3, 4]
                        ).includes(index)}
                      />
                      {day}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label>
                {t("Departure time", "کاتی دەرچوون")}
                <input
                  type="time"
                  name="departure"
                  required
                  defaultValue={draft?.departureTime ?? "08:00"}
                />
              </label>
              <label>
                {t("Return check time", "کاتی پشکنینی گەڕانەوە")}
                <input
                  type="time"
                  name="return"
                  required
                  defaultValue={draft?.returnTime ?? "15:00"}
                />
              </label>
              <p className="muted">
                {t(
                  "A return time at or before departure means the next day. Changes apply to future checklists; existing outings keep their saved time.",
                  "ئەگەر کاتی گەڕانەوە پێش یان یەکسان بە دەرچوون بێت، بۆ ڕۆژی دواترە. گۆڕانکاری دەرچوونە پاشەکەوتکراوەکان ناگۆڕێت.",
                )}
              </p>
              <div className="routine-actions">
                <button className="primary" disabled={busy}>
                  {t("Save routine", "پاشەکەوتکردنی ڕۆتین")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setError("");
                  }}
                >
                  {t("Cancel", "هەڵوەشاندنەوە")}
                </button>
              </div>
            </form>
          )}
        </>
      ) : (
        planned.map(({ routine, key, due }) => (
          <div className="routine-row" key={key}>
            <div>
              <strong>{routine.name}</strong>
              <p>
                {routine.departureTime} ·{" "}
                {due
                  ? t("Ready when you are", "کاتێک تۆ ئامادەیت")
                  : t("Later today", "دواتر لە ئەمڕۆ")}
              </p>
            </div>
            <div className="routine-actions">
              <button
                className="primary"
                disabled={busy}
                onClick={() => act(routine.id, "start")}
              >
                {t("Open checklist", "کردنەوەی لیست")}
              </button>
              {due && (
                <button
                  disabled={busy}
                  onClick={() => act(routine.id, "snooze")}
                >
                  {t("Snooze 15 min", "دواخستن ١٥ خولەک")}
                </button>
              )}
              <button disabled={busy} onClick={() => act(routine.id, "skip")}>
                {t("Skip today", "تێپەڕاندنی ئەمڕۆ")}
              </button>
            </div>
          </div>
        ))
      )}
    </section>
  );
}
