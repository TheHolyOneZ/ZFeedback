

use serde::Serialize;
use tauri::Manager;

#[derive(Serialize)]
pub struct Environment {

    pub platform: &'static str,
    pub arch: &'static str,

    pub app_version: String,


    pub webview: &'static str,

    pub custom_chrome: bool,
}

#[tauri::command]
pub fn environment(app: tauri::AppHandle) -> Environment {
    Environment {
        platform: std::env::consts::OS,
        arch: std::env::consts::ARCH,
        app_version: app.package_info().version.to_string(),
        webview: webview_family(),
        custom_chrome: custom_chrome(&app),
    }
}


fn custom_chrome(app: &tauri::AppHandle) -> bool {
    app.get_webview_window("main")
        .and_then(|w| w.is_decorated().ok())
        .map(|decorated| !decorated)


        .unwrap_or(true)
}


fn webview_family() -> &'static str {
    #[cfg(target_os = "linux")]
    {
        "WebKitGTK"
    }
    #[cfg(target_os = "windows")]
    {
        "WebView2 (Chromium)"
    }
    #[cfg(target_os = "macos")]
    {
        "WKWebView"
    }
}
