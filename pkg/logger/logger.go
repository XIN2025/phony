package logger

import (
	"fmt"
	"os"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// LoggerConfig holds the configuration for the logger
type LoggerConfig struct {
	Environment  string
	Level       string
	Encoding    string
	OutputPaths []string
	Development bool
}

// LoggerOption is a function that modifies the logger configuration
type LoggerOption func(*LoggerConfig)

// WithLevel sets the log level
func WithLevel(level string) LoggerOption {
	return func(cfg *LoggerConfig) {
		cfg.Level = level
	}
}

// WithEncoding sets the log encoding
func WithEncoding(encoding string) LoggerOption {
	return func(cfg *LoggerConfig) {
		cfg.Encoding = encoding
	}
}

// WithOutputPaths sets the output paths
func WithOutputPaths(paths []string) LoggerOption {
	return func(cfg *LoggerConfig) {
		cfg.OutputPaths = paths
	}
}

// WithDevelopment sets development mode
func WithDevelopment(dev bool) LoggerOption {
	return func(cfg *LoggerConfig) {
		cfg.Development = dev
	}
}

var (
	log *zap.Logger
)

// Init initializes the logger with the given environment and options
func Init(env string, options ...LoggerOption) error {
	cfg := &LoggerConfig{
		Environment: env,
		Level:      "info",
		Encoding:   "console",
		OutputPaths: []string{"stdout"},
		Development: true,
	}

	// Apply options
	for _, option := range options {
		option(cfg)
	}

	// Create zap config
	zapConfig := zap.NewProductionConfig()
	if cfg.Development {
		zapConfig = zap.NewDevelopmentConfig()
		zapConfig.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
	}

	// Set zap config from our config
	if level, err := zapcore.ParseLevel(cfg.Level); err != nil {
		return fmt.Errorf("invalid log level: %s", cfg.Level)
	} else {
		zapConfig.Level = zap.NewAtomicLevelAt(level)
	}
	zapConfig.Encoding = cfg.Encoding
	zapConfig.OutputPaths = cfg.OutputPaths

	// Build logger
	var err error
	log, err = zapConfig.Build()
	if err != nil {
		return err
	}

	return nil
}

// Sync flushes any buffered log entries
func Sync() error {
	if log != nil {
		return log.Sync()
	}
	return nil
}

// Debug logs a debug message
func Debug(msg string, fields ...zap.Field) {
	if log != nil {
		log.Debug(msg, fields...)
	}
}

// Info logs an info message
func Info(msg string, fields ...zap.Field) {
	if log != nil {
		log.Info(msg, fields...)
	}
}

// Warn logs a warning message
func Warn(msg string, fields ...zap.Field) {
	if log != nil {
		log.Warn(msg, fields...)
	}
}

// Error logs an error message
func Error(msg string, fields ...zap.Field) {
	if log != nil {
		log.Error(msg, fields...)
	}
}

// Fatal logs a fatal message and exits
func Fatal(msg string, fields ...zap.Field) {
	if log != nil {
		log.Fatal(msg, fields...)
	}
	os.Exit(1)
}

// String creates a string field
func String(key, value string) zap.Field {
	return zap.String(key, value)
}

// Int creates an integer field
func Int(key string, value int) zap.Field {
	return zap.Int(key, value)
}

// Float64 creates a float64 field
func Float64(key string, value float64) zap.Field {
	return zap.Float64(key, value)
}

// Bool creates a boolean field
func Bool(key string, value bool) zap.Field {
	return zap.Bool(key, value)
}

// Duration creates a duration field
func Duration(key string, value time.Duration) zap.Field {
	return zap.Duration(key, value)
}

// Any creates an any field
func Any(key string, value interface{}) zap.Field {
	return zap.Any(key, value)
}

// Error creates an error field
func ErrorField(err error) zap.Field {
	return zap.Error(err)
}

func GetLogger() *zap.Logger {
	if log == nil {
		Init("development", WithLevel("info"), WithEncoding("console"), WithOutputPaths([]string{"stdout"}))
	}
	return log
}

func Initialize(level string) error {
	if level == "" {
		return fmt.Errorf("log level cannot be empty")
	}

	var zapLevel zapcore.Level
	if err := zapLevel.UnmarshalText([]byte(level)); err != nil {
		return err
	}

	encoderConfig := zapcore.EncoderConfig{
		TimeKey:        "time",
		LevelKey:       "level",
		NameKey:        "logger",
		CallerKey:      "caller",
		MessageKey:     "msg",
		StacktraceKey:  "stacktrace",
		LineEnding:     zapcore.DefaultLineEnding,
		EncodeLevel:    zapcore.LowercaseLevelEncoder,
		EncodeTime:     zapcore.ISO8601TimeEncoder,
		EncodeDuration: zapcore.SecondsDurationEncoder,
		EncodeCaller:   zapcore.ShortCallerEncoder,
	}

	core := zapcore.NewCore(
		zapcore.NewJSONEncoder(encoderConfig),
		zapcore.AddSync(os.Stdout),
		zapLevel,
	)

	log = zap.New(core, zap.AddCaller(), zap.AddStacktrace(zapcore.ErrorLevel))
	return nil
}

// DefaultInit initializes the logger with default settings
func DefaultInit() error {
	return Init("debug", WithLevel("info"), WithEncoding("console"), WithOutputPaths([]string{"stdout"}))
} 
