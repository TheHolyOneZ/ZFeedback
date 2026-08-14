

use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};

pub const API_BASE: &str = "https://zsync.eu/feedback/api/v1";
const KEYRING_SERVICE: &str = "eu.zsync.zfeedback";
const KEYRING_USER: &str = "api-token";


#[derive(Default)]
pub struct AuthState {
    token: Mutex<Option<String>>,

    pending: Mutex<Option<String>>,


    signed_out: Mutex<bool>,
}


#[derive(Debug, Default, Deserialize)]
#[serde(default)]
struct StartResponse {
    ok: bool,
    device_code: Option<String>,
    user_code: Option<String>,
    login_url: Option<String>,
    interval: Option<u64>,
    message: Option<String>,
    error: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(default)]
struct PollResponse {
    ok: bool,
    status: Option<String>,
    token: Option<String>,
    user: Option<PublicUser>,
    discord_invite: Option<String>,
    message: Option<String>,
    error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PublicUser {
    pub id: u64,
    pub username: Option<String>,
    pub avatar: Option<String>,
}


#[derive(Debug, Clone, Serialize)]
pub struct Session {
    pub signed_in: bool,
    pub user: Option<PublicUser>,
}


#[derive(Debug, Clone, Serialize)]
#[serde(tag = "state", rename_all = "snake_case")]
pub enum LoginProgress {


    Waiting {
        user_code: String,
        login_url: String,
        browser_opened: bool,
    },

    NeedsGuild { discord_invite: String, message: String },

    Verifying,
    Approved { user: PublicUser },
    Expired,
    Failed { message: String },
}


fn keyring_entry() -> Result<keyring::Entry, String> {
    keyring::Entry::new(KEYRING_SERVICE, KEYRING_USER).map_err(|e| e.to_string())
}

fn store_token(token: &str) -> Result<(), String> {
    keyring_entry()?
        .set_password(token)
        .map_err(|e| format!("could not save to keychain: {e}"))
}

fn load_token() -> Option<String> {
    match keyring_entry().ok()?.get_password() {
        Ok(t) if !t.is_empty() => Some(t),
        _ => None,
    }
}


fn clear_token() -> bool {
    let Ok(entry) = keyring_entry() else {
        eprintln!("zfeedback: keychain unavailable while signing out");
        return false;
    };
    match entry.delete_credential() {
        Ok(()) => true,

        Err(keyring::Error::NoEntry) => true,
        Err(e) => {
            eprintln!("zfeedback: could not delete the stored token: {e}");
            false
        }
    }
}


pub fn client(app: &AppHandle) -> Result<reqwest::Client, String> {
    let version = app.package_info().version.to_string();
    reqwest::Client::builder()
        .timeout(Duration::from_secs(20))
        .user_agent(format!("ZFeedback/{version}"))
        .build()
        .map_err(|e| e.to_string())
}


pub fn current_token(app: &AppHandle) -> Option<String> {
    let state = app.state::<AuthState>();

    if let Some(t) = state.token.lock().ok()?.clone() {
        return Some(t);
    }


    if state.signed_out.lock().map(|g| *g).unwrap_or(false) {
        return None;
    }

    let from_keyring = load_token()?;
    if let Ok(mut guard) = state.token.lock() {
        *guard = Some(from_keyring.clone());
    }
    Some(from_keyring)
}


pub async fn api_request(
    app: &AppHandle,
    method: reqwest::Method,
    path: &str,
    body: Option<serde_json::Value>,
) -> Result<serde_json::Value, String> {
    let token = current_token(app).ok_or_else(|| "not_signed_in".to_string())?;
    let client = client(app)?;

    let mut req = client
        .request(method, format!("{API_BASE}{path}"))
        .bearer_auth(token);

    if let Some(b) = body {
        req = req.json(&b);
    }

    let res = req.send().await.map_err(|e| format!("network: {e}"))?;
    let status = res.status();
    let value: serde_json::Value = res
        .json()
        .await
        .map_err(|e| format!("bad response: {e}"))?;


    if status == reqwest::StatusCode::UNAUTHORIZED {
        sign_out_local(app);
        let _ = app.emit("auth:signed-out", "unauthorized");
        return Err("not_signed_in".into());
    }

    if !status.is_success() {
        let code = value
            .get("error")
            .and_then(|v| v.as_str())
            .unwrap_or("request_failed");


        if code == "needs_guild" {
            let _ = app.emit(
                "auth:needs-guild",
                value.get("invite").and_then(|v| v.as_str()).unwrap_or(""),
            );
        }
        let msg = value
            .get("message")
            .and_then(|v| v.as_str())
            .unwrap_or("Request failed.");
        return Err(format!("{code}: {msg}"));
    }

    Ok(value)
}

fn sign_out_local(app: &AppHandle) {
    let cleared = clear_token();
    let state = app.state::<AuthState>();
    if let Ok(mut guard) = state.token.lock() {
        *guard = None;
    }

    if let Ok(mut guard) = state.signed_out.lock() {
        *guard = true;
    }
    if !cleared {
        eprintln!("zfeedback: signed out, but the keychain entry may remain");
    }
}


#[tauri::command]
pub async fn auth_session(app: AppHandle) -> Session {
    if current_token(&app).is_none() {
        return Session { signed_in: false, user: None };
    }

    match api_request(&app, reqwest::Method::GET, "/me", None).await {
        Ok(v) => {
            let user = v
                .get("user")
                .and_then(|u| serde_json::from_value::<PublicUser>(u.clone()).ok());
            Session { signed_in: user.is_some(), user }
        }


        Err(e) if e == "not_signed_in" => Session { signed_in: false, user: None },
        Err(_) => Session {
            signed_in: true,
            user: None,
        },
    }
}

#[tauri::command]
pub fn auth_sign_out(app: AppHandle) -> Session {


    let token = current_token(&app);
    let client = client(&app).ok();

    if let (Some(token), Some(client)) = (token, client) {
        tauri::async_runtime::spawn(async move {
            match client
                .post(format!("{API_BASE}/auth/logout"))
                .bearer_auth(token)
                .send()
                .await
            {
                Ok(r) if r.status().is_success() => {}
                Ok(r) => eprintln!("zfeedback: logout refused ({})", r.status()),


                Err(e) => eprintln!("zfeedback: could not reach logout: {e}"),
            }
        });
    }

    sign_out_local(&app);
    Session { signed_in: false, user: None }
}


#[tauri::command]
pub async fn auth_start(app: AppHandle) -> Result<(), String> {
    {
        let state = app.state::<AuthState>();
        let pending = state.pending.lock().map_err(|_| "lock")?;
        if pending.is_some() {
            return Err("A sign-in is already in progress.".into());
        }
    }

    let device_name = hostname_label();
    let client = client(&app)?;

    let res = client
        .post(format!("{API_BASE}/auth/start"))
        .json(&serde_json::json!({ "device_name": device_name }))
        .send()
        .await
        .map_err(|e| format!("Could not reach zsync.eu: {e}"))?;

    let status = res.status();


    let body = res
        .text()
        .await
        .map_err(|e| format!("Could not read the response: {e}"))?;

    let start: StartResponse = serde_json::from_str(&body).unwrap_or_default();

    if !start.ok {
        return Err(start
            .message
            .or(start.error)
            .unwrap_or_else(|| format!("Sign-in unavailable (HTTP {}).", status.as_u16())));
    }

    let (device_code, user_code, login_url) = match (start.device_code, start.user_code, start.login_url) {
        (Some(d), Some(u), Some(l)) => (d, u, l),
        _ => return Err("Incomplete response from server.".into()),
    };

    if let Ok(mut p) = app.state::<AuthState>().pending.lock() {
        *p = Some(device_code.clone());
    }


    let browser_opened = match tauri_plugin_opener::open_url(&login_url, None::<&str>) {
        Ok(()) => true,
        Err(e) => {
            eprintln!("ZFeedback: could not open browser: {e}");
            false
        }
    };

    let _ = app.emit(
        "auth:progress",
        LoginProgress::Waiting {
            user_code: user_code.clone(),
            login_url: login_url.clone(),
            browser_opened,
        },
    );

    let interval = start.interval.unwrap_or(2).clamp(1, 10);
    poll_until_done(app, device_code, interval);
    Ok(())
}


#[tauri::command]
pub fn auth_cancel(app: AppHandle) {
    if let Ok(mut p) = app.state::<AuthState>().pending.lock() {
        *p = None;
    }
}

fn poll_until_done(app: AppHandle, device_code: String, interval: u64) {
    tauri::async_runtime::spawn(async move {
        let deadline = std::time::Instant::now() + Duration::from_secs(600);

        loop {
            tokio::time::sleep(Duration::from_secs(interval)).await;


            let still_pending = app
                .state::<AuthState>()
                .pending
                .lock()
                .map(|p| p.as_deref() == Some(device_code.as_str()))
                .unwrap_or(false);
            if !still_pending {
                return;
            }

            if std::time::Instant::now() > deadline {
                finish(&app, LoginProgress::Expired);
                return;
            }

            let Ok(client) = client(&app) else { continue };

            let res = client
                .post(format!("{API_BASE}/auth/poll"))
                .json(&serde_json::json!({ "device_code": device_code }))
                .send()
                .await;

            let Ok(res) = res else {


                continue;
            };

            let Ok(poll): Result<PollResponse, _> = res.json().await else { continue };

            if !poll.ok {
                if poll.error.as_deref() == Some("maintenance") {
                    finish(&app, LoginProgress::Failed {
                        message: "ZFeedback is not open yet.".into(),
                    });
                    return;
                }
                continue;
            }

            match poll.status.as_deref() {
                Some("pending") => {}
                Some("needs_guild") => {


                    let _ = app.emit(
                        "auth:progress",
                        LoginProgress::NeedsGuild {
                            discord_invite: poll
                                .discord_invite
                                .unwrap_or_else(|| "https://discord.gg/wmPWPSnaAW".into()),
                            message: poll.message.unwrap_or_else(|| {
                                "Join the ZSync.eu Discord server, then sign in again.".into()
                            }),
                        },
                    );
                }
                Some("verifying") => {
                    let _ = app.emit("auth:progress", LoginProgress::Verifying);
                }
                Some("approved") => {
                    match (poll.token, poll.user) {
                        (Some(token), Some(user)) => {
                            if let Err(e) = store_token(&token) {


                                eprintln!("ZFeedback: {e}");
                                finish(&app, LoginProgress::Failed {
                                    message: "Signed in, but your system keychain is unavailable so \
                                              the session cannot be saved. Install a keyring service \
                                              (gnome-keyring or kwallet) and try again."
                                        .into(),
                                });
                                return;
                            }
                            let state = app.state::<AuthState>();
                            if let Ok(mut guard) = state.token.lock() {
                                *guard = Some(token);
                            }


                            if let Ok(mut guard) = state.signed_out.lock() {
                                *guard = false;
                            }
                            finish(&app, LoginProgress::Approved { user });
                        }
                        _ => finish(&app, LoginProgress::Failed {
                            message: "Server approved the sign-in but returned no token.".into(),
                        }),
                    }
                    return;
                }
                Some("expired") | None => {
                    finish(&app, LoginProgress::Expired);
                    return;
                }
                Some(other) => {
                    eprintln!("ZFeedback: unknown auth status {other}");
                }
            }
        }
    });
}

fn finish(app: &AppHandle, progress: LoginProgress) {
    if let Ok(mut p) = app.state::<AuthState>().pending.lock() {
        *p = None;
    }
    let _ = app.emit("auth:progress", progress);
}


fn hostname_label() -> String {
    std::env::var("HOSTNAME")
        .ok()
        .or_else(|| std::env::var("COMPUTERNAME").ok())
        .or_else(|| {
            std::fs::read_to_string("/etc/hostname")
                .ok()
                .map(|s| s.trim().to_string())
        })
        .filter(|s| !s.is_empty())
        .map(|h| format!("{h} ({})", std::env::consts::OS))
        .unwrap_or_else(|| format!("ZFeedback ({})", std::env::consts::OS))
}
