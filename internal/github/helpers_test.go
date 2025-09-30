package github

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestGetStringFromResult tests safe string extraction from maps
func TestGetStringFromResult(t *testing.T) {
	tests := []struct {
		name     string
		result   map[string]interface{}
		key      string
		expected string
	}{
		{
			name:     "String value exists",
			result:   map[string]interface{}{"name": "test.go"},
			key:      "name",
			expected: "test.go",
		},
		{
			name:     "Key does not exist",
			result:   map[string]interface{}{"other": "value"},
			key:      "name",
			expected: "",
		},
		{
			name:     "Value is not a string",
			result:   map[string]interface{}{"name": 123},
			key:      "name",
			expected: "",
		},
		{
			name:     "Empty map",
			result:   map[string]interface{}{},
			key:      "name",
			expected: "",
		},
		{
			name:     "Nil map",
			result:   nil,
			key:      "name",
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := getStringFromResult(tt.result, tt.key)
			assert.Equal(t, tt.expected, result)
		})
	}
}

// TestGetIntFromResult tests safe integer extraction from maps
func TestGetIntFromResult(t *testing.T) {
	tests := []struct {
		name     string
		result   map[string]interface{}
		key      string
		expected int
	}{
		{
			name:     "Float64 value (JSON number)",
			result:   map[string]interface{}{"size": float64(1024)},
			key:      "size",
			expected: 1024,
		},
		{
			name:     "Int value",
			result:   map[string]interface{}{"size": 2048},
			key:      "size",
			expected: 2048,
		},
		{
			name:     "Key does not exist",
			result:   map[string]interface{}{"other": 123},
			key:      "size",
			expected: 0,
		},
		{
			name:     "Value is not a number",
			result:   map[string]interface{}{"size": "not-a-number"},
			key:      "size",
			expected: 0,
		},
		{
			name:     "Empty map",
			result:   map[string]interface{}{},
			key:      "size",
			expected: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := getIntFromResult(tt.result, tt.key)
			assert.Equal(t, tt.expected, result)
		})
	}
}

// TestNewDirectoryAnalyzer tests analyzer creation
func TestNewDirectoryAnalyzer(t *testing.T) {
	analyzer := NewDirectoryAnalyzer(nil)

	assert.NotNil(t, analyzer, "Analyzer should not be nil")
	assert.NotNil(t, analyzer.fetcher, "Fetcher should be initialized")
	assert.NotNil(t, analyzer.analyzer, "Code analyzer should be initialized")
}

// TestNewFetcher tests fetcher creation
func TestNewFetcher(t *testing.T) {
	fetcher := NewFetcher()

	assert.NotNil(t, fetcher, "Fetcher should not be nil")
}
