

use crate::models::{slugify, Catalogue, CatalogueResponse, Project};
use std::path::PathBuf;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};

const CATALOGUE_URL: &str = "https://zsync.eu/projects.php";
const CACHE_FILE: &str = "catalogue.json";


const MAX_AGE_SECS: i64 = 60 * 60 * 6;

fn now() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

fn cache_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("no app data dir: {e}"))?;
    std::fs::create_dir_all(&dir).map_err(|e| format!("cannot create data dir: {e}"))?;
    Ok(dir.join(CACHE_FILE))
}

fn read_cache(app: &AppHandle) -> Option<Catalogue> {
    let path = cache_path(app).ok()?;
    let raw = std::fs::read_to_string(path).ok()?;
    serde_json::from_str::<Catalogue>(&raw).ok()
}

fn write_cache(app: &AppHandle, cat: &Catalogue) {
    let Ok(path) = cache_path(app) else { return };


    let tmp = path.with_extension("json.tmp");
    if let Ok(json) = serde_json::to_string(cat) {
        if std::fs::write(&tmp, json).is_ok() {
            let _ = std::fs::rename(&tmp, &path);
        }
    }
}


async fn fetch(app: &AppHandle) -> Result<Catalogue, String> {
    let version = app.package_info().version.to_string();

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(15))
        .user_agent(format!("ZFeedback/{version}"))
        .build()
        .map_err(|e| format!("client: {e}"))?;

    let res = client
        .get(CATALOGUE_URL)
        .send()
        .await
        .map_err(|e| format!("request failed: {e}"))?;

    if !res.status().is_success() {
        return Err(format!("catalogue returned HTTP {}", res.status()));
    }

    let body: CatalogueResponse = res
        .json()
        .await
        .map_err(|e| format!("catalogue is not valid JSON: {e}"))?;

    let projects: Vec<Project> = body
        .projects
        .into_iter()
        .filter(|p| !p.title.trim().is_empty())
        .map(|mut p| {
            p.slug = slugify(&p.title);
            p
        })
        .filter(|p| !p.slug.is_empty())
        .collect();

    if projects.is_empty() {


        return Err("catalogue came back empty".into());
    }

    Ok(Catalogue {
        count: projects.len(),
        projects,
        fetched_at: now(),
        stale: false,
    })
}


#[tauri::command]
pub fn catalogue_cached(app: AppHandle) -> Option<Catalogue> {
    read_cache(&app).map(|mut c| {
        c.stale = now() - c.fetched_at > MAX_AGE_SECS;
        c
    })
}


#[tauri::command]
pub async fn catalogue_refresh(app: AppHandle) -> Result<Catalogue, String> {
    match fetch(&app).await {
        Ok(cat) => {
            write_cache(&app, &cat);
            Ok(cat)
        }
        Err(e) => match read_cache(&app) {
            Some(mut cached) => {
                cached.stale = true;
                Ok(cached)
            }
            None => Err(e),
        },
    }
}


pub fn refresh_in_background(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        match fetch(&app).await {
            Ok(cat) => {
                write_cache(&app, &cat);
                let _ = app.emit("catalogue:updated", &cat);
            }
            Err(e) => {


                eprintln!("ZFeedback: background catalogue refresh failed: {e}");
                let _ = app.emit("catalogue:offline", e);
            }
        }
    });
}
