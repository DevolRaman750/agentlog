package github

import (
    "context"
    "io"
    "log"
    "net/http"
)

// Fetcher handles fetching files from GitHub
type Fetcher struct {
	httpClient *http.Client
}

// NewFetcher creates a new GitHub file fetcher
func NewFetcher() *Fetcher {
	return &Fetcher{
		httpClient: &http.Client{},
	}
}

// FetchFileContent fetches the content of a single file from GitHub API
func (f *Fetcher) FetchFileContent(ctx context.Context, fileItem map[string]interface{}) map[string]interface{} {
    downloadURL := getStringFromResult(fileItem, "download_url")
    if downloadURL == "" {
        log.Printf("⚠️ No download_url found for file")
        return nil
    }

    // Make HTTP request to fetch file content
    req, err := http.NewRequestWithContext(ctx, http.MethodGet, downloadURL, http.NoBody)
    if err != nil {
        log.Printf("⚠️ Failed to build request for file content: %v", err)
        return nil
    }
    resp, err := f.httpClient.Do(req)
    if err != nil {
        log.Printf("⚠️ Failed to fetch file content: %v", err)
        return nil
    }
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		log.Printf("⚠️ Failed to fetch file content, status: %d", resp.StatusCode)
		return nil
	}

	contentBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("⚠️ Failed to read file content: %v", err)
		return nil
	}

	content := string(contentBytes)
	fileName := getStringFromResult(fileItem, "name")

	return map[string]interface{}{
		"content":  content,
		"filename": fileName,
	}
}

// Helper function to safely extract string values from result
func getStringFromResult(result map[string]interface{}, key string) string {
	if val, exists := result[key]; exists {
		if str, ok := val.(string); ok {
			return str
		}
	}
	return ""
}
