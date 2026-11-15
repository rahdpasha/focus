import { useI18n } from "../useI18n";
import { dailyOverview } from "./dailyOverview";
import type { Task } from "./domain";

export default function DailyOverview({ tasks, now, onOpen, onViewAll }: {
  tasks: Task[]; now: Date; onOpen: (task: Task) => void; onViewAll: () => void;
}) {
  const { tr: t, language } = useI18n();
  const overview = dailyOverview(tasks, now);
  const date = (value: string) => new Intl.DateTimeFormat(language === "ku" ? "ckb" : "en-GB", {
    day: "numeric", month: "short", timeZone: "Asia/Baghdad",
  }).format(new Date(`${value}T12:00:00Z`));
  return <section className="quiet-note muse-daily-overview" aria-label={t("Daily overview", "پوختەی ڕۆژانە")}>
    <h3>{t("Your next few days", "چەند ڕۆژی داهاتووت")}</h3>
    <p>{t("From your saved dates · Kurdistan time", "لە بەروارە تۆمارکراوەکانت · کاتی کوردستان")}</p>
    {overview.items.length ? <ul>
      {overview.items.map(({ task, reason }) => <li key={task.id}>
        <button className="text-button" onClick={() => onOpen(task)}>
          <strong>{task.title}</strong>
          <span>{reason === "review" ? t("Date passed · review", "بەروار تێپەڕیوە · پێداچوونەوە") : reason === "today" ? t("Today", "ئەمڕۆ") : t("Coming up", "بەم زووانە")} · {date(task.due!)}</span>
        </button>
      </li>)}
    </ul> : <p>{t("No unfinished dated items through the next three days. Your undated responsibilities are still in My life.", "تا سێ ڕۆژی داهاتوو هیچ بابەتێکی بەرواردار و تەواونەکراو نییە. بەرپرسیارێتییە بێ بەروارەکانت لە ژیانم دان.")}</p>}
    <button className="text-button" onClick={onViewAll}>
      {overview.total > 3 ? t(`${overview.total - 3} more · Open My life`, `${overview.total - 3}ی تر · کردنەوەی ژیانم`) : t("Open My life", "کردنەوەی ژیانم")}
    </button>
  </section>;
}
