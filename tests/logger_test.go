package tests

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/xin2025/go-template/pkg/logger"
	"go.uber.org/zap"
)

func TestLoggerInit(t *testing.T) {
	// Test basic initialization
	err := logger.Init("debug")
	assert.NoError(t, err)
	defer logger.Sync()

	// Test with custom options
	err = logger.Init("debug",
		logger.WithLevel("debug"),
		logger.WithEncoding("json"),
		logger.WithOutputPaths([]string{"stdout"}),
		logger.WithDevelopment(false),
	)
	assert.NoError(t, err)
	defer logger.Sync()

	// Test invalid level
	err = logger.Init("debug", logger.WithLevel("invalid"))
	assert.Error(t, err)
}

func TestLoggerFunctions(t *testing.T) {
	err := logger.Init("debug")
	assert.NoError(t, err)
	defer logger.Sync()

	// Test all log levels
	logger.Debug("Debug message", logger.Any("key", "value"))
	logger.Info("Info message", logger.Int("count", 42))
	logger.Warn("Warning message", logger.Bool("flag", true))
	logger.Error("Error message", logger.ErrorField(assert.AnError))

	// Test field creation functions
	fields := []zap.Field{
		logger.String("string", "value"),
		logger.Int("int", 42),
		logger.Float64("float", 3.14),
		logger.Bool("bool", true),
		logger.Duration("duration", 0),
		logger.Any("any", "value"),
		logger.ErrorField(assert.AnError),
	}
	assert.NotEmpty(t, fields)
}

func TestLoggerSync(t *testing.T) {
	err := logger.Init("debug")
	assert.NoError(t, err)

	// Test sync
	logger.Sync()
}

func TestLoggerGetLogger(t *testing.T) {
	err := logger.Init("debug")
	assert.NoError(t, err)
	defer logger.Sync()

	// Test getting logger instance
	log := logger.GetLogger()
	assert.NotNil(t, log)
} 
