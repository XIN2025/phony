package tests

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/xin2025/go-template/internal/config"
)

func TestConfigLoad(t *testing.T) {

	cfg, err := config.Load()
	assert.NoError(t, err)
	assert.Equal(t, "debug", cfg.Environment)
	assert.Equal(t, 8080, cfg.Port)
	assert.Equal(t, "info", cfg.LogLevel)


	os.Setenv("APP_ENV", "release")
	os.Setenv("PORT", "9090")
	os.Setenv("LOG_LEVEL", "debug")

	cfg, err = config.Load()
	assert.NoError(t, err)
	assert.Equal(t, "release", cfg.Environment)
	assert.Equal(t, 9090, cfg.Port)
	assert.Equal(t, "debug", cfg.LogLevel)


	os.Unsetenv("APP_ENV")
	os.Unsetenv("PORT")
	os.Unsetenv("LOG_LEVEL")
}

func TestConfigWithOptions(t *testing.T) {

	cfg, err := config.Load(
		config.WithEnvironment("test"),
		config.WithPort(3000),
		config.WithLogLevel("warn"),
		config.WithLoggerConfig(config.LoggerConfig{
			Environment: "test",
			Level:      "warn",
			Encoding:   "json",
			OutputPaths: []string{"stdout", "test.log"},
		}),
		config.WithMiddlewareConfig(config.MiddlewareConfig{
			Logging: config.LoggingConfig{
				SkipPaths:       []string{"/test"},
				LogRequestBody:  true,
				LogResponseBody: true,
				AdditionalFields: map[string]interface{}{
					"test": true,
				},
			},
			Error: config.ErrorConfig{
				LogStack: true,
			},
		}),
	)

	assert.NoError(t, err)
	assert.Equal(t, "test", cfg.Environment)
	assert.Equal(t, 3000, cfg.Port)
	assert.Equal(t, "warn", cfg.LogLevel)
	assert.Equal(t, "test", cfg.Logger.Environment)
	assert.Equal(t, "warn", cfg.Logger.Level)
	assert.Equal(t, "json", cfg.Logger.Encoding)
	assert.Equal(t, []string{"stdout", "test.log"}, cfg.Logger.OutputPaths)
	assert.Equal(t, []string{"/test"}, cfg.Middleware.Logging.SkipPaths)
	assert.True(t, cfg.Middleware.Logging.LogRequestBody)
	assert.True(t, cfg.Middleware.Logging.LogResponseBody)
	assert.Equal(t, map[string]interface{}{"test": true}, cfg.Middleware.Logging.AdditionalFields)
	assert.True(t, cfg.Middleware.Error.LogStack)
}

func TestConfigInvalidPort(t *testing.T) {

	cfg, err := config.Load(config.WithPort(-1))
	assert.NoError(t, err)
	assert.Equal(t, 8080, cfg.Port) 

	cfg, err = config.Load(config.WithPort(70000))
	assert.NoError(t, err)
	assert.Equal(t, 8080, cfg.Port) 
}

func TestConfigInvalidEnvironment(t *testing.T) {

	cfg, err := config.Load(config.WithEnvironment("invalid"))
	assert.NoError(t, err)
	assert.Equal(t, "debug", cfg.Environment) 
}

func TestConfigInvalidLogLevel(t *testing.T) {

	cfg, err := config.Load(config.WithLogLevel("invalid"))
	assert.NoError(t, err)
	assert.Equal(t, "info", cfg.LogLevel) 
}

func TestConfigGetLoggerConfig(t *testing.T) {
	cfg, err := config.Load()
	assert.NoError(t, err)

	loggerConfig := cfg.GetLoggerConfig()
	assert.Equal(t, cfg.Logger.Environment, loggerConfig.Environment)
	assert.Equal(t, cfg.Logger.Level, loggerConfig.Level)
	assert.Equal(t, cfg.Logger.Encoding, loggerConfig.Encoding)
	assert.Equal(t, cfg.Logger.OutputPaths, loggerConfig.OutputPaths)
}

func TestConfigGetLoggingMiddlewareConfig(t *testing.T) {
	cfg, err := config.Load()
	assert.NoError(t, err)

	loggingConfig := cfg.GetLoggingMiddlewareConfig()
	assert.Equal(t, cfg.Middleware.Logging.SkipPaths, loggingConfig.SkipPaths)
	assert.Equal(t, cfg.Middleware.Logging.LogRequestBody, loggingConfig.LogRequestBody)
	assert.Equal(t, cfg.Middleware.Logging.LogResponseBody, loggingConfig.LogResponseBody)
	assert.Equal(t, cfg.Middleware.Logging.AdditionalFields, loggingConfig.AdditionalFields)
}

func TestConfigGetErrorMiddlewareConfig(t *testing.T) {
	cfg, err := config.Load()
	assert.NoError(t, err)

	errorConfig := cfg.GetErrorMiddlewareConfig()
	assert.Equal(t, cfg.Middleware.Error.LogStack, errorConfig.LogStack)
} 
