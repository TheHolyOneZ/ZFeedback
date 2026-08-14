

mod auth;
mod catalogue;
mod env;
mod models;
mod tickets;
mod tray;

use tauri::Manager;


#[tauri::command]
fn app_ready(window: tauri::Window) {
    let _ = window.show();
    let _ = window.set_focus();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(auth::AuthState::default())
        .invoke_handler(tauri::generate_handler![
            app_ready,
            env::environment,
            catalogue::catalogue_cached,
            catalogue::catalogue_refresh,
            auth::auth_session,
            auth::auth_start,
            auth::auth_cancel,
            auth::auth_sign_out,
            tickets::ticket_context,
            tickets::ticket_create,
            tickets::tickets_mine,
            tickets::ticket_get,
            tickets::ticket_reply,
            tickets::ticket_vote,


            tickets::ticket_withdraw,
            tickets::ticket_edit,
            tickets::ticket_publish,
            tickets::attachment_upload,
            tickets::attachment_data,
            tickets::rating_submit,
            tickets::rating_mine,
            tickets::public_requests,
            tickets::tickets_similar,
            tickets::ticket_projects,
            tickets::feed_updates,
            tray::tray_set_pending,
        ])
        .setup(|app| {

            tray::build(app.handle());


            catalogue::refresh_in_background(app.handle().clone());


            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                tokio::time::sleep(std::time::Duration::from_millis(2500)).await;
                if let Some(w) = handle.get_webview_window("main") {
                    if !w.is_visible().unwrap_or(true) {
                        let _ = w.show();
                    }
                }
            });
            Ok(())
        })
        .on_window_event(|window, event| {


            if let tauri::WindowEvent::CloseRequested { api, .. } = event {


                if tray::tray_present() {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running ZFeedback");
}
