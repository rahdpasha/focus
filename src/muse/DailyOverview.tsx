import { useI18n } from "../useI18n";
import { dailyOverview } from "./dailyOverview";
import { morningPriority } from "./morningBriefing";
import type { Task } from "./domain";

export default function DailyOverview({ tasks, now, onOpen, onViewAll }: {
  tasks: Task[]; now: Date; onOpen: (task: Task) => void; onViewAll: () => void;
}) {
  const { tr: t, language } = useI18n();
  const overview = dailyOverview(tasks, now);
  const priority = morningPriority(tasks, now);
  const date = (value: string) => new Intl.DateTimeFormat(language === "ku" ? "ckb" : "en-GB", {
    day: "numeric", month: "short", timeZone: "Asia/Baghdad",
  }).format(new Date(`${value}T12:00:00Z`));
  return <section id="muse-daily-overview" tabIndex={-1} className="quiet-note muse-daily-overview" aria-label={t("Daily overview", "پوختەی ڕۆژانە")}>
    {priority && (
      <div className="muse-morning-priority">
        <h3>{t("Morning briefing", "پوختەی بەیانی")}</h3>
        <p>{priority.due && priority.due < overview.today
          ? t("Review this past date first.", "سەرەتا ئەم بەروارە تێپەڕیوە بپشکنە.")
          : priority.due === overview.today
            ? t("Make time for this today.", "ئەمڕۆ کات بۆ ئەمە دابنێ.")
            : priority.due
              ? t("Prepare for tomorrow.", "بۆ سبەی ئامادەبە.")
              : t("You marked this as important.", "ئەمەت بە گرنگ دیاری کردووە.")}</p>
        <button className="text-button" onClick={() => onOpen(priority)}>{priority.title}</button>
      </div>
    )}
    <h3>{t("Your next few days", "چەند ڕۆژی داهاتووت")}</h3>
    <p>{t("From your saved dates · Kurdistan time", "لە بەروارە تۆمارکراوەکانت · کاتی کوردستان")}</p>
    {overview.items.some(({ task }) => task.id !== priority?.id) ? <ul>
      {overview.items.filter(({ task }) => task.id !== priority?.id).map(({ task, reason }) => <li key={task.id}>
        <button className="text-button" onClick={() => onOpen(task)}>
          <strong>{task.title}</strong>
          <span>{reason === "review" ? t("Date passed · review", "بەروار تێپەڕیوە · پێداچوونەوە") : reason === "today" ? t("Today", "ئەمڕۆ") : t("Coming up", "بەم زووانە")} · {date(task.due!)}</span>
        </button>
      </li>)}
    </ul> : !overview.items.length ? <p>{t("No unfinished dated items through the next three days. Your undated responsibilities are still in My life.", "تا سێ ڕۆژی داهاتوو هیچ بابەتێکی بەرواردار و تەواونەکراو نییە. بەرپرسیارێتییە بێ بەروارەکانت لە ژیانم دان.")}</p> : null}
    <button className="text-button" onClick={onViewAll}>
      {overview.total > 3 ? t(`${overview.total - 3} more · Open My life`, `${overview.total - 3}ی تر · کردنەوەی ژیانم`) : t("Open My life", "کردنەوەی ژیانم")}
    </button>
  </section>;
}
