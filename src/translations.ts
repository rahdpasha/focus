export type Language = 'en' | 'ku'

export const translations = {
  en: {
    // Language
    english: 'English',
    kurdishSorani: 'کوردی',
    language: 'Language',

    // Navigation
    overview: 'Overview',
    statistics: 'Statistics',
    settings: 'Settings',
    subjects: 'Subjects',

    // Subjects
    addSubject: 'Add Subject',
    newSubject: 'NEW SUBJECT',
    subjectName: 'Subject name',
    color: 'COLOR',
    createSubject: 'CREATE SUBJECT',
    deleteSubject: 'Delete',

    // Duration selector
    custom: 'CUSTOM',
    minutes: 'Minutes',
    set: 'SET',
    tenSec: '10 SEC',
    minutes25: '25 MIN',
    minutes45: '45 MIN',
    minutes60: '60 MIN',

    // Session history
    sessionHistory: 'Session History',
    all: 'ALL',
    completed: 'COMPLETED',
    interrupted: 'INTERRUPTED',
    allSubjects: 'ALL SUBJECTS',
    noMatchingSessions: 'No matching sessions.',
    deleteSession: 'Delete session',

    // Dashboard
    goodEvening: 'GOOD EVENING, BRO',
    systemStatus: 'System Status: Optimal',
    activeFocus: 'Active Focus',
    sessions: 'Sessions',
    streak: 'Streak',
    days: 'DAYS',
    dailyFocusGoal: 'Daily Focus Goal',
    dailyObjectiveComplete:
      'DAILY OBJECTIVE COMPLETE',
    completePercent: '% COMPLETE',
    loadingAnalytics:
      'LOADING ANALYTICS...',
    selectSubject: 'Select Subject',

    // Statistics
    today: 'TODAY',
    last7Days: 'LAST 7 DAYS',
    totalFocus: 'TOTAL FOCUS',
    avgSession: 'AVG SESSION',
    longest: 'LONGEST',

    // Analytics
    weeklyFocusTrend: 'Weekly Focus Trend',
    subjectBalance: 'Subject Balance',
    noDataStream: 'NO DATA STREAM',

    // Weekdays
    sun: 'Sun',
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',

    // Study goals
    studyGoals: 'STUDY GOALS',
    minutes30: '30 minutes',
    hour1: '1 hour',
    hours15: '1.5 hours',
    hours2: '2 hours',
    hours3: '3 hours',
    hours4: '4 hours',
    hours5: '5 hours',

    // Pomodoro
    pomodoro: 'POMODORO',
    shortBreakMinutes:
      'Short break (minutes)',
    longBreakMinutes:
      'Long break (minutes)',
    focusSessionsBeforeLongBreak:
      'Focus sessions before long break',
    automaticallyStartNextBreak:
      'Automatically start the next break',

    // Timer
    focus: 'FOCUS',
    shortBreak: 'SHORT BREAK',
    longBreak: 'LONG BREAK',
    sequenceComplete: 'SEQUENCE COMPLETE',
    takeLongBreak: 'TAKE LONG BREAK',
    takeShortBreak: 'TAKE SHORT BREAK',
    newSequence: 'NEW SEQUENCE',
    initiateSequence: 'INITIATE SEQUENCE',
    startBreak: 'START BREAK',
    resume: 'RESUME',
    pause: 'PAUSE',
    reset: 'RESET',
    paused: 'PAUSED',
    focused: 'focused',
    interruptions: 'interruptions',

    // Sound & Notifications
    sound: 'Sound',
    soundEnabled: 'Enable sounds',
    soundVolume: 'Volume',
    focusCompleteSound: 'Focus completion sound',
    breakCompleteSound: 'Break completion sound',
    notifications: 'Notifications',
    notificationsEnabled: 'Enable notifications',
    notificationPermission:
      'Browser notification permission',

    // Data
    data: 'DATA',
    backupDescription:
      'Backup your subjects, sessions, goals, and timer settings.',
    exportData: 'EXPORT DATA',
    importData: 'IMPORT DATA',

    // App messages
    dataImported: 'FOCUS DATA IMPORTED',
    invalidBackup: 'INVALID FOCUS BACKUP FILE',
    backupReadFailed:
      'FAILED TO READ BACKUP FILE',
  },

  ku: {
    // Language
    english: 'English',
    kurdishSorani: 'کوردی',
    language: 'زمان',

    // Navigation
    overview: 'سەرەکی',
    statistics: 'ئامار',
    settings: 'ڕێکخستنەکان',
    subjects: 'بابەتەکان',

    // Subjects
    addSubject: 'زیادکردنی بابەت',
    newSubject: 'بابەتی نوێ',
    subjectName: 'ناوی بابەت',
    color: 'ڕەنگ',
    createSubject: 'دروستکردنی بابەت',
    deleteSubject: 'سڕینەوە',

    // Duration selector
    custom: 'خۆت دیاری بکە',
    minutes: 'خولەک',
    set: 'دانان',
    tenSec: '١٠ چرکە',
    minutes25: '٢٥ خولەک',
    minutes45: '٤٥ خولەک',
    minutes60: '٦٠ خولەک',

    // Session history
    sessionHistory: 'مێژووی سێشنەکان',
    all: 'هەموو',
    completed: 'تەواوکراو',
    interrupted: 'وەستێنراو',
    allSubjects: 'هەموو بابەتەکان',
    noMatchingSessions:
      'هیچ سێشنێکی گونجاو نییە.',
    deleteSession: 'سڕینەوەی سێشن',

    // Dashboard
    goodEvening: 'بەیانی باش، برا',
    systemStatus: 'دۆخی سیستەم: باشە',
    activeFocus: 'سەرنجی چالاک',
    sessions: 'سێشنەکان',
    streak: 'زنجیرە',
    days: 'ڕۆژ',
    dailyFocusGoal:
      'ئامانجی ڕۆژانەی سەرنج',
    dailyObjectiveComplete:
      'ئامانجی ڕۆژانە تەواو بوو',
    completePercent: '% تەواوە',
    loadingAnalytics:
      'ئامارەکان بار دەکرێن...',
    selectSubject: 'بابەت هەڵبژێرە',

    // Statistics
    today: 'ئەمڕۆ',
    last7Days: '٧ ڕۆژی ڕابردوو',
    totalFocus: 'کۆی سەرنج',
    avgSession: 'ناوەندی سێشن',
    longest: 'درێژترین',

    // Analytics
    weeklyFocusTrend:
      'ڕەوتی سەرنجی هەفتانە',
    subjectBalance:
      'هاوسەنگی بابەتەکان',
    noDataStream:
      'هیچ داتایەک نییە',

    // Weekdays
    sun: 'یەکشەممە',
    mon: 'دووشەممە',
    tue: 'سێشەممە',
    wed: 'چوارشەممە',
    thu: 'پێنجشەممە',
    fri: 'هەینی',
    sat: 'شەممە',

    // Study goals
    studyGoals: 'ئامانجەکانی خوێندن',
    minutes30: '٣٠ خولەک',
    hour1: '١ کاتژمێر',
    hours15: '١.٥ کاتژمێر',
    hours2: '٢ کاتژمێر',
    hours3: '٣ کاتژمێر',
    hours4: '٤ کاتژمێر',
    hours5: '٥ کاتژمێر',

    // Pomodoro
    pomodoro: 'پۆمۆدۆرۆ',
    shortBreakMinutes:
      'پشووی کورت (خولەک)',
    longBreakMinutes:
      'پشووی درێژ (خولەک)',
    focusSessionsBeforeLongBreak:
      'ژمارەی سێشنەکانی سەرنج پێش پشووی درێژ',
    automaticallyStartNextBreak:
      'پشووی دواتر بە شێوەی خۆکار دەست پێ بکات',

    // Timer
    focus: 'سەرنج',
    shortBreak: 'پشووی کورت',
    longBreak: 'پشووی درێژ',
    sequenceComplete: 'سێشنەکە تەواو بوو',
    takeLongBreak: 'پشووی درێژ وەرگرە',
    takeShortBreak: 'پشووی کورت وەرگرە',
    newSequence: 'سێشنێکی نوێ',
    initiateSequence:
      'دەستپێکردنی سێشن',
    startBreak: 'دەستپێکردنی پشوودان',
    resume: 'بەردەوامبوون',
    pause: 'وەستاندن',
    reset: 'ڕێکخستنەوە',
    paused: 'وەستاوە',
    focused: 'سەرنج دراوە',
    interruptions: 'وەستاندنەکان',

    // Sound & Notifications
    sound: 'دەنگ',
    soundEnabled: 'چالاککردنی دەنگ',
    soundVolume: 'قەبارەی دەنگ',
    focusCompleteSound: 'دەنگی تەواوبوونی سەرنج',
    breakCompleteSound: 'دەنگی تەواوبوونی پشوودان',
    notifications: 'ئاگادارکردنەوەکان',
    notificationsEnabled:
      'چالاککردنی ئاگادارکردنەوەکان',
    notificationPermission:
      'مۆڵەتی ئاگادارکردنەوەی وێبگە',

    // Data
    data: 'داتا',
    backupDescription:
      'لە بابەتەکان، سێشنەکان، ئامانجەکان و ڕێکخستنەکانی کاتی کارەکەت باکاپ بگرە.',
    exportData: 'هەناردەکردنی داتا',
    importData: 'هێنانی داتا',

    // App messages
    dataImported:
      'داتای FOCUS هێنراوەتەوە',
    invalidBackup:
      'فایلی باکاپی FOCUS دروست نییە',
    backupReadFailed:
      'خوێندنەوەی فایلی باکاپ سەرکەوتوو نەبوو',
  },
} as const

export type TranslationKey =
  keyof typeof translations.en