use std::time::Duration;

const TIMEOUT_SECS: u64 = 15;
const MAX_LEN: usize = 50_000;
/// Realistischer Browser-User-Agent — viele (News-)Seiten blocken generische
/// Bot-User-Agents mit 403.
const USER_AGENT: &str =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/// Lädt eine URL server-seitig (umgeht CORS) und liefert den Lesetext zurück.
/// HTML wird zu Klartext bereinigt; reiner Text wird unverändert (gekappt) zurückgegeben.
#[tauri::command]
pub async fn fetch_url(url: String) -> Result<String, String> {
    let url = url.trim().to_string();
    if !looks_like_url(&url) {
        return Err("Bitte eine vollständige URL mit http:// oder https:// angeben.".to_string());
    }

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(TIMEOUT_SECS))
        .user_agent(USER_AGENT)
        .build()
        .map_err(|e| format!("HTTP-Client-Fehler: {}", e))?;

    let resp = client
        .get(&url)
        .header(
            reqwest::header::ACCEPT,
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        )
        .header(reqwest::header::ACCEPT_LANGUAGE, "de-AT,de;q=0.9,en;q=0.8")
        .send()
        .await
        .map_err(|e| format!("Seite konnte nicht geladen werden: {}", e))?;

    if !resp.status().is_success() {
        return Err(format!("Server antwortete mit Status {}.", resp.status().as_u16()));
    }

    let content_type = resp
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .to_lowercase();

    let body = resp
        .text()
        .await
        .map_err(|e| format!("Antwort konnte nicht gelesen werden: {}", e))?;

    let is_html = content_type.contains("text/html")
        || content_type.contains("application/xhtml")
        || content_type.contains("application/xml")
        || content_type.contains("text/xml")
        || content_type.is_empty();
    let is_plain = content_type.contains("text/plain");

    let text = if is_html {
        // Auf den Hauptinhalt fokussieren: das textreichste <article>/<main>-Element.
        // Das verwirft Navigation, „Skip to content"-Links, Menüs und Footer-Boilerplate.
        let scoped = largest_element(&body, "article")
            .or_else(|| largest_element(&body, "main"))
            .unwrap_or(body);
        strip_html(&scoped)
    } else if is_plain || content_type.starts_with("text/") {
        body
    } else {
        return Err(format!(
            "Nicht unterstützter Inhaltstyp ({}). Es werden HTML- und Textseiten unterstützt.",
            if content_type.is_empty() { "unbekannt" } else { &content_type }
        ));
    };

    let text = cap(&text, MAX_LEN);
    if text.trim().is_empty() {
        return Err("Auf der Seite wurde kein lesbarer Text gefunden.".to_string());
    }
    Ok(text)
}

fn looks_like_url(url: &str) -> bool {
    let u = url.to_lowercase();
    (u.starts_with("http://") || u.starts_with("https://")) && url.len() > 10
}

fn cap(s: &str, max: usize) -> String {
    if s.chars().count() <= max {
        return s.to_string();
    }
    let mut out: String = s.chars().take(max).collect();
    out.push_str("\n[... gekürzt]");
    out
}

/// Entfernt Script-/Style-/Navigations-Elemente, wandelt Block-Tags in
/// Zeilen-/Absatzumbrüche um, strippt restliche Tags und dekodiert die
/// gängigsten HTML-Entities. Bewusst leichtgewichtig (kein HTML-Parser).
pub fn strip_html(html: &str) -> String {
    let mut s = html.to_string();

    // Ganze Elemente samt Inhalt verwerfen (Navigation, Kopf-/Fußzeilen, Formulare …).
    for tag in [
        "script", "style", "head", "nav", "header", "footer", "aside", "form",
        "noscript", "svg", "button",
    ] {
        s = remove_element(&s, tag);
    }

    // HTML-Kommentare entfernen.
    s = remove_between(&s, "<!--", "-->");

    // Block-/Zeilenumbrüche markieren, bevor Tags gestrippt werden.
    // UTF-8-sicher über Byte-Offsets aus `find` (immer an Zeichengrenzen).
    let mut out = String::with_capacity(s.len());
    let mut rest = s.as_str();
    loop {
        match rest.find('<') {
            None => {
                out.push_str(rest);
                break;
            }
            Some(pos) => {
                out.push_str(&rest[..pos]);
                let after = &rest[pos..];
                // Nur den Tag-Anfang kleinschreiben (genug für den Tagnamen).
                let head: String = after.chars().take(12).collect::<String>().to_lowercase();
                let is_break = head.starts_with("</p")
                    || head.starts_with("<br")
                    || head.starts_with("</div")
                    || head.starts_with("</li")
                    || head.starts_with("</tr")
                    || head.starts_with("</h1")
                    || head.starts_with("</h2")
                    || head.starts_with("</h3")
                    || head.starts_with("</h4")
                    || head.starts_with("</h5")
                    || head.starts_with("</h6")
                    || head.starts_with("</section")
                    || head.starts_with("</article");
                out.push(if is_break { '\n' } else { ' ' });
                match after.find('>') {
                    None => {
                        rest = "";
                    }
                    Some(gt) => {
                        rest = &after[gt + 1..];
                    }
                }
            }
        }
    }

    let decoded = decode_entities(&out);
    normalize_whitespace(&decoded)
}

/// Prüft, ob nach `<tag` ein gültiger Tag-Abschluss folgt (`>`, `/`, Whitespace).
/// Verhindert Fehltreffer wie `<header>` für tag="head" oder `<navbar>` für "nav".
fn is_tag_boundary(s: &str, after: usize) -> bool {
    match s[after..].chars().next() {
        Some(c) => c == '>' || c == '/' || c == ' ' || c == '\t' || c == '\n' || c == '\r',
        None => false,
    }
}

/// Findet das nächste echte öffnende `<tag` ab `from` (mit Tag-Grenzen-Prüfung).
fn find_tag_open(lower: &str, s: &str, from: usize, open: &str) -> Option<usize> {
    let mut p = from;
    while let Some(rel) = lower[p..].find(open) {
        let pos = p + rel;
        let after = pos + open.len();
        if is_tag_boundary(s, after) {
            return Some(pos);
        }
        p = after;
    }
    None
}

/// Entfernt alle `<tag ...> ... </tag>`-Elemente samt Inhalt (Tag-Grenzen-bewusst).
/// Fehlt ein schließendes Tag, wird nur das öffnende Tag übersprungen (Rest bleibt erhalten).
fn remove_element(s: &str, tag: &str) -> String {
    let lower = s.to_lowercase();
    let open_needle = format!("<{}", tag);
    let close_needle = format!("</{}>", tag);
    let mut result = String::with_capacity(s.len());
    let mut cursor = 0usize;
    loop {
        match find_tag_open(&lower, s, cursor, &open_needle) {
            None => {
                result.push_str(&s[cursor..]);
                break;
            }
            Some(open) => {
                let after = open + open_needle.len();
                result.push_str(&s[cursor..open]);
                match lower[after..].find(&close_needle) {
                    None => {
                        // Kein passendes Close → nur das offene Tag bis '>' überspringen.
                        match s[open..].find('>') {
                            Some(gt) => cursor = open + gt + 1,
                            None => break,
                        }
                    }
                    Some(rel_close) => {
                        cursor = after + rel_close + close_needle.len();
                    }
                }
            }
        }
    }
    result
}

/// Liefert das textreichste `<tag>…</tag>`-Element (verschachtelungs-bewusst) als HTML.
fn largest_element(s: &str, tag: &str) -> Option<String> {
    let lower = s.to_lowercase();
    let open = format!("<{}", tag);
    let close = format!("</{}>", tag);
    let mut best: Option<(usize, String)> = None;
    let mut search = 0usize;

    while let Some(start) = find_tag_open(&lower, s, search, &open) {
        let body_start = match s[start..].find('>') {
            Some(p) => start + p + 1,
            None => break,
        };
        // Bis zum passenden schließenden Tag laufen (Tiefe zählen).
        let mut depth = 1i32;
        let mut cursor = body_start;
        let mut end: Option<usize> = None;
        loop {
            let next_open = find_tag_open(&lower, s, cursor, &open);
            let next_close = lower[cursor..].find(&close).map(|p| cursor + p);
            match (next_open, next_close) {
                (_, None) => break,
                (Some(no), Some(nc)) if no < nc => {
                    depth += 1;
                    cursor = no + open.len();
                }
                (_, Some(nc)) => {
                    depth -= 1;
                    cursor = nc + close.len();
                    if depth == 0 {
                        end = Some(cursor);
                        break;
                    }
                }
            }
        }
        match end {
            Some(e) => {
                let html = s[start..e].to_string();
                let text_len = strip_html(&html).chars().count();
                if best.as_ref().map_or(true, |(l, _)| text_len > *l) {
                    best = Some((text_len, html));
                }
                search = e;
            }
            None => search = body_start,
        }
    }
    best.map(|(_, h)| h)
}

fn remove_between(s: &str, start: &str, end: &str) -> String {
    let mut result = String::with_capacity(s.len());
    let mut cursor = 0usize;
    loop {
        match s[cursor..].find(start) {
            None => {
                result.push_str(&s[cursor..]);
                break;
            }
            Some(rel) => {
                let begin = cursor + rel;
                result.push_str(&s[cursor..begin]);
                match s[begin..].find(end) {
                    None => break,
                    Some(rel_end) => {
                        cursor = begin + rel_end + end.len();
                    }
                }
            }
        }
    }
    result
}

fn decode_entities(s: &str) -> String {
    s.replace("&nbsp;", " ")
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
        .replace("&apos;", "'")
        .replace("&auml;", "ä")
        .replace("&ouml;", "ö")
        .replace("&uuml;", "ü")
        .replace("&Auml;", "Ä")
        .replace("&Ouml;", "Ö")
        .replace("&Uuml;", "Ü")
        .replace("&szlig;", "ß")
        .replace("&ndash;", "–")
        .replace("&mdash;", "—")
        .replace("&hellip;", "…")
        .replace("&laquo;", "«")
        .replace("&raquo;", "»")
}

/// Typische Accessibility-/Navigations-Floskeln, die als eigene Zeile übrig bleiben.
fn is_boilerplate(line: &str) -> bool {
    const PHRASES: &[&str] = &[
        "skip to content",
        "skip to main content",
        "skip to main",
        "skip to navigation",
        "skip navigation",
        "zum inhalt springen",
        "zum hauptinhalt springen",
        "direkt zum inhalt",
        "zur navigation springen",
        "zur suche springen",
    ];
    let t = line.trim().to_lowercase();
    PHRASES.contains(&t.as_str())
}

fn normalize_whitespace(s: &str) -> String {
    let mut lines: Vec<String> = Vec::new();
    for line in s.split('\n') {
        // Mehrfach-Leerzeichen/Tabs zu einem zusammenfassen.
        let collapsed = line.split_whitespace().collect::<Vec<_>>().join(" ");
        // Bekannte Skip-/Navigations-Floskeln verwerfen.
        if is_boilerplate(&collapsed) {
            continue;
        }
        lines.push(collapsed);
    }
    // Mehr als eine Leerzeile zu einer (= Absatztrenner) zusammenfassen.
    let mut out: Vec<String> = Vec::new();
    let mut blank_run = 0;
    for l in lines {
        if l.is_empty() {
            blank_run += 1;
            if blank_run <= 1 {
                out.push(String::new());
            }
        } else {
            blank_run = 0;
            out.push(l);
        }
    }
    out.join("\n").trim().to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn rejects_url_without_scheme() {
        let r = fetch_url("example.com".to_string()).await;
        assert!(r.is_err());
        assert!(r.unwrap_err().contains("http"));
    }

    #[tokio::test]
    async fn rejects_empty_url() {
        let r = fetch_url("".to_string()).await;
        assert!(r.is_err());
    }

    #[test]
    fn looks_like_url_works() {
        assert!(looks_like_url("https://example.com"));
        assert!(looks_like_url("http://example.com/path"));
        assert!(!looks_like_url("ftp://example.com"));
        assert!(!looks_like_url("example.com"));
        assert!(!looks_like_url("http://"));
    }

    #[test]
    fn strip_html_removes_script_and_style() {
        let html = "<html><head><style>body{color:red}</style></head>\
            <body><script>alert('x')</script><p>Hallo Welt</p></body></html>";
        let text = strip_html(html);
        assert!(text.contains("Hallo Welt"));
        assert!(!text.contains("alert"));
        assert!(!text.contains("color:red"));
    }

    #[test]
    fn strip_html_keeps_paragraph_breaks() {
        let html = "<p>Erster Absatz.</p><p>Zweiter Absatz.</p>";
        let text = strip_html(html);
        assert!(text.contains("Erster Absatz."));
        assert!(text.contains("Zweiter Absatz."));
        // Zwischen den Absätzen mindestens ein Umbruch.
        assert!(text.contains('\n'));
    }

    #[test]
    fn strip_html_decodes_entities() {
        let html = "<p>M&uuml;ller &amp; S&ouml;hne</p>";
        let text = strip_html(html);
        assert_eq!(text, "Müller & Söhne");
    }

    #[test]
    fn strip_html_collapses_whitespace() {
        let html = "<p>viel     Abstand\n\n\n\nund Leerzeilen</p>";
        let text = strip_html(html);
        assert!(!text.contains("     "));
        assert!(!text.contains("\n\n\n"));
    }

    #[test]
    fn largest_element_picks_article_content() {
        let html = "<body><nav><a>Menü</a><a>Login</a></nav>\
            <article><p>Der eigentliche Artikeltext steht hier und ist lang genug.</p></article>\
            <footer>Impressum</footer></body>";
        let art = largest_element(html, "article").expect("article found");
        let text = strip_html(&art);
        assert!(text.contains("eigentliche Artikeltext"));
        assert!(!text.contains("Menü"));
        assert!(!text.contains("Impressum"));
    }

    #[test]
    fn strip_html_drops_skip_to_content() {
        let html = "<div>Skip to content</div><div>Zum Inhalt springen</div><p>Echter Text.</p>";
        let text = strip_html(html);
        assert!(text.contains("Echter Text."));
        assert!(!text.to_lowercase().contains("skip to content"));
        assert!(!text.to_lowercase().contains("zum inhalt springen"));
    }

    #[test]
    fn strip_html_removes_header_keeps_body() {
        let html = "<html><head><title>Titel</title></head>\
            <body><header><a>Logo</a></header><p>Inhalt bleibt.</p></body></html>";
        let text = strip_html(html);
        assert!(text.contains("Inhalt bleibt."));
        assert!(!text.contains("Logo"));
        assert!(!text.contains("Titel"));
    }
}
