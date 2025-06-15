package config

import (
	"os"
	"strconv"
)

// ConfigOption is a function that modifies the configuration
type ConfigOption func(*Config)

// WithEnvironment sets the environment
func WithEnvironment(env string) ConfigOption {
	return func(c *Config) {
		if env == "" {
			env = "debug"
		} else if env != "debug" && env != "release" && env != "test" {
			env = "debug"
		}
		c.Environment = env
	}
}

// WithPort sets the port
func WithPort(port int) ConfigOption {
	return func(c *Config) {
		if port < 1 || port > 65535 {
			port = 8080
		}
		c.Port = port
	}
}

// WithLogLevel sets the log level
func WithLogLevel(level string) ConfigOption {
	return func(c *Config) {
		validLevels := map[string]bool{
			"debug":   true,
			"info":    true,
			"warn":    true,
			"warning": true,
			"error":   true,
			"fatal":   true,
		}
		if level == "" || !validLevels[level] {
			level = "info"
		}
		c.LogLevel = level
	}
}

// WithLoggerConfig sets the logger configuration
func WithLoggerConfig(loggerConfig LoggerConfig) ConfigOption {
	return func(c *Config) {
		c.Logger = loggerConfig
	}
}

// WithMiddlewareConfig sets the middleware configuration
func WithMiddlewareConfig(middlewareConfig MiddlewareConfig) ConfigOption {
	return func(c *Config) {
		c.Middleware = middlewareConfig
	}
}

type Config struct {
	Environment string
	Port       int
	LogLevel   string
	Logger     LoggerConfig
	Middleware MiddlewareConfig
}

type LoggerConfig struct {
	Environment string
	Level      string
	Encoding   string
	OutputPaths []string
}

type MiddlewareConfig struct {
	Logging LoggingConfig
	Error   ErrorConfig
}

type LoggingConfig struct {
	SkipPaths       []string
	LogRequestBody  bool
	LogResponseBody bool
	AdditionalFields map[string]interface{}
}

type ErrorConfig struct {
	LogStack bool
}

// Load loads the configuration with optional customizations
func Load(options ...ConfigOption) (*Config, error) {
	cfg := &Config{}

	// Apply default options
	WithEnvironment(os.Getenv("APP_ENV"))(cfg)
	
	portStr := os.Getenv("PORT")
	if portStr == "" {
		portStr = "8080"
	}
	port, err := strconv.Atoi(portStr)
	if err != nil {
		return nil, err
	}
	WithPort(port)(cfg)
	
	WithLogLevel(os.Getenv("LOG_LEVEL"))(cfg)

	// Set default logger config
	cfg.Logger = LoggerConfig{
		Environment: cfg.Environment,
		Level:      cfg.LogLevel,
		Encoding:   "json",
		OutputPaths: []string{"stdout"},
	}

	// Set default middleware config
	cfg.Middleware = MiddlewareConfig{
		Logging: LoggingConfig{
			SkipPaths:       []string{"/health", "/metrics"},
			LogRequestBody:  false,
			LogResponseBody: false,
			AdditionalFields: map[string]interface{}{
				"environment": cfg.Environment,
				"service":     "go-template",
			},
		},
		Error: ErrorConfig{
			LogStack: true,
		},
	}

	// Apply custom options
	for _, option := range options {
		option(cfg)
	}

	return cfg, nil
}

// GetLoggerConfig returns the logger configuration
func (c *Config) GetLoggerConfig() *LoggerConfig {
	return &c.Logger
}

// GetLoggingMiddlewareConfig returns the logging middleware configuration
func (c *Config) GetLoggingMiddlewareConfig() *LoggingConfig {
	return &c.Middleware.Logging
}

// GetErrorMiddlewareConfig returns the error middleware configuration
func (c *Config) GetErrorMiddlewareConfig() *ErrorConfig {
	return &c.Middleware.Error
} 
