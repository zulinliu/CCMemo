use std::collections::HashMap;
use std::path::{Path, PathBuf};

use walkdir::WalkDir;

use crate::domain::error::Result;
use crate::domain::types::ProjectIdentity;

#[derive(Debug, Clone)]
pub struct DiscoveredProject {
    pub encoded_folder: String,
    pub real_path: PathBuf,
    pub jsonl_files: Vec<PathBuf>,
}

pub struct ProjectDiscovery {
    claude_projects_dir: PathBuf,
}

impl ProjectDiscovery {
    pub fn new(claude_config_dir: &Path) -> Self {
        Self {
            claude_projects_dir: claude_config_dir.join("projects"),
        }
    }

    pub fn discover_all(&self) -> Result<Vec<DiscoveredProject>> {
        if !self.claude_projects_dir.exists() {
            return Ok(Vec::new());
        }

        let mut projects: HashMap<String, DiscoveredProject> = HashMap::new();

        for entry in std::fs::read_dir(&self.claude_projects_dir)? {
            let entry = entry?;
            let path = entry.path();
            if !path.is_dir() {
                continue;
            }

            let folder_name = match path.file_name().and_then(|n| n.to_str()) {
                Some(name) => name.to_string(),
                None => continue,
            };

            let real_path = decode_folder_name(&folder_name);
            let jsonl_files = self.find_jsonl_files(&path);

            if !jsonl_files.is_empty() {
                projects.insert(
                    folder_name.clone(),
                    DiscoveredProject {
                        encoded_folder: folder_name,
                        real_path,
                        jsonl_files,
                    },
                );
            }
        }

        let mut result: Vec<DiscoveredProject> = projects.into_values().collect();
        result.sort_by(|a, b| a.encoded_folder.cmp(&b.encoded_folder));
        Ok(result)
    }

    pub fn to_project_identity(discovered: &DiscoveredProject, existing: Option<&ProjectIdentity>) -> ProjectIdentity {
        let id = existing.map(|p| p.id.clone()).unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
        let name = discovered.real_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or(&discovered.encoded_folder)
            .to_string();

        let normalized_path = discovered.real_path.to_string_lossy().to_string();
        let last_active_at = chrono::Utc::now().to_rfc3339();

        ProjectIdentity {
            id,
            name,
            real_path: discovered.real_path.to_string_lossy().to_string(),
            normalized_path,
            encoded_folder: discovered.encoded_folder.clone(),
            git_remote: existing.and_then(|p| p.git_remote.clone()),
            last_active_at,
        }
    }

    fn find_jsonl_files(&self, dir: &Path) -> Vec<PathBuf> {
        let mut files = Vec::new();

        for entry in WalkDir::new(dir)
            .follow_links(false)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            let path = entry.into_path();
            if path.extension().and_then(|e| e.to_str()) == Some("jsonl") {
                // Skip subagent files for now - index main sessions first
                if path.to_string_lossy().contains("/subagents/") {
                    continue;
                }
                files.push(path);
            }
        }

        files.sort();
        files
    }
}

fn decode_folder_name(encoded: &str) -> PathBuf {
    let decoded = encoded
        .strip_prefix('-')
        .unwrap_or(encoded)
        .replace('-', "/");
    PathBuf::from(format!("/{decoded}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decode_folder_name_simple() {
        let path = decode_folder_name("-home-liuzl-agent-CCMemo");
        assert_eq!(path, PathBuf::from("/home/liuzl/agent/CCMemo"));
    }

    #[test]
    fn decode_folder_name_without_dash() {
        let path = decode_folder_name("some-project");
        assert_eq!(path, PathBuf::from("/some/project"));
    }
}
