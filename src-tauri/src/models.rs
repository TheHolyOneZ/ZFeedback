

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Link {
    pub label: String,
    pub url: String,
    #[serde(default)]
    pub primary: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub title: String,
    #[serde(default)]
    pub category: Option<String>,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub url: Option<String>,
    #[serde(default)]
    pub links: Vec<Link>,


    #[serde(default)]
    pub slug: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Catalogue {
    pub projects: Vec<Project>,
    pub count: usize,


    pub fetched_at: i64,

    #[serde(default)]
    pub stale: bool,
}

#[derive(Debug, Deserialize)]
pub struct CatalogueResponse {
    pub projects: Vec<Project>,
}


pub fn slugify(title: &str) -> String {
    let lowered = title.to_lowercase();
    let expanded = lowered.replace('&', " and ").replace('+', " and ");

    let mut out = String::with_capacity(expanded.len());
    let mut last_dash = true;

    for ch in expanded.chars() {
        if ch.is_ascii_alphanumeric() {
            out.push(ch);
            last_dash = false;
        } else if !last_dash {
            out.push('-');
            last_dash = true;
        }
    }

    out.trim_matches('-').to_string()
}

#[cfg(test)]
mod tests {
    use super::slugify;


    #[test]
    fn matches_backend_slugs() {
        assert_eq!(slugify("ZPad"), "zpad");
        assert_eq!(slugify("ZBase Studio"), "zbase-studio");
        assert_eq!(slugify("Z-Stego"), "z-stego");
        assert_eq!(slugify("QR Gen"), "qr-gen");
        assert_eq!(slugify("ZFileTimeMachine"), "zfiletimemachine");
        assert_eq!(slugify("Z-Code Snippets"), "z-code-snippets");
        assert_eq!(slugify("ZMetadata Stripper"), "zmetadata-stripper");
        assert_eq!(slugify("Zoryx Discord Bot Framework"), "zoryx-discord-bot-framework");
        assert_eq!(slugify("Background Clicker"), "background-clicker");
        assert_eq!(slugify("GrammarFixer AI"), "grammarfixer-ai");
    }

    #[test]
    fn handles_edges() {
        assert_eq!(slugify("  spaced  out  "), "spaced-out");
        assert_eq!(slugify("A & B"), "a-and-b");
        assert_eq!(slugify("C++ Tool"), "c-and-and-tool");
        assert_eq!(slugify("---"), "");
    }
}
