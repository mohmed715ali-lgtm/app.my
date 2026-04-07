use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_prompts_table",
            sql: "CREATE TABLE IF NOT EXISTS prompts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL DEFAULT '',
                content TEXT NOT NULL DEFAULT '',
                tags TEXT NOT NULL DEFAULT '[]',
                is_favorite INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE INDEX IF NOT EXISTS idx_prompts_title ON prompts(title);
            CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts(created_at);
            CREATE INDEX IF NOT EXISTS idx_prompts_updated_at ON prompts(updated_at);
            CREATE INDEX IF NOT EXISTS idx_prompts_is_favorite ON prompts(is_favorite);",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_settings_table",
            sql: "CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL DEFAULT ''
            );
            INSERT OR IGNORE INTO settings (key, value) VALUES ('theme', 'dark');
            INSERT OR IGNORE INTO settings (key, value) VALUES ('language', 'ar');
            INSERT OR IGNORE INTO settings (key, value) VALUES ('font_size', '16');
            INSERT OR IGNORE INTO settings (key, value) VALUES ('auto_save', 'true');
            INSERT OR IGNORE INTO settings (key, value) VALUES ('view_mode', 'grid');",
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:715.db", migrations)
                .build(),
        )
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
