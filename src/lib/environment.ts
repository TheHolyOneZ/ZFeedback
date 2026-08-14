import { invoke } from "@tauri-apps/api/core";


export type Environment = {

  platform: string;
  arch: string;
  app_version: string;

  webview: string;

  custom_chrome: boolean;
};

export function environment(): Promise<Environment> {
  return invoke<Environment>("environment");
}


export function platformName(p: string): string {
  switch (p) {
    case "windows":
      return "Windows";
    case "linux":
      return "Linux";
    case "macos":
      return "macOS";
    default:
      return p;
  }
}
