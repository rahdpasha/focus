export interface AppSettings {
  shortBreak: number
  longBreak: number
  sessionsBeforeLongBreak: number
  autoStartBreak: boolean
  soundEnabled: boolean
  soundVolume: number
  notificationsEnabled: boolean
}

export const defaultSettings: AppSettings = {
  shortBreak: 5,
  longBreak: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreak: false,
  soundEnabled: true,
  soundVolume: 70,
  notificationsEnabled: true,
}
