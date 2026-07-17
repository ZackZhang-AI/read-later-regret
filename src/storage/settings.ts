import { sanitizeSettings, type PartialUserSettings, type UserSettings } from "../core/settings"

const SETTINGS_KEY = "readLaterRegretSettings"

type SettingsStorageShape = {
  [SETTINGS_KEY]?: PartialUserSettings
}

export async function getSettings(): Promise<UserSettings> {
  const result = (await chrome.storage.local.get(SETTINGS_KEY)) as SettingsStorageShape

  return sanitizeSettings(result[SETTINGS_KEY])
}

export async function saveSettings(settings: PartialUserSettings): Promise<UserSettings> {
  const sanitizedSettings = sanitizeSettings(settings)
  await chrome.storage.local.set({ [SETTINGS_KEY]: sanitizedSettings })

  return sanitizedSettings
}

