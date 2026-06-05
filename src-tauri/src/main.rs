#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use lehrunterlagen_tool::commands::{llm, keys, pdf};

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            llm::llm_complete,
            keys::save_api_key,
            keys::load_api_key,
            keys::delete_api_key,
            pdf::convert_pdf,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
