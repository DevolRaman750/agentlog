package integrations

import (
	"fmt"
	"sync"

	"gogent/internal/gogent/integrations/base"
)

// Registry manages all available API integrations
type Registry struct {
	integrations map[string]base.APIIntegration
	mutex        sync.RWMutex
}

// NewRegistry creates a new integration registry
func NewRegistry() *Registry {
	return &Registry{
		integrations: make(map[string]base.APIIntegration),
	}
}

// Register adds a new integration to the registry
func (r *Registry) Register(integration base.APIIntegration) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	name := integration.Name()
	if name == "" {
		return fmt.Errorf("integration name cannot be empty")
	}

	if _, exists := r.integrations[name]; exists {
		return fmt.Errorf("integration %s is already registered", name)
	}

	r.integrations[name] = integration
	return nil
}

// Get retrieves an integration by name
func (r *Registry) Get(name string) (base.APIIntegration, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	integration, exists := r.integrations[name]
	if !exists {
		return nil, fmt.Errorf("integration %s not found", name)
	}

	return integration, nil
}

// List returns all registered integration names
func (r *Registry) List() []string {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	names := make([]string, 0, len(r.integrations))
	for name := range r.integrations {
		names = append(names, name)
	}
	return names
}

// HasIntegration checks if an integration is registered
func (r *Registry) HasIntegration(name string) bool {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	_, exists := r.integrations[name]
	return exists
}

// GetSupportedFunctionGroups returns all function groups supported by registered integrations
func (r *Registry) GetSupportedFunctionGroups() []string {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	groups := make([]string, 0, len(r.integrations))
	for name := range r.integrations {
		groups = append(groups, name)
	}
	return groups
}

// Global registry instance
var globalRegistry = NewRegistry()

// RegisterIntegration registers an integration globally
func RegisterIntegration(integration base.APIIntegration) error {
	return globalRegistry.Register(integration)
}

// GetIntegration gets an integration from the global registry
func GetIntegration(name string) (base.APIIntegration, error) {
	return globalRegistry.Get(name)
}

// ListIntegrations lists all integrations in the global registry
func ListIntegrations() []string {
	return globalRegistry.List()
}
