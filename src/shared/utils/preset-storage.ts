export function loadSavedPresets<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

export function persistPresets<T>(key: string, presets: T[]): void {
  localStorage.setItem(key, JSON.stringify(presets));
}
