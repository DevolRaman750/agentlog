package providers

import (
	"context"
	"fmt"
	"log"
	"strings"
	"sync"

	"gogent/internal/types"
)

// ProviderFactory creates and manages model providers
type ProviderFactory struct {
	providers map[string]ModelProvider
	mutex     sync.RWMutex
}

// NewProviderFactory creates a new provider factory
func NewProviderFactory() *ProviderFactory {
	return &ProviderFactory{
		providers: make(map[string]ModelProvider),
	}
}

// CreateProvider creates or returns a cached provider for the given model and session keys
func (f *ProviderFactory) CreateProvider(ctx context.Context, modelName string, sessionKeys *types.SessionApiKeys) (ModelProvider, error) {
	providerType := f.getProviderTypeFromModel(modelName)

	f.mutex.RLock()
	// Check if we already have a provider for this type
	if provider, exists := f.providers[providerType]; exists {
		f.mutex.RUnlock()
		return provider, nil
	}
	f.mutex.RUnlock()

	// Create new provider based on type
	f.mutex.Lock()
	defer f.mutex.Unlock()

	// Double-check after acquiring write lock
	if provider, exists := f.providers[providerType]; exists {
		return provider, nil
	}

	var provider ModelProvider
	var err error

	switch providerType {
	case "gemini":
		provider, err = f.createGeminiProvider(ctx, sessionKeys)

	case "kimi":
		provider, err = f.createKimiProvider(sessionKeys)

	default:
		return nil, fmt.Errorf("unsupported provider type: %s for model %s", providerType, modelName)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to create %s provider: %w", providerType, err)
	}

	// Cache the provider
	f.providers[providerType] = provider

	log.Printf("✅ Created %s provider for model %s", providerType, modelName)

	return provider, nil
}

// createGeminiProvider creates a Gemini provider instance
func (f *ProviderFactory) createGeminiProvider(ctx context.Context, sessionKeys *types.SessionApiKeys) (ModelProvider, error) {
	if sessionKeys == nil || sessionKeys.GeminiApiKey == "" {
		return nil, fmt.Errorf("Gemini API key is required")
	}

	return NewGeminiProvider(ctx, sessionKeys.GeminiApiKey)
}

// createKimiProvider creates a Kimi provider instance
func (f *ProviderFactory) createKimiProvider(sessionKeys *types.SessionApiKeys) (ModelProvider, error) {
	var apiKey string
	var baseURL string

	log.Printf("🔑 Creating Kimi provider - sessionKeys nil: %v", sessionKeys == nil)
	if sessionKeys != nil {
		log.Printf("🔑 SessionKeys: OpenRouter=%s, Gemini=%s",
			func(key string) string {
				if len(key) > 10 {
					return key[:10] + "..."
				} else if key == "" {
					return "EMPTY"
				} else {
					return key
				}
			}(sessionKeys.OpenRouterApiKey),
			func(key string) string {
				if len(key) > 10 {
					return key[:10] + "..."
				} else if key == "" {
					return "EMPTY"
				} else {
					return key
				}
			}(sessionKeys.GeminiApiKey))

		// Try OpenRouter API key first
		if sessionKeys.OpenRouterApiKey != "" {
			apiKey = sessionKeys.OpenRouterApiKey
			baseURL = "https://openrouter.ai/api/v1"
			log.Printf("✅ Using OpenRouter API key for Kimi provider")
		} else if strings.HasPrefix(sessionKeys.GeminiApiKey, "sk-or-") {
			// Fallback: Use Gemini key field if it's actually an OpenRouter key
			apiKey = sessionKeys.GeminiApiKey
			baseURL = "https://openrouter.ai/api/v1"
			log.Printf("✅ Using Gemini field with OpenRouter prefix for Kimi provider")
		}
	}

	if apiKey == "" {
		log.Printf("❌ No OpenRouter API key found - sessionKeys: %+v", sessionKeys)
		return nil, fmt.Errorf("OpenRouter API key is required for Kimi models (set openRouterApiKey or use sk-or- prefixed key)")
	}

	log.Printf("🚀 Creating Kimi provider with baseURL: %s", baseURL)
	return NewKimiProvider(apiKey, baseURL)
}

// getProviderTypeFromModel determines the provider type from model name
func (f *ProviderFactory) getProviderTypeFromModel(modelName string) string {
	// Kimi models
	if strings.HasPrefix(modelName, "moonshotai/") ||
		strings.Contains(strings.ToLower(modelName), "kimi") {
		return "kimi"
	}

	// Gemini models (default for existing models)
	if strings.HasPrefix(modelName, "gemini") {
		return "gemini"
	}

	// Default to gemini for backwards compatibility
	return "gemini"
}

// GetSupportedModels returns all supported models across providers
func (f *ProviderFactory) GetSupportedModels() map[string][]string {
	// Create temporary providers to get their supported models
	// This doesn't cache them since we don't have API keys here

	return map[string][]string{
		"gemini": {
			"gemini-1.5-flash",
			"gemini-1.5-pro",
			"gemini-1.0-pro",
			"gemini-1.5-flash-8b",
			"gemini-pro",
			"gemini-pro-vision",
			"gemini-1.5-pro-latest",
		},
		"kimi": {
			"moonshotai/kimi-k2",
			"moonshotai/kimi-k2-instruct",
			"moonshotai/Kimi-K2-Instruct",
		},
	}
}

// ValidateModelConfig validates that a model configuration is supported
func (f *ProviderFactory) ValidateModelConfig(config *types.APIConfiguration) error {
	providerType := f.getProviderTypeFromModel(config.ModelName)

	switch providerType {
	case "gemini":
		// Create a temporary provider for validation
		tempProvider := &GeminiProvider{}
		return tempProvider.ValidateConfig(config)

	case "kimi":
		// Create a temporary provider for validation
		tempProvider := &KimiProvider{}
		return tempProvider.ValidateConfig(config)

	default:
		return fmt.Errorf("unsupported provider type: %s", providerType)
	}
}

// GetProviderForModel returns the provider type for a given model
func (f *ProviderFactory) GetProviderForModel(modelName string) string {
	return f.getProviderTypeFromModel(modelName)
}

// IsModelSupported checks if a model is supported by any provider
func (f *ProviderFactory) IsModelSupported(modelName string) bool {
	supportedModels := f.GetSupportedModels()

	for _, models := range supportedModels {
		for _, model := range models {
			if model == modelName {
				return true
			}
		}
	}

	return false
}

// ClearProvider removes a cached provider (useful for API key changes)
func (f *ProviderFactory) ClearProvider(providerType string) {
	f.mutex.Lock()
	defer f.mutex.Unlock()

	if provider, exists := f.providers[providerType]; exists {
		provider.Close()
		delete(f.providers, providerType)
		log.Printf("🗑️ Cleared %s provider from cache", providerType)
	}
}

// ClearAllProviders removes all cached providers
func (f *ProviderFactory) ClearAllProviders() error {
	f.mutex.Lock()
	defer f.mutex.Unlock()

	var errors []string

	for providerType, provider := range f.providers {
		if err := provider.Close(); err != nil {
			errors = append(errors, fmt.Sprintf("%s: %v", providerType, err))
		}
	}

	// Clear the cache
	f.providers = make(map[string]ModelProvider)

	if len(errors) > 0 {
		return fmt.Errorf("errors closing providers: %s", strings.Join(errors, ", "))
	}

	log.Printf("🗑️ Cleared all providers from cache")
	return nil
}

// GetCachedProviders returns information about currently cached providers
func (f *ProviderFactory) GetCachedProviders() map[string]string {
	f.mutex.RLock()
	defer f.mutex.RUnlock()

	result := make(map[string]string)
	for providerType, provider := range f.providers {
		result[providerType] = provider.GetProviderName()
	}

	return result
}
