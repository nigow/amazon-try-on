export interface UserSettings {
  // FIX: Removed apiKey from UserSettings as it will be handled by environment variables.
  portraitImage: string; // base64 data URL
}
