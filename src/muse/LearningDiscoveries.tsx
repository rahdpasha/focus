import { localDate } from "./domain";
import { useI18n } from "../useI18n";

import { learningTopics, type LearningPreference } from "./learningTopics";

const resources = [
  {
    url: "https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository",
    topic: "software",
    source: "Pro Git",
    title: ["Understand what goes into a commit", "تێبگە لەوەی چی دەچێتە ناو کۆمیتێک"],
    why: [
      "Learn how Git separates your edits from the changes you have selected for the next commit.",
      "فێربە چۆن Git دەستکارییەکانت لەو گۆڕانکارییانە جیا دەکاتەوە کە بۆ کۆمیتی داهاتوو هەڵتبژاردوون.",
    ],
    practice: [
      "In a practice repo, edit two files and stage one. Compare git diff with git diff --staged.",
      "لە ریپۆیەکی تاقیکردنەوەدا دوو فایل دەستکاری بکە و یەکێکیان ئامادەی کۆمیت بکە. git diff و git diff --staged بەراورد بکە.",
    ],
  },
  {
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview",
    topic: "software",
    source: "MDN",
    title: ["Read an HTTP request", "داواکارییەکی HTTP بخوێنەوە"],
    why: [
      "Knowing what the browser sends and what the server returns makes API debugging easier.",
      "زانینی ئەوەی وێبگەڕ چی دەنێرێت و سێرڤەر چی دەگەڕێنێتەوە، دۆزینەوەی هەڵەی API ئاسانتر دەکات.",
    ],
    practice: [
      "Open the browser’s Network tab, reload a page, and find one request’s method, status code, and response.",
      "تابی Network لە وێبگەڕ بکەرەوە، پەڕەکە نوێ بکەرەوە و method، status code و وەڵامی یەک داواکاری بدۆزەوە.",
    ],
  },
  {
    topic: "language",
    url: "https://learnenglish.britishcouncil.org/free-resources/listening",
    source: "British Council",
    title: ["Practise listening in English", "ڕاهێنانی گوێگرتن بە ئینگلیزی"],
    why: ["Short recordings let you practise at your level.", "تۆمارە کورتەکان ڕێگەت پێدەدەن بە ئاستی خۆت ڕاهێنان بکەیت."],
    practice: ["Pick a lesson at your level. Listen once for the main idea, then listen again and check your answers.", "وانەیەک بە ئاستی خۆت هەڵبژێرە. جارێک بۆ بیرۆکەی سەرەکی گوێ بگرە، پاشان دووبارە گوێ بگرە و وەڵامەکانت بپشکنە."],
  },
  {
    topic: "study",
    url: "https://www.learningscientists.org/downloadable-materials",
    source: "The Learning Scientists",
    title: ["Recall what you studied", "ئەوەی خوێندووتە بیهێنەرەوە یادت"],
    why: ["Recalling a topic helps you notice what you still need to review.", "بیرهێنانەوە یارمەتیت دەدات بزانیت چی هێشتا پێویستی بە پێداچوونەوە هەیە."],
    practice: ["Close your notes, write three points from memory, then check what you missed.", "تێبینییەکانت دابخە، سێ خاڵ لەبەرەوە بنووسە و پاشان بپشکنە چیت لەبیر چووە."],
  },
] as const;

export default function LearningDiscoveries({ preference, onChange, now }: {
  preference: LearningPreference;
  now: Date;
  onChange: (value: LearningPreference) => void;
}) {
  const { tr: t } = useI18n();

  if (preference === "hidden") return null;

  const today = localDate(now);
  const showUpdate = preference === "software" && today >= "2026-11-10" && today <= "2026-11-20";

  return (
    <details className="quiet-note muse-learning">
      <summary>{t("Optional learning", "فێربوونی ئارەزوومەندانە")}</summary>
      <label className="muse-learning-topic">
        {t("Learning topic", "بابەتی فێربوون")}
        <select value={preference} onChange={(event) => {
          const value = event.target.value;
          if (value === "choose" || value === "hidden") onChange(value);
          else {
            const topic = learningTopics.find(([id]) => id === value);
            if (topic) onChange(topic[0]);
          }
        }}>
          <option value="choose">{t("Choose a topic", "بابەتێک هەڵبژێرە")}</option>
          {learningTopics.map(([id, en, ku]) => <option key={id} value={id}>{t(en, ku)}</option>)}
          <option value="hidden">{t("Hide optional learning", "شاردنەوەی فێربوونی ئارەزوومەندانە")}</option>
        </select>
      </label>
      {showUpdate && (
        <article>
          <h3>{t("Technology update", "نوێکاریی تەکنەلۆژیا")}</h3>
          <p>{t(
            "On 10 November, OpenAI’s JavaScript SDK added TypeScript types for asynchronous function tools.",
            "لە ١٠ی تشرینی دووەم، SDKی جاڤاسکریپتی OpenAI جۆرەکانی TypeScriptی بۆ ئامرازە ناهاوکاتەکانی فانکشن زیاد کرد.",
          )}</p>
          <p>{t(
            "This matters if your TypeScript project uses the Responses API and defines async tools. Review the release notes before your next SDK upgrade.",
            "ئەگەر پڕۆژەی TypeScriptـەکەت Responses API و ئامرازی ناهاوکات بەکار دەهێنێت، پێش نوێکردنەوەی SDK تێبینییەکانی وەشان بخوێنەوە.",
          )}</p>
          <a href="https://github.com/openai/openai-node/releases/tag/v7.55.0" target="_blank" rel="noopener noreferrer">
            {t("Official release notes", "تێبینییە فەرمییەکانی وەشان")} · OpenAI
          </a>
        </article>
      )}
      {resources.filter(({ topic }) => topic === preference).map(({ url, source, title, why, practice }) => (
        <article key={url}>
          <h3>{t(title[0], title[1])}</h3>
          <p>{t(why[0], why[1])}</p>
          <p><strong>{t("Try it", "تاقی بکەرەوە")}</strong> · {t(practice[0], practice[1])}</p>
          <a href={url} target="_blank" rel="noopener noreferrer">
            {t("Read the guide", "ڕێنماییەکە بخوێنەوە")} · {source}
          </a>
        </article>
      ))}
    </details>
  );
}
