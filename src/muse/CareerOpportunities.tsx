import { useI18n } from "../useI18n";

export default function CareerOpportunities() {
  const { tr: t } = useI18n();
  return (
    <details className="muse-opportunities">
      <summary>{t("Career opportunities", "هەلی پیشەیی")}</summary>
      <article>
        <h3>{t("Contribute to Firefox", "بەشداری لە Firefox بکە")}</h3>
        <p>{t(
          "Online open-source contribution · No application deadline",
          "بەشداریی ئۆنلاین لە سەرچاوە کراوەدا · بەرواری کۆتایی داواکردن نییە",
        )}</p>
        <p>{t(
          "Practise reading an issue and working with a real project. Start by reproducing a bug and documenting what happened. If you want to submit a patch, follow the project’s setup and review guide.",
          "خوێندنەوەی کێشەیەک و کارکردن لەسەر پڕۆژەیەکی ڕاستەقینە تاقی بکەرەوە. بە دووبارە دروستکردنەوەی هەڵەیەک و تۆمارکردنی ئەنجامەکە دەست پێ بکە. ئەگەر دەتەوێت چاکسازی بنێریت، ڕێنمایی ئامادەکردن و پێداچوونەوەی پڕۆژەکە بخوێنەوە.",
        )}</p>
        <a href="https://firefox-source-docs.mozilla.org/contributing/contribution_quickref.html" target="_blank" rel="noopener noreferrer">
          {t("Firefox contribution guide", "ڕێنمایی بەشداری لە Firefox")}
        </a>
      </article>
      <article>
        <h3>LFX Mentorship</h3>
        <p>{t(
          "Linux Foundation program directory · Deadlines and location depend on the project",
          "بەڕنامەکانی Linux Foundation · بەرواری کۆتایی و شوێن بە پڕۆژەکە دەگۆڕێن",
        )}</p>
        <p>{t(
          "Explore mentored open-source projects. Applicants must be at least 18 when the program starts and meet the program’s participation and work eligibility rules. Open a project listing and check its status, dates, location, and skills before applying.",
          "پڕۆژە سەرچاوە کراوەکان بە ڕێنمایی مامۆستا بپشکنە. داواکار دەبێت لە دەستپێکی بەڕنامەکەدا لانیکەم ١٨ ساڵ بێت و مەرجەکانی بەشداری و کارکردن جێبەجێ بکات. پێش داواکردن، دۆخ، بەروار، شوێن و تواناکانی پڕۆژەکە بپشکنە.",
        )}</p>
        <div className="muse-opportunities-links">
          <a href="https://mentorship.linuxfoundation.org/" target="_blank" rel="noopener noreferrer">
            {t("Browse projects", "پڕۆژەکان ببینە")}
          </a>
          <a href="https://docs.linuxfoundation.org/lfx/mentorship/mentee-guide/am-i-eligible" target="_blank" rel="noopener noreferrer">
            {t("Read eligibility rules", "مەرجەکانی بەشداری بخوێنەوە")}
          </a>
        </div>
      </article>
    </details>
  );
}
