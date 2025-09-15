package github

import (
	"context"
	"fmt"
	"log"

	"gogent/internal/codeanalysis"
)

// DirectoryAnalyzer handles analysis of GitHub directory contents
type DirectoryAnalyzer struct {
	fetcher  *Fetcher
	analyzer *codeanalysis.Analyzer
}

// NewDirectoryAnalyzer creates a new directory analyzer
func NewDirectoryAnalyzer(config *codeanalysis.Config) *DirectoryAnalyzer {
	return &DirectoryAnalyzer{
		fetcher:  NewFetcher(),
		analyzer: codeanalysis.NewAnalyzer(config),
	}
}

// ProcessDirectoryListing processes a GitHub directory listing with enhanced analysis
func (da *DirectoryAnalyzer) ProcessDirectoryListing(
	ctx context.Context,
	result map[string]interface{},
	githubArray []interface{},
) map[string]interface{} {
	log.Printf(
		"🔧 Processing GitHub directory listing with %d items",
		len(githubArray),
	)

	files := make([]map[string]interface{}, 0)
	directories := make([]map[string]interface{}, 0)
	filesWithContent := make([]map[string]interface{}, 0)

	for _, item := range githubArray {
		if itemMap, ok := item.(map[string]interface{}); ok {
			itemType := getStringFromResult(itemMap, "type")
			itemInfo := map[string]interface{}{
				"name": getStringFromResult(itemMap, "name"),
				"path": getStringFromResult(itemMap, "path"),
				"type": itemType,
				"size": getIntFromResult(itemMap, "size"),
			}

			if itemType == "file" {
				files = append(files, itemInfo)

				// Auto-fetch and analyze content for qualifying files
				fileSize := getIntFromResult(itemMap, "size")
				fileName := getStringFromResult(itemMap, "name")

				if da.analyzer.ShouldAnalyzeFile(fileName, fileSize) {
					log.Printf(
						"🔧 Auto-fetching content for file: %s (%d bytes)",
						fileName,
						fileSize,
					)
					if fileContent := da.fetcher.FetchFileContent(ctx, itemMap); fileContent != nil {
						content := fileContent["content"].(string)
						analysis := da.analyzer.AnalyzeContent(content, fileName)

						itemInfo["content"] = content
						itemInfo["analysis"] = analysis
						filesWithContent = append(filesWithContent, itemInfo)
					}
				}
			} else if itemType == "dir" {
				directories = append(directories, itemInfo)
			}
		}
	}

	// Build enhanced response
	enhanced := map[string]interface{}{
		"type": "directory_listing",
		"directory_contents": map[string]interface{}{
			"files":       files,
			"directories": directories,
			"total_files": len(files),
			"total_dirs":  len(directories),
		},
		"raw_response": result["response"],
		"_metadata":    result["_metadata"],
		"analysis": map[string]interface{}{
			"summary": fmt.Sprintf(
				"Directory contains %d files and %d subdirectories",
				len(files),
				len(directories),
			),
			"file_types":          da.analyzer.AnalyzeFileTypes(files),
			"files_with_content":  len(filesWithContent),
			"total_lines_of_code": da.analyzer.CountTotalLinesOfCode(filesWithContent),
			"code_files_analyzed": da.analyzer.SummarizeCodeFiles(filesWithContent),
		},
	}

	// Add detailed code analysis if files were processed
	if len(filesWithContent) > 0 {
		enhanced["detailed_codeanalysis"] = map[string]interface{}{
			"files_analyzed": filesWithContent,
			"overview":       da.analyzer.GenerateCodeOverview(filesWithContent),
		}
		log.Printf(
			"✅ Enhanced directory listing with code analysis: %d files analyzed",
			len(filesWithContent),
		)
	} else {
		log.Printf(
			"✅ Enhanced directory listing: %d files, %d directories (no code content fetched)",
			len(files),
			len(directories),
		)
	}

	return enhanced
}

// Helper function to safely extract int values from result
func getIntFromResult(result map[string]interface{}, key string) int {
	if val, exists := result[key]; exists {
		if num, ok := val.(float64); ok {
			return int(num)
		}
		if num, ok := val.(int); ok {
			return num
		}
	}
	return 0
}
