package tests

import (
	"testing"

	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/assert"
	"github.com/xin2025/go-template/pkg/logger"
)

func TestLoggerInit(t *testing.T) {
	err := logger.Init("debug")
	assert.NoError(t, err)
	defer logger.Sync()

	err = logger.Init("debug",
		logger.WithLevel("debug"),
		logger.WithEncoding("json"),
		logger.WithOutputPaths([]string{"stdout"}),
		logger.WithDevelopment(false),
	)
	assert.NoError(t, err)
	defer logger.Sync()

	err = logger.Init("debug", logger.WithLevel("invalid"))
	assert.Error(t, err)
}

func TestLoggerFunctions(t *testing.T) {
	err := logger.Init("debug")
	assert.NoError(t, err)
	defer logger.Sync()

	logger.Debug("Debug message", logger.Any("key", "value"))
	logger.Info("Info message", logger.Int("count", 42))
	logger.Warn("Warning message", logger.Bool("flag", true))
	logger.Error("Error message", logger.ErrorField(assert.AnError))

	fields := []interface{}{
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

	logger.Sync()
}

func TestLoggerGetLogger(t *testing.T) {
	err := logger.Init("debug")
	assert.NoError(t, err)
	defer logger.Sync()

	log := logger.GetLogger()
	assert.NotNil(t, log)
	assert.IsType(t, &logrus.Logger{}, log)
} 
