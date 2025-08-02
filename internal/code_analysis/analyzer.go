package code_analysis

import (
	"path/filepath"
	"regexp"
	"strings"
)

// Config holds configuration for code analysis
type Config struct {
	MaxFileSizeBytes    int
	SupportedExtensions map[string]bool
}

// DefaultConfig returns a default configuration for code analysis
func DefaultConfig() *Config {
	return &Config{
		MaxFileSizeBytes: 500000, // 500KB - increased for larger source files
		SupportedExtensions: map[string]bool{
			".go":    true,
			".js":    true,
			".ts":    true,
			".py":    true,
			".java":  true,
			".cpp":   true,
			".c":     true,
			".h":     true,
			".hpp":   true,
			".rs":    true,
			".php":   true,
			".rb":    true,
			".cs":    true,
			".swift": true,
			".kt":    true,
			".scala": true,
			".sql":   true,
			".sh":    true,
			".bash":  true,
			".zsh":   true,
			".fish":  true,
			".yml":   true,
			".yaml":  true,
			".json":  true,
			".xml":   true,
			".html":  true,
			".css":   true,
			".scss":  true,
			".less":  true,
			".vue":   true,
			".jsx":   true,
			".tsx":   true,
		},
	}
}

// Analyzer handles code analysis operations
type Analyzer struct {
	config *Config
}

// NewAnalyzer creates a new code analyzer with the given configuration
func NewAnalyzer(config *Config) *Analyzer {
	if config == nil {
		config = DefaultConfig()
	}
	return &Analyzer{config: config}
}

// IsCodeFile determines if a file should be analyzed as code based on its extension
func (a *Analyzer) IsCodeFile(fileName string) bool {
	ext := strings.ToLower(filepath.Ext(fileName))
	return a.config.SupportedExtensions[ext]
}

// ShouldAnalyzeFile checks if a file should be analyzed based on size and type
func (a *Analyzer) ShouldAnalyzeFile(fileName string, size int) bool {
	return size > 0 && size < a.config.MaxFileSizeBytes && a.IsCodeFile(fileName)
}

// AnalyzeContent performs content analysis on code
func (a *Analyzer) AnalyzeContent(content, filename string) map[string]interface{} {
	analysis := map[string]interface{}{
		"language":   a.detectLanguage(filename),
		"line_count": len(strings.Split(content, "\n")),
		"size_bytes": len(content),
		"char_count": len(content),
	}

	// Language-specific analysis
	switch a.detectLanguage(filename) {
	case "go":
		analysis["functions"] = a.extractGoFunctions(content)
		analysis["imports"] = a.extractGoImports(content)
		analysis["packages"] = a.extractGoPackages(content)
		analysis["function_count"] = len(a.extractGoFunctions(content))
		analysis["import_count"] = len(a.extractGoImports(content))
	case "javascript", "typescript":
		analysis["functions"] = a.extractJSFunctions(content)
		analysis["imports"] = a.extractJSImports(content)
		analysis["function_count"] = len(a.extractJSFunctions(content))
		analysis["import_count"] = len(a.extractJSImports(content))
	case "python":
		analysis["functions"] = a.extractPythonFunctions(content)
		analysis["imports"] = a.extractPythonImports(content)
		analysis["function_count"] = len(a.extractPythonFunctions(content))
		analysis["import_count"] = len(a.extractPythonImports(content))
	default:
		analysis["function_count"] = 0
		analysis["import_count"] = 0
	}

	return analysis
}

// AnalyzeFileTypes analyzes the file types in a directory listing
func (a *Analyzer) AnalyzeFileTypes(files []map[string]interface{}) map[string]interface{} {
	typeCount := make(map[string]int)

	for _, file := range files {
		if name, ok := file["name"].(string); ok {
			ext := filepath.Ext(name)
			if ext == "" {
				ext = "no_extension"
			}
			typeCount[ext]++
		}
	}

	return map[string]interface{}{
		"by_extension": typeCount,
		"total_types":  len(typeCount),
	}
}

// CountTotalLinesOfCode counts total lines across all analyzed files
func (a *Analyzer) CountTotalLinesOfCode(filesWithContent []map[string]interface{}) int {
	totalLines := 0
	for _, file := range filesWithContent {
		if content, ok := file["content"].(string); ok {
			totalLines += len(strings.Split(content, "\n"))
		}
	}
	return totalLines
}

// SummarizeCodeFiles provides a summary of the analyzed code files
func (a *Analyzer) SummarizeCodeFiles(filesWithContent []map[string]interface{}) []map[string]interface{} {
	summaries := make([]map[string]interface{}, 0)

	for _, file := range filesWithContent {
		if analysis, ok := file["analysis"].(map[string]interface{}); ok {
			summary := map[string]interface{}{
				"name":      file["name"],
				"size":      file["size"],
				"functions": getIntFromResult(analysis, "function_count"),
				"imports":   getIntFromResult(analysis, "import_count"),
				"lines":     getIntFromResult(analysis, "line_count"),
			}
			summaries = append(summaries, summary)
		}
	}

	return summaries
}

// GenerateCodeOverview generates a high-level overview of the analyzed code
func (a *Analyzer) GenerateCodeOverview(filesWithContent []map[string]interface{}) map[string]interface{} {
	totalFunctions := 0
	totalImports := 0
	totalLines := 0
	fileLanguages := make(map[string]int)

	for _, file := range filesWithContent {
		fileName := getStringFromResult(file, "name")
		ext := strings.ToLower(filepath.Ext(fileName))
		fileLanguages[ext]++

		if analysis, ok := file["analysis"].(map[string]interface{}); ok {
			totalFunctions += getIntFromResult(analysis, "function_count")
			totalImports += getIntFromResult(analysis, "import_count")
			totalLines += getIntFromResult(analysis, "line_count")
		}
	}

	return map[string]interface{}{
		"total_functions":    totalFunctions,
		"total_imports":      totalImports,
		"total_lines":        totalLines,
		"files_analyzed":     len(filesWithContent),
		"languages_detected": fileLanguages,
		"purpose_analysis":   a.InferDirectoryPurpose(filesWithContent),
	}
}

// InferDirectoryPurpose attempts to infer the purpose of the directory based on file analysis
func (a *Analyzer) InferDirectoryPurpose(filesWithContent []map[string]interface{}) string {
	hasMain := false
	hasServer := false
	hasGRPC := false
	hasHttp := false

	for _, file := range filesWithContent {
		fileName := strings.ToLower(getStringFromResult(file, "name"))
		content := getStringFromResult(file, "content")

		if fileName == "main.go" {
			hasMain = true
		}
		if strings.Contains(fileName, "server") {
			hasServer = true
		}
		if strings.Contains(content, "grpc") || strings.Contains(fileName, "grpc") {
			hasGRPC = true
		}
		if strings.Contains(content, "http") && strings.Contains(content, "ListenAndServe") {
			hasHttp = true
		}
	}

	if hasMain && hasServer && hasGRPC {
		return "Go gRPC server application with main entry point"
	} else if hasMain && hasServer && hasHttp {
		return "Go HTTP server application with main entry point"
	} else if hasMain {
		return "Go application with main entry point"
	} else if hasServer {
		return "Server-related code module"
	} else {
		return "Go code module (purpose unclear from file analysis)"
	}
}

// detectLanguage detects programming language from filename
func (a *Analyzer) detectLanguage(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".go":
		return "go"
	case ".js":
		return "javascript"
	case ".ts":
		return "typescript"
	case ".py":
		return "python"
	case ".java":
		return "java"
	case ".cpp", ".cc", ".cxx":
		return "cpp"
	case ".c":
		return "c"
	case ".rb":
		return "ruby"
	case ".php":
		return "php"
	case ".rs":
		return "rust"
	default:
		return "unknown"
	}
}

// extractGoFunctions extracts Go function names from content
func (a *Analyzer) extractGoFunctions(content string) []string {
	funcRegex := regexp.MustCompile(`func\s+(\w+)\s*\(`)
	matches := funcRegex.FindAllStringSubmatch(content, -1)
	var functions []string
	for _, match := range matches {
		if len(match) > 1 {
			functions = append(functions, match[1])
		}
	}
	return functions
}

// extractGoImports extracts Go imports from content
func (a *Analyzer) extractGoImports(content string) []string {
	// Match single line imports: import "package"
	singleImportRegex := regexp.MustCompile(`import\s+"([^"]+)"`)
	// Match block imports: import ( ... )
	blockImportRegex := regexp.MustCompile(`import\s*\(\s*([^)]+)\s*\)`)
	// Match individual imports within blocks: "package" or alias "package"
	importRegex := regexp.MustCompile(`(?:^\s*|\s+)(?:\w+\s+)?"([^"]+)"`)

	var imports []string

	// Find single imports
	singleMatches := singleImportRegex.FindAllStringSubmatch(content, -1)
	for _, match := range singleMatches {
		if len(match) > 1 {
			imports = append(imports, match[1])
		}
	}

	// Find block imports
	blockMatches := blockImportRegex.FindAllStringSubmatch(content, -1)
	for _, blockMatch := range blockMatches {
		if len(blockMatch) > 1 {
			blockContent := blockMatch[1]
			matches := importRegex.FindAllStringSubmatch(blockContent, -1)
			for _, match := range matches {
				if len(match) > 1 {
					imports = append(imports, match[1])
				}
			}
		}
	}

	return imports
}

// extractGoPackages extracts Go package declaration from content
func (a *Analyzer) extractGoPackages(content string) []string {
	packageRegex := regexp.MustCompile(`package\s+(\w+)`)
	matches := packageRegex.FindAllStringSubmatch(content, -1)
	var packages []string
	for _, match := range matches {
		if len(match) > 1 {
			packages = append(packages, match[1])
		}
	}
	return packages
}

// extractJSFunctions extracts JavaScript/TypeScript function names from content
func (a *Analyzer) extractJSFunctions(content string) []string {
	// Match function declarations: function name()
	funcRegex := regexp.MustCompile(`function\s+(\w+)\s*\(`)
	// Match arrow functions: const name = () =>
	arrowRegex := regexp.MustCompile(`(?:const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)\s*=>|\w+\s*=>\s*)`)
	// Match method definitions: name() {
	methodRegex := regexp.MustCompile(`(\w+)\s*\([^)]*\)\s*\{`)

	var functions []string

	// Find function declarations
	matches := funcRegex.FindAllStringSubmatch(content, -1)
	for _, match := range matches {
		if len(match) > 1 {
			functions = append(functions, match[1])
		}
	}

	// Find arrow functions
	matches = arrowRegex.FindAllStringSubmatch(content, -1)
	for _, match := range matches {
		if len(match) > 1 {
			functions = append(functions, match[1])
		}
	}

	// Find method definitions (basic)
	matches = methodRegex.FindAllStringSubmatch(content, -1)
	for _, match := range matches {
		if len(match) > 1 {
			// Filter out common keywords that aren't functions
			name := match[1]
			if name != "if" && name != "for" && name != "while" && name != "switch" {
				functions = append(functions, name)
			}
		}
	}

	return functions
}

// extractJSImports extracts JavaScript/TypeScript imports from content
func (a *Analyzer) extractJSImports(content string) []string {
	// Match ES6 imports: import ... from "module"
	importRegex := regexp.MustCompile(`import\s+(?:[^"']+\s+from\s+)?["']([^"']+)["']`)
	// Match require: require("module")
	requireRegex := regexp.MustCompile(`require\s*\(\s*["']([^"']+)["']\s*\)`)

	var imports []string

	// Find ES6 imports
	matches := importRegex.FindAllStringSubmatch(content, -1)
	for _, match := range matches {
		if len(match) > 1 {
			imports = append(imports, match[1])
		}
	}

	// Find require statements
	matches = requireRegex.FindAllStringSubmatch(content, -1)
	for _, match := range matches {
		if len(match) > 1 {
			imports = append(imports, match[1])
		}
	}

	return imports
}

// extractPythonFunctions extracts Python function names from content
func (a *Analyzer) extractPythonFunctions(content string) []string {
	funcRegex := regexp.MustCompile(`def\s+(\w+)\s*\(`)
	matches := funcRegex.FindAllStringSubmatch(content, -1)
	var functions []string
	for _, match := range matches {
		if len(match) > 1 {
			functions = append(functions, match[1])
		}
	}
	return functions
}

// extractPythonImports extracts Python imports from content
func (a *Analyzer) extractPythonImports(content string) []string {
	// Match import statements: import module, from module import
	importRegex := regexp.MustCompile(`(?:^|\n)\s*(?:from\s+(\S+)\s+)?import\s+([^\n#]+)`)
	matches := importRegex.FindAllStringSubmatch(content, -1)
	var imports []string
	for _, match := range matches {
		if len(match) > 2 {
			if match[1] != "" {
				// from X import Y
				imports = append(imports, match[1])
			}
			// Parse imported names
			importNames := strings.Split(match[2], ",")
			for _, name := range importNames {
				name = strings.TrimSpace(name)
				if name != "" && !strings.Contains(name, " as ") {
					imports = append(imports, name)
				}
			}
		}
	}
	return imports
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
