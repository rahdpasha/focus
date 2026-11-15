export const learningTopics = [
  ["software", "Software basics", "بنەماکانی نەرمەکاڵا"],
  ["language", "English practice", "ڕاهێنانی ئینگلیزی"],
  ["study", "Study skills", "تواناکانی خوێندن"],
] as const;

type LearningTopic = typeof learningTopics[number][0];
export type LearningPreference = LearningTopic | "hidden" | "choose";

