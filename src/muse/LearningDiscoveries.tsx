import { useI18n } from "../useI18n";

const resources = [
  {
    url: "https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository",
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
] as const;

export default function LearningDiscoveries() {
  const { tr: t } = useI18n();

  return (
    <details className="quiet-note muse-learning">
      <summary>{t("Optional learning · software basics", "فێربوونی ئارەزوومەندانە · بنەماکانی نەرمەکاڵا")}</summary>
      {resources.map(({ url, source, title, why, practice }) => (
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
