import { useEffect, useState } from "react";
import { useI18n } from "../useI18n";
import { isRecentRelease, nodeReleaseSchema, type NodeRelease } from "./nodeRelease";

export default function TechnologyUpdate({ now }: { now: Date }) {
  const { tr: t, language } = useI18n();
  const day = now.toISOString().slice(0, 10);
  const [release, setRelease] = useState<NodeRelease | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/muse-tech-update", {
          credentials: "omit",
          signal: controller.signal,
        });
        const parsed = response.ok ? nodeReleaseSchema.safeParse(await response.json()) : null;
        if (!controller.signal.aborted) setRelease(parsed?.success ? parsed.data : null);
      } catch {
        if (!controller.signal.aborted) setRelease(null);
      }
    }
    void load();
    return () => controller.abort();
  }, [day]);

  if (!release || !isRecentRelease(release.date, now)) return null;
  const published = new Intl.DateTimeFormat(language === "ku" ? "ckb" : "en-GB", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  }).format(new Date(release.date));

  return (
    <article>
      <h3>{t("Technology update", "نوێکاریی تەکنەلۆژیا")}</h3>
      <p><strong dir="ltr">Node.js {release.version}</strong> · {published}</p>
      <p>{release.security
        ? t("Node.js marks this long-term support release as a security update. If your project runs this major version, check the official notes for affected versions and fixes.", "Node.js ئەم وەشانەی پشتگیریی درێژخایەن وەک نوێکارییەکی ئاسایشی دیاری کردووە. ئەگەر پڕۆژەکەت ئەم وەشانە سەرەکییە بەکاردەهێنێت، تێبینییە فەرمییەکان بۆ وەشانە کاریگەرەکان و چاکسازییەکان بخوێنەوە.")
        : t("This is a release from a long-term support line. If your project runs this major version, check the changes before your next planned upgrade.", "ئەم وەشانە لە زنجیرەی پشتگیریی درێژخایەنە. ئەگەر پڕۆژەکەت ئەم وەشانە سەرەکییە بەکاردەهێنێت، پێش نوێکردنەوەی داهاتوو گۆڕانکارییەکان بپشکنە.")}</p>
      <a href={`https://nodejs.org/en/blog/release/${release.version}`} target="_blank" rel="noopener noreferrer">
        {t("Official release notes", "تێبینییە فەرمییەکانی وەشان")} · Node.js
      </a>
    </article>
  );
}
