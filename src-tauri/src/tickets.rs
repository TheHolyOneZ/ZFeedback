

use crate::auth::api_request;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;


#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TicketContext {
    pub app_version: String,
    pub os: String,
    pub arch: String,
    pub locale: String,
}

#[tauri::command]
pub fn ticket_context(app: AppHandle, locale: Option<String>) -> TicketContext {
    TicketContext {
        app_version: app.package_info().version.to_string(),
        os: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        locale: locale.unwrap_or_else(|| "unknown".into()),
    }
}

#[tauri::command]
pub async fn ticket_create(
    app: AppHandle,
    kind: String,
    project: Option<String>,
    title: String,
    body: String,
    context: TicketContext,
    is_public: Option<bool>,
) -> Result<serde_json::Value, String> {
    let mut payload = serde_json::json!({
        "type": kind,
        "title": title,
        "body": body,
        "context": context,


        "public": is_public.unwrap_or(false),
    });


    if let Some(slug) = project.filter(|s| !s.is_empty()) {
        payload["project"] = serde_json::Value::String(slug);
    }

    api_request(&app, reqwest::Method::POST, "/tickets/create", Some(payload)).await
}

#[tauri::command]
pub async fn tickets_mine(
    app: AppHandle,
    page: Option<u32>,
    filter: Option<String>,
    kind: Option<String>,
    q: Option<String>,
) -> Result<serde_json::Value, String> {
    let mut path = format!("/tickets/mine?page={}", page.unwrap_or(1));
    if let Some(f) = filter.filter(|f| !f.is_empty()) {
        path.push_str(&format!("&filter={}", urlencode(&f)));
    }


    if let Some(k) = kind.filter(|k| !k.is_empty()) {
        path.push_str(&format!("&type={}", urlencode(&k)));
    }
    if let Some(term) = q.filter(|s| !s.trim().is_empty()) {
        path.push_str(&format!("&q={}", urlencode(&term)));
    }
    api_request(&app, reqwest::Method::GET, &path, None).await
}


#[tauri::command]
pub async fn ticket_withdraw(
    app: AppHandle,
    reference: String,
    reason: Option<String>,
) -> Result<serde_json::Value, String> {
    api_request(
        &app,
        reqwest::Method::POST,
        "/tickets/withdraw",
        Some(serde_json::json!({ "ref": reference, "reason": reason })),
    )
    .await
}


#[tauri::command]
pub async fn ticket_edit(
    app: AppHandle,
    reference: String,
    title: String,
    body: String,
) -> Result<serde_json::Value, String> {
    api_request(
        &app,
        reqwest::Method::POST,
        "/tickets/edit",
        Some(serde_json::json!({ "ref": reference, "title": title, "body": body })),
    )
    .await
}


#[tauri::command]
pub async fn ticket_publish(
    app: AppHandle,
    reference: String,
    public: bool,
) -> Result<serde_json::Value, String> {
    api_request(
        &app,
        reqwest::Method::POST,
        "/tickets/publish",
        Some(serde_json::json!({ "ref": reference, "public": public })),
    )
    .await
}

#[tauri::command]
pub async fn ticket_get(app: AppHandle, reference: String) -> Result<serde_json::Value, String> {
    api_request(
        &app,
        reqwest::Method::GET,
        &format!("/tickets/get?ref={}", urlencode(&reference)),
        None,
    )
    .await
}

#[tauri::command]
pub async fn ticket_reply(
    app: AppHandle,
    reference: String,
    body: String,
) -> Result<serde_json::Value, String> {
    api_request(
        &app,
        reqwest::Method::POST,
        "/tickets/reply",
        Some(serde_json::json!({ "ref": reference, "body": body })),
    )
    .await
}

#[tauri::command]
pub async fn ticket_vote(app: AppHandle, reference: String) -> Result<serde_json::Value, String> {
    api_request(
        &app,
        reqwest::Method::POST,
        "/tickets/vote",
        Some(serde_json::json!({ "ref": reference })),
    )
    .await
}


#[tauri::command]
pub async fn tickets_similar(
    app: AppHandle,
    q: String,
    kind: String,
    project: Option<String>,
) -> Result<serde_json::Value, String> {
    let mut path = format!("/tickets/similar?q={}&type={}", urlencode(&q), urlencode(&kind));
    if let Some(slug) = project.filter(|s| !s.is_empty()) {
        path.push_str(&format!("&project={}", urlencode(&slug)));
    }
    api_request(&app, reqwest::Method::GET, &path, None).await
}


#[tauri::command]
pub async fn ticket_projects(app: AppHandle) -> Result<serde_json::Value, String> {
    api_request(&app, reqwest::Method::GET, "/projects", None).await
}


#[tauri::command]
pub async fn feed_updates(app: AppHandle, since: Option<String>) -> Result<serde_json::Value, String> {
    let path = match since.filter(|s| !s.is_empty()) {
        Some(s) => format!("/feed/updates?since={}", urlencode(&s)),
        None => "/feed/updates".to_string(),
    };
    api_request(&app, reqwest::Method::GET, &path, None).await
}


fn urlencode(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for b in s.bytes() {
        match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(b as char)
            }
            _ => out.push_str(&format!("%{b:02X}")),
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::urlencode;

    #[test]
    fn encodes_query_values() {
        assert_eq!(urlencode("ZFTM-142"), "ZFTM-142");
        assert_eq!(urlencode("needs_reply"), "needs_reply");
        assert_eq!(urlencode("2026-08-11T12:00:00Z"), "2026-08-11T12%3A00%3A00Z");
        assert_eq!(urlencode("a&b=c"), "a%26b%3Dc");
    }
}


#[tauri::command]
pub async fn rating_submit(
    app: AppHandle,
    project: Option<String>,
    stars: u8,
    comment: Option<String>,
) -> Result<serde_json::Value, String> {
    let mut payload = serde_json::json!({
        "stars": stars,
        "app_version": app.package_info().version.to_string(),
    });

    if let Some(slug) = project.filter(|s| !s.is_empty()) {
        payload["project"] = serde_json::Value::String(slug);
    }
    if let Some(text) = comment.filter(|s| !s.trim().is_empty()) {
        payload["comment"] = serde_json::Value::String(text);
    }

    api_request(&app, reqwest::Method::POST, "/ratings/submit", Some(payload)).await
}


#[tauri::command]
pub async fn rating_mine(app: AppHandle, project: Option<String>) -> Result<serde_json::Value, String> {
    let path = match project.filter(|s| !s.is_empty()) {
        Some(slug) => format!("/ratings/mine?project={}", urlencode(&slug)),
        None => "/ratings/mine".to_string(),
    };
    api_request(&app, reqwest::Method::GET, &path, None).await
}


#[tauri::command]
pub async fn public_requests(
    app: AppHandle,
    sort: Option<String>,
    q: Option<String>,
    mine: Option<bool>,
) -> Result<serde_json::Value, String> {
    let mut path = format!("/requests/list?sort={}", urlencode(&sort.unwrap_or_else(|| "top".into())));
    if let Some(term) = q.filter(|s| !s.trim().is_empty()) {
        path.push_str(&format!("&q={}", urlencode(&term)));
    }


    if mine.unwrap_or(false) {
        path.push_str("&mine=1");
    }
    api_request(&app, reqwest::Method::GET, &path, None).await
}


#[tauri::command]
pub async fn attachment_upload(
    app: AppHandle,
    reference: String,
    name: String,
    data: String,
) -> Result<serde_json::Value, String> {
    api_request(
        &app,
        reqwest::Method::POST,
        "/attachments/upload",
        Some(serde_json::json!({ "ref": reference, "name": name, "data": data })),
    )
    .await
}


#[tauri::command]
pub async fn attachment_data(app: AppHandle, id: u32) -> Result<serde_json::Value, String> {
    use base64::Engine;

    let token = crate::auth::current_token(&app).ok_or_else(|| "not_signed_in".to_string())?;
    let client = crate::auth::client(&app)?;

    let res = client
        .get(format!("{}/attachments/get?id={}", crate::auth::API_BASE, id))
        .bearer_auth(token)
        .send()
        .await
        .map_err(|e| format!("network: {e}"))?;

    if !res.status().is_success() {


        let code = res
            .json::<serde_json::Value>()
            .await
            .ok()
            .and_then(|v| v["error"].as_str().map(str::to_owned))
            .unwrap_or_else(|| "not_found".into());
        return Err(format!("{code}: That image could not be loaded."));
    }

    let mime = res
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("image/png")
        .to_owned();

    let bytes = res.bytes().await.map_err(|e| format!("network: {e}"))?;

    Ok(serde_json::json!({
        "mime": mime,
        "data": base64::engine::general_purpose::STANDARD.encode(&bytes),
    }))
}
