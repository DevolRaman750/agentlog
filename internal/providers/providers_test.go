package providers

import (
	"context"
	"testing"

	"gogent/internal/types"
)

// Test provider factory model detection
func TestProviderFactory_ModelDetection(t *testing.T) {
	factory := NewProviderFactory()

	tests := []struct {
		modelName    string
		expectedType string
	}{
		// Gemini models (current supported)
		{"gemini-2.5-flash", "gemini"},
		{"gemini-2.5-pro", "gemini"},
		{"gemini-2.0-flash", "gemini"},

		// Kimi models
		{"moonshotai/kimi-k2", "kimi"},
		{"moonshotai/kimi-k2-instruct", "kimi"},
		{"moonshotai/Kimi-K2-Instruct", "kimi"},

		// Unknown models should default to gemini for backwards compatibility
		{"unknown-model", "gemini"},
	}

	for _, test := range tests {
		t.Run(test.modelName, func(t *testing.T) {
			providerType := factory.GetProviderForModel(test.modelName)
			if providerType != test.expectedType {
				t.Errorf("Expected provider type %s for model %s, got %s",
					test.expectedType, test.modelName, providerType)
			}
		})
	}
}

// Test provider factory model support validation
func TestProviderFactory_IsModelSupported(t *testing.T) {
	factory := NewProviderFactory()

	supportedModels := []string{
		"gemini-2.5-flash",
		"gemini-2.5-pro",
		"moonshotai/kimi-k2",
		"moonshotai/kimi-k2-instruct",
	}

	unsupportedModels := []string{
		"gpt-4",    // Not yet implemented
		"claude-3", // Not yet implemented
	}

	for _, model := range supportedModels {
		t.Run("supported_"+model, func(t *testing.T) {
			if !factory.IsModelSupported(model) {
				t.Errorf("Model %s should be supported but wasn't", model)
			}
		})
	}

	for _, model := range unsupportedModels {
		t.Run("unsupported_"+model, func(t *testing.T) {
			if factory.IsModelSupported(model) {
				t.Errorf("Model %s should not be supported but was", model)
			}
		})
	}
}

// Test provider config validation
func TestProviderFactory_ValidateModelConfig(t *testing.T) {
	factory := NewProviderFactory()

	tests := []struct {
		name        string
		config      *types.APIConfiguration
		shouldError bool
	}{
		{
			name: "valid_gemini_config",
			config: &types.APIConfiguration{
				ModelName: "gemini-2.5-flash",
			},
			shouldError: false,
		},
		{
			name: "valid_kimi_config",
			config: &types.APIConfiguration{
				ModelName: "moonshotai/kimi-k2-instruct",
			},
			shouldError: false,
		},
		{
			name: "empty_model_name",
			config: &types.APIConfiguration{
				ModelName: "",
			},
			shouldError: true,
		},
		{
			name: "unsupported_gemini_model",
			config: &types.APIConfiguration{
				ModelName: "gemini-nonexistent",
			},
			shouldError: true,
		},
		{
			name: "unsupported_kimi_model",
			config: &types.APIConfiguration{
				ModelName: "moonshotai/nonexistent",
			},
			shouldError: true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := factory.ValidateModelConfig(test.config)
			if test.shouldError && err == nil {
				t.Errorf("Expected error for config %+v but got none", test.config)
			}
			if !test.shouldError && err != nil {
				t.Errorf("Expected no error for config %+v but got: %v", test.config, err)
			}
		})
	}
}

// Test provider interface compliance
func TestProviderInterface_Compliance(t *testing.T) {
	// Test that both providers implement the interface correctly
	t.Run("gemini_provider_interface", func(t *testing.T) {
		var provider ModelProvider

		// This would fail to compile if GeminiProvider doesn't implement ModelProvider
		provider = &GeminiProvider{}

		// Basic interface method availability
		if provider.GetProviderName() == "" {
			t.Error("GeminiProvider.GetProviderName() should return non-empty string")
		}

		if len(provider.GetSupportedModels()) == 0 {
			t.Error("GeminiProvider.GetSupportedModels() should return non-empty slice")
		}
	})

	t.Run("kimi_provider_interface", func(t *testing.T) {
		var provider ModelProvider

		// This would fail to compile if KimiProvider doesn't implement ModelProvider
		provider = &KimiProvider{}

		// Basic interface method availability
		if provider.GetProviderName() == "" {
			t.Error("KimiProvider.GetProviderName() should return non-empty string")
		}

		if len(provider.GetSupportedModels()) == 0 {
			t.Error("KimiProvider.GetSupportedModels() should return non-empty slice")
		}
	})
}

// Test provider creation with different API keys
func TestProviderFactory_CreateProvider(t *testing.T) {
	factory := NewProviderFactory()
	ctx := context.Background()

	t.Run("create_gemini_provider", func(t *testing.T) {
		sessionKeys := &types.SessionAPIKeys{
			GeminiAPIKey: "AIzaSyTest123456789012345678901234567890",
		}

		provider, err := factory.CreateProvider(ctx, "gemini-2.5-flash", sessionKeys)
		if err != nil {
			t.Fatalf("Failed to create Gemini provider: %v", err)
		}

		if provider.GetProviderName() != "gemini" {
			t.Errorf("Expected provider name 'gemini', got '%s'", provider.GetProviderName())
		}

		// Clean up
		provider.Close()
	})

	t.Run("create_kimi_provider", func(t *testing.T) {
		sessionKeys := &types.SessionAPIKeys{
			OpenRouterAPIKey: "sk-or-test123456789012345678901234567890",
		}

		provider, err := factory.CreateProvider(ctx, "moonshotai/kimi-k2-instruct", sessionKeys)
		if err != nil {
			t.Fatalf("Failed to create Kimi provider: %v", err)
		}

		if provider.GetProviderName() != "openrouter" {
			t.Errorf("Expected provider name 'openrouter', got '%s'", provider.GetProviderName())
		}

		// Clean up
		provider.Close()
	})

	t.Run("missing_api_key", func(t *testing.T) {
		// Create a fresh factory to avoid caching from previous tests
		freshFactory := NewProviderFactory()

		sessionKeys := &types.SessionAPIKeys{
			// No API keys provided
		}

		_, err := freshFactory.CreateProvider(ctx, "gemini-2.5-flash", sessionKeys)
		if err == nil {
			t.Error("Expected error when creating Gemini provider without API key")
		}

		_, err = freshFactory.CreateProvider(ctx, "moonshotai/kimi-k2-instruct", sessionKeys)
		if err == nil {
			t.Error("Expected error when creating Kimi provider without API key")
		}
	})
}

// Test tool conversion for function calling
func TestKimiProvider_ToolConversion(t *testing.T) {
	provider := &KimiProvider{}

	tools := []types.Tool{
		{
			Name:        "test_function",
			Description: "A test function",
			Parameters: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"param1": map[string]interface{}{
						"type":        "string",
						"description": "First parameter",
					},
					"param2": map[string]interface{}{
						"type":        "integer",
						"description": "Second parameter",
					},
				},
				"required": []string{"param1"},
			},
		},
	}

	openaiTools := provider.convertToolsToOpenAIFormat(tools)

	if len(openaiTools) != 1 {
		t.Fatalf("Expected 1 converted tool, got %d", len(openaiTools))
	}

	tool := openaiTools[0]

	// Check structure
	if tool["type"] != "function" {
		t.Errorf("Expected tool type 'function', got '%v'", tool["type"])
	}

	function, ok := tool["function"].(map[string]interface{})
	if !ok {
		t.Fatal("Expected 'function' field to be a map")
	}

	if function["name"] != "test_function" {
		t.Errorf("Expected function name 'test_function', got '%v'", function["name"])
	}

	if function["description"] != "A test function" {
		t.Errorf("Expected function description 'A test function', got '%v'", function["description"])
	}

	// Check parameters are preserved
	params, ok := function["parameters"].(map[string]interface{})
	if !ok {
		t.Fatal("Expected 'parameters' field to be a map")
	}

	if params["type"] != "object" {
		t.Errorf("Expected parameters type 'object', got '%v'", params["type"])
	}
}
