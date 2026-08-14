

use std::sync::atomic::{AtomicBool, Ordering};

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager,
};


static TRAY_PRESENT: AtomicBool = AtomicBool::new(false);

pub fn tray_present() -> bool {
    TRAY_PRESENT.load(Ordering::Relaxed)
}


pub fn build(app: &AppHandle) -> bool {
    let Some(icon) = app.default_window_icon().cloned() else {
        eprintln!("ZFeedback: no window icon available — starting without a tray");
        return false;
    };

    let menu = match build_menu(app, 0) {
        Ok(m) => m,
        Err(e) => {
            eprintln!("ZFeedback: could not build the tray menu: {e}");
            return false;
        }
    };

    let built = TrayIconBuilder::with_id("main")
        .icon(icon)
        .tooltip("ZFeedback")
        .menu(&menu)


        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => show_main(app),
            "tickets" => {
                show_main(app);
                let _ = app.emit("tray:open-tickets", ());
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main(tray.app_handle());
            }
        })
        .build(app);

    match built {
        Ok(_) => {
            TRAY_PRESENT.store(true, Ordering::Relaxed);
            true
        }
        Err(e) => {
            eprintln!("ZFeedback: no system tray available: {e}");
            false
        }
    }
}


fn build_menu(app: &AppHandle, count: u32) -> tauri::Result<Menu<tauri::Wry>> {
    let tickets_label = match count {
        0 => "My tickets".to_string(),
        n => format!("My tickets ({n} waiting on you)"),
    };

    let open = MenuItem::with_id(app, "open", "Open ZFeedback", true, None::<&str>)?;
    let tickets = MenuItem::with_id(app, "tickets", &tickets_label, true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    Menu::with_items(app, &[&open, &tickets, &quit])
}

fn show_main(app: &AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.show();
        let _ = w.unminimize();
        let _ = w.set_focus();
    }
}


#[tauri::command]
pub fn tray_set_pending(app: AppHandle, count: u32) {
    let Some(tray) = app.tray_by_id("main") else { return };

    let text = match count {
        0 => "ZFeedback".to_string(),
        1 => "ZFeedback — 1 ticket needs your reply".to_string(),
        n => format!("ZFeedback — {n} tickets need your reply"),
    };
    let _ = tray.set_tooltip(Some(&text));


    if let Ok(menu) = build_menu(&app, count) {
        let _ = tray.set_menu(Some(menu));
    }
}
