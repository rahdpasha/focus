import { useI18n } from "../useI18n";
import type { StudySession } from "../types";
import type { Task, Workspace } from "./domain";
import { weeklyReview } from "./weeklyReview";

export default function WeeklyReview({ now, tasks, sessions, plan, busy, onSave, onOpen }: {
  now: Date;
  tasks: Task[];
  sessions: StudySession[];
  plan: Workspace["profile"]["weeklyPlan"];
  busy: boolean;
  onSave: (plan: NonNullable<Workspace["profile"]["weeklyPlan"]>) => Promise<boolean>;
  onOpen: (task: Task) => void;
}) {
  const { tr: t, language } = useI18n();
  const review = weeklyReview(now, tasks, sessions);
  const format = new Intl.DateTimeFormat(language === "ku" ? "ckb" : "en-GB", {
    day: "numeric", month: "short", timeZone: "Asia/Baghdad",
  });
  const sections = [
    [t("Completed in the review week", "تەواوکراوەکانی هەفتەی پێداچوونەوە"), review.completed],
    [t("Past dates to review", "بەروارە تێپەڕیوەکان بۆ پێداچوونەوە"), review.pastDates],
    [t("Due in the next seven days", "بەروارەکانی حەوت ڕۆژی داهاتوو"), review.upcoming],
  ] as const;

  return (
    <details className="muse-weekly-review">
      <summary>{t("Weekly review", "پێداچوونەوەی هەفتانە")}</summary>
      <p>{format.format(review.start)} – {format.format(review.end)} · {t("Ends Saturday at 7 PM Kurdistan time", "شەممە ٧ی ئێوارە بە کاتی کوردستان تەواو دەبێت")}</p>
      {sections.map(([label, items]) => (
        <section key={label}>
          <h3>{label} · {items.length}</h3>
          {items.length > 0 && <ul>{items.slice(0, 3).map(item => (
            <li key={item.id}><button type="button" className="text-button" onClick={() => onOpen(item)}>{item.title}</button></li>
          ))}</ul>}
        </section>
      ))}
      <h3>{t("Recorded focus time", "کاتی سەرنجی تۆمارکراو")}</h3>
      {review.subjects.length ? <ul>{review.subjects.slice(0, 5).map(([id, subject]) => (
        <li key={id}>{subject.name} · {Math.round(subject.seconds / 60)} {t("min", "خولەک")}</li>
      ))}</ul> : <p>{t("No completed focus sessions recorded for this period.", "هیچ سێشنێکی تەواوکراوی سەرنج بۆ ئەم ماوەیە تۆمار نەکراوە.")}</p>}
      <form key={review.key} onSubmit={event => {
        event.preventDefault();
        const values = new FormData(event.currentTarget);
        const priorities = [0, 1, 2].map(index => String(values.get(`priority-${index}`) ?? "").trim());
        void onSave({ week: review.key, priorities });
      }}>
        <h3>{t("Choose up to three priorities", "تا سێ ئەولەویەت هەڵبژێرە")}</h3>
        {[0, 1, 2].map(index => (
          <label key={index}>
            {t("Priority", "ئەولەویەت")} {index + 1}
            <input name={`priority-${index}`} maxLength={300} defaultValue={plan?.week === review.key ? plan.priorities[index] ?? "" : ""} />
          </label>
        ))}
        <button className="outline" disabled={busy}>{t("Save priorities", "پاشەکەوتکردنی ئەولەویەتەکان")}</button>
      </form>
    </details>
  );
}
