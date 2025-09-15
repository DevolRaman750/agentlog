package heartbeat

import (
	"os"
	"strconv"
	"time"
)

// Config holds configuration for the Executor
type Config struct {
	// CheckInterval is how often to check for overdue agents (default: 5 minutes)
	CheckInterval time.Duration

	// MaxConcurrentExecutions limits how many agents can execute simultaneously
	MaxConcurrentExecutions int

	// ExecutionTimeout is the maximum time an agent execution can take
	ExecutionTimeout time.Duration

	// RetryAttempts is the number of times to retry failed executions
	RetryAttempts int

	// RetryDelay is the initial delay between retry attempts
	RetryDelay time.Duration

	// TokenCheckEnabled determines if token limits should be enforced
	TokenCheckEnabled bool

	// Enabled allows turning off the heartbeat executor entirely
	Enabled bool
}

// DefaultConfig returns the default configuration
func DefaultConfig() *Config {
	return &Config{
		CheckInterval:           5 * time.Minute,
		MaxConcurrentExecutions: 10,
		ExecutionTimeout:        10 * time.Minute,
		RetryAttempts:           3,
		RetryDelay:              30 * time.Second,
		TokenCheckEnabled:       true,
		Enabled:                 true,
	}
}

// LoadConfigFromEnv loads configuration from environment variables
func LoadConfigFromEnv() *Config {
	config := DefaultConfig()

	// HEARTBEAT_ENABLED - enable/disable the heartbeat executor
	if val := os.Getenv("HEARTBEAT_ENABLED"); val != "" {
		if enabled, err := strconv.ParseBool(val); err == nil {
			config.Enabled = enabled
		}
	}

	// HEARTBEAT_CHECK_INTERVAL - how often to check for overdue agents (in minutes)
	if val := os.Getenv("HEARTBEAT_CHECK_INTERVAL"); val != "" {
		if minutes, err := strconv.Atoi(val); err == nil && minutes >= 1 {
			config.CheckInterval = time.Duration(minutes) * time.Minute
		}
	}

	// HEARTBEAT_MAX_CONCURRENT - maximum concurrent agent executions
	if val := os.Getenv("HEARTBEAT_MAX_CONCURRENT"); val != "" {
		if maxConcurrent, err := strconv.Atoi(val); err == nil && maxConcurrent > 0 {
			config.MaxConcurrentExecutions = maxConcurrent
		}
	}

	// HEARTBEAT_EXECUTION_TIMEOUT - execution timeout in minutes
	if val := os.Getenv("HEARTBEAT_EXECUTION_TIMEOUT"); val != "" {
		if minutes, err := strconv.Atoi(val); err == nil && minutes > 0 {
			config.ExecutionTimeout = time.Duration(minutes) * time.Minute
		}
	}

	// HEARTBEAT_RETRY_ATTEMPTS - number of retry attempts
	if val := os.Getenv("HEARTBEAT_RETRY_ATTEMPTS"); val != "" {
		if attempts, err := strconv.Atoi(val); err == nil && attempts >= 0 {
			config.RetryAttempts = attempts
		}
	}

	// HEARTBEAT_TOKEN_CHECK - enable/disable token limit checking
	if val := os.Getenv("HEARTBEAT_TOKEN_CHECK"); val != "" {
		if enabled, err := strconv.ParseBool(val); err == nil {
			config.TokenCheckEnabled = enabled
		}
	}

	return config
}

// Validate ensures the configuration is valid
func (c *Config) Validate() error {
	if c.CheckInterval < time.Minute {
		c.CheckInterval = time.Minute
	}

	if c.MaxConcurrentExecutions < 1 {
		c.MaxConcurrentExecutions = 1
	}

	if c.ExecutionTimeout < time.Minute {
		c.ExecutionTimeout = time.Minute
	}

	if c.RetryAttempts < 0 {
		c.RetryAttempts = 0
	}

	if c.RetryDelay < time.Second {
		c.RetryDelay = time.Second
	}

	return nil
}
