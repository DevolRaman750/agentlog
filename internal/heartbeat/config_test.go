package heartbeat

import (
	"os"
	"testing"
	"time"
)

func TestDefaultConfig(t *testing.T) {
	config := DefaultConfig()

	if config.CheckInterval != 5*time.Minute {
		t.Errorf("Expected CheckInterval to be 5 minutes, got %v", config.CheckInterval)
	}

	if config.MaxConcurrentExecutions != 10 {
		t.Errorf("Expected MaxConcurrentExecutions to be 10, got %d", config.MaxConcurrentExecutions)
	}

	if config.ExecutionTimeout != 10*time.Minute {
		t.Errorf("Expected ExecutionTimeout to be 10 minutes, got %v", config.ExecutionTimeout)
	}

	if config.RetryAttempts != 3 {
		t.Errorf("Expected RetryAttempts to be 3, got %d", config.RetryAttempts)
	}

	if config.RetryDelay != 30*time.Second {
		t.Errorf("Expected RetryDelay to be 30 seconds, got %v", config.RetryDelay)
	}

	if !config.TokenCheckEnabled {
		t.Error("Expected TokenCheckEnabled to be true")
	}

	if !config.Enabled {
		t.Error("Expected Enabled to be true")
	}
}

func TestConfigValidation(t *testing.T) {
	config := &Config{
		CheckInterval:           30 * time.Second,       // Too short
		MaxConcurrentExecutions: 0,                      // Too small
		ExecutionTimeout:        30 * time.Second,       // Too short
		RetryAttempts:           -1,                     // Invalid
		RetryDelay:              500 * time.Millisecond, // Too short
	}

	err := config.Validate()
	if err != nil {
		t.Errorf("Validation should not return error, got: %v", err)
	}

	// Check that values were adjusted
	if config.CheckInterval != time.Minute {
		t.Errorf("Expected CheckInterval to be adjusted to 1 minute, got %v", config.CheckInterval)
	}

	if config.MaxConcurrentExecutions != 1 {
		t.Errorf("Expected MaxConcurrentExecutions to be adjusted to 1, got %d", config.MaxConcurrentExecutions)
	}

	if config.ExecutionTimeout != time.Minute {
		t.Errorf("Expected ExecutionTimeout to be adjusted to 1 minute, got %v", config.ExecutionTimeout)
	}

	if config.RetryAttempts != 0 {
		t.Errorf("Expected RetryAttempts to be adjusted to 0, got %d", config.RetryAttempts)
	}

	if config.RetryDelay != time.Second {
		t.Errorf("Expected RetryDelay to be adjusted to 1 second, got %v", config.RetryDelay)
	}
}

func TestLoadConfigFromEnv(t *testing.T) {
	// Set environment variables
	os.Setenv("HEARTBEAT_ENABLED", "false")
	os.Setenv("HEARTBEAT_CHECK_INTERVAL", "10")
	os.Setenv("HEARTBEAT_MAX_CONCURRENT", "5")
	os.Setenv("HEARTBEAT_EXECUTION_TIMEOUT", "15")
	os.Setenv("HEARTBEAT_RETRY_ATTEMPTS", "2")
	os.Setenv("HEARTBEAT_TOKEN_CHECK", "false")

	defer func() {
		// Clean up environment variables
		os.Unsetenv("HEARTBEAT_ENABLED")
		os.Unsetenv("HEARTBEAT_CHECK_INTERVAL")
		os.Unsetenv("HEARTBEAT_MAX_CONCURRENT")
		os.Unsetenv("HEARTBEAT_EXECUTION_TIMEOUT")
		os.Unsetenv("HEARTBEAT_RETRY_ATTEMPTS")
		os.Unsetenv("HEARTBEAT_TOKEN_CHECK")
	}()

	config := LoadConfigFromEnv()

	if config.Enabled {
		t.Error("Expected Enabled to be false")
	}

	if config.CheckInterval != 10*time.Minute {
		t.Errorf("Expected CheckInterval to be 10 minutes, got %v", config.CheckInterval)
	}

	if config.MaxConcurrentExecutions != 5 {
		t.Errorf("Expected MaxConcurrentExecutions to be 5, got %d", config.MaxConcurrentExecutions)
	}

	if config.ExecutionTimeout != 15*time.Minute {
		t.Errorf("Expected ExecutionTimeout to be 15 minutes, got %v", config.ExecutionTimeout)
	}

	if config.RetryAttempts != 2 {
		t.Errorf("Expected RetryAttempts to be 2, got %d", config.RetryAttempts)
	}

	if config.TokenCheckEnabled {
		t.Error("Expected TokenCheckEnabled to be false")
	}
}

func TestLoadConfigFromEnv_InvalidValues(t *testing.T) {
	// Set invalid environment variables
	os.Setenv("HEARTBEAT_ENABLED", "invalid")
	os.Setenv("HEARTBEAT_CHECK_INTERVAL", "invalid")
	os.Setenv("HEARTBEAT_MAX_CONCURRENT", "-1")
	os.Setenv("HEARTBEAT_EXECUTION_TIMEOUT", "0")
	os.Setenv("HEARTBEAT_RETRY_ATTEMPTS", "invalid")

	defer func() {
		// Clean up environment variables
		os.Unsetenv("HEARTBEAT_ENABLED")
		os.Unsetenv("HEARTBEAT_CHECK_INTERVAL")
		os.Unsetenv("HEARTBEAT_MAX_CONCURRENT")
		os.Unsetenv("HEARTBEAT_EXECUTION_TIMEOUT")
		os.Unsetenv("HEARTBEAT_RETRY_ATTEMPTS")
	}()

	config := LoadConfigFromEnv()

	// Should fall back to defaults for invalid values
	if !config.Enabled {
		t.Error("Expected Enabled to be true (default)")
	}

	if config.CheckInterval != 5*time.Minute {
		t.Errorf("Expected CheckInterval to be 5 minutes (default), got %v", config.CheckInterval)
	}

	if config.MaxConcurrentExecutions != 10 {
		t.Errorf("Expected MaxConcurrentExecutions to be 10 (default), got %d", config.MaxConcurrentExecutions)
	}

	if config.ExecutionTimeout != 10*time.Minute {
		t.Errorf("Expected ExecutionTimeout to be 10 minutes (default), got %v", config.ExecutionTimeout)
	}

	if config.RetryAttempts != 3 {
		t.Errorf("Expected RetryAttempts to be 3 (default), got %d", config.RetryAttempts)
	}
}
