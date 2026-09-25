import type { Language } from '../translations'

const exactSorani: Record<string, string> = {
  'Not studied yet this week.': 'ئەم هەفتەیە هێشتا نەخوێندراوە.',
  'Highest priority based on weekly goal gap.': 'بەپێی کەمی ئامانجی هەفتانە، ئەمە زۆرترین گرنگی هەیە.',
  'Lowest weekly goal progress.': 'کەمترین پێشکەوتنی ئامانجی هەفتانە.',
  'Maintain subject balance.': 'هاوسەنگی بابەتەکان بپارێزە.',
  'Rebuild daily study momentum.': 'ڕێتمی خوێندنی ڕۆژانە دووبارە دروست بکە.',
  'Keep your study rhythm active.': 'ڕێتمی خوێندنت چالاک بپارێزە.',
  'Follow your structured daily study plan to meet weekly targets.': 'پلانی ڕێکخراوی خوێندنی ڕۆژانەت جێبەجێ بکە بۆ گەیشتن بە ئامانجە هەفتانەکان.',
  'FOCUS is using your recent study behavior to choose one useful next action.': 'FOCUS شێوازی خوێندنی نوێت بەکاردەهێنێت بۆ هەڵبژاردنی یەک هەنگاوی داهاتووی بەسوود.',
  'Daily target reached.': 'ئامانجی ڕۆژانە پێکرا.',
  'You have done enough for today. Protect the win and return tomorrow rather than forcing extra volume.': 'بۆ ئەمڕۆ بەسە. ئەنجامەکە بپارێزە و سبەی بگەڕێوە، لە جیاتی زیادەڕۆیی.',
  'You have completed today’s target. Extra study is optional; consistency matters more than squeezing in random minutes.': 'ئامانجی ئەمڕۆت تەواو کردووە. خوێندنی زیاتر ئارەزوومەندانەیە؛ بەردەوامی گرنگترە لە پڕکردنەوەی خولەکی هەڕەمەکی.',
  'There is not enough current-week data yet, so FOCUS is starting with a simple session to establish momentum.': 'هێشتا داتای بەس لەم هەفتەیە نییە، بۆیە FOCUS بە سێشنێکی سادە دەست پێ دەکات بۆ دروستکردنی ڕێتم.',
  'Your study rhythm is improving. Maintain the current pace.': 'ڕێتمی خوێندنت باشتر دەبێت. هەمان خێرایی بپارێزە.',
  'Your study rhythm is stable. Maintain the current pace.': 'ڕێتمی خوێندنت جێگیرە. هەمان خێرایی بپارێزە.',
  'Start a focused session to give FOCUS enough data to guide you.': 'سێشنێکی سەرنج دەست پێ بکە تا FOCUS داتای بەس هەبێت بۆ ڕێنماییت.',
}

function replacePatterns(text: string): string {
  return text
    .replace(
      /^(.+) has not been studied this week\.$/,
      '$1 ئەم هەفتەیە نەخوێندراوە.',
    )
    .replace(
      /^(.+) is receiving very little study time\.$/,
      '$1 کاتی خوێندنی زۆر کەمی پێ دەدرێت.',
    )
    .replace(
      /^Your average session is (\d+) minutes; a focused 25-minute block is recommended\.$/,
      'ناوەندی سێشنەکانت $1 خولەکە؛ بڵۆکێکی سەرنجی ٢٥ خولەکی پێشنیار دەکرێت.',
    )
    .replace(
      /^You are (\d+) minutes short of your weekly goal\.$/,
      '$1 خولەک بۆ گەیشتن بە ئامانجی هەفتانەت ماوە.',
    )
    .replace(
      /^(.+) is the strongest next action from your current subject balance, weekly target and consistency pattern\.$/,
      '$1 بەهێزترین هەنگاوی داهاتووە بەپێی هاوسەنگی بابەتەکان، ئامانجی هەفتانە و بەردەوامیت.',
    )
    .replace(
      /^(\d+)\/(\d+)m today$/,
      '$1/$2 خولەک ئەمڕۆ',
    )
    .replace(
      /^(\d+)\/(\d+)m this week$/,
      '$1/$2 خولەک ئەم هەفتەیە',
    )
    .replace(
      /^Best window (.+)$/,
      'باشترین کات $1',
    )
    .replace(
      /^Consistency improving$/,
      'بەردەوامی باشتر دەبێت',
    )
    .replace(
      /^Consistency declining$/,
      'بەردەوامی خراپتر دەبێت',
    )
    .replace(
      /^Consistency stable$/,
      'بەردەوامی جێگیرە',
    )
    .replace(
      /^Start (\d+)m · (.+)$/,
      'دەست پێ بکە $1 خولەک · $2',
    )
    .replace(
      /^Start (\d+)m focus$/,
      'دەست پێ بکە $1 خولەک سەرنج',
    )
}

export function localizeUiText(
  language: Language,
  text: string,
): string {
  if (language !== 'ku') return text

  return exactSorani[text] ?? replacePatterns(text)
}
