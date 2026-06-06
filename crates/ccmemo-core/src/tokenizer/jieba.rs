use jieba_rs::Jieba;
use std::sync::LazyLock;

static JIEBA: LazyLock<Jieba> = LazyLock::new(Jieba::new);

/// Tokenize Chinese text for FTS5 pre-tokenization.
/// Returns space-separated tokens suitable for the content_zh FTS5 column.
pub fn tokenize_for_fts(text: &str) -> String {
    if text.is_empty() {
        return String::new();
    }
    let tokens = JIEBA.cut(text, false);
    tokens
        .into_iter()
        .filter(|t| !t.trim().is_empty())
        .collect::<Vec<_>>()
        .join(" ")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_chinese_tokenization() {
        let result = tokenize_for_fts("错误处理机制");
        assert!(result.contains("错误"), "should contain '错误'");
        assert!(result.contains("处理"), "should contain '处理'");
        assert!(result.contains("机制"), "should contain '机制'");
    }

    #[test]
    fn test_mixed_chinese_english() {
        let result = tokenize_for_fts("使用Rust开发API");
        assert!(!result.is_empty());
        assert!(result.contains("使用"));
        assert!(result.contains("开发"));
    }

    #[test]
    fn test_empty_string() {
        let result = tokenize_for_fts("");
        assert!(result.is_empty());
    }

    #[test]
    fn test_english_only() {
        let result = tokenize_for_fts("hello world");
        assert!(!result.is_empty());
    }
}
