package logger

import (
	"fmt"
	"os"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)


type LoggerConfig struct {
	Environment  string
	Level       string
	Encoding    string
	OutputPaths []string
	Development bool
}


type LoggerOption func(*LoggerConfig)


func WithLevel(level string) LoggerOption {
	return func(cfg *LoggerConfig) {
		cfg.Level = level
	}
}


func WithEncoding(encoding string) LoggerOption {
	return func(cfg *LoggerConfig) {
		cfg.Encoding = encoding
	}
}


func WithOutputPaths(paths []string) LoggerOption {
	return func(cfg *LoggerConfig) {
		cfg.OutputPaths = paths
	}
}


func WithDevelopment(dev bool) LoggerOption {
	return func(cfg *LoggerConfig) {
		cfg.Development = dev
	}
}

var (
	log *zap.Logger
)


func Init(env string, options ...LoggerOption) error {
	cfg := &LoggerConfig{
		Environment: env,
		Level:      "info",
		Encoding:   "console",
		OutputPaths: []string{"stdout"},
		Development: true,
	}


	for _, option := range options {
		option(cfg)
	}


	zapConfig := zap.NewProductionConfig()
	if cfg.Development {
		zapConfig = zap.NewDevelopmentConfig()
		zapConfig.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
	}


	if level, err := zapcore.ParseLevel(cfg.Level); err != nil {
		return fmt.Errorf("invalid log level: %s", cfg.Level)
	} else {
		zapConfig.Level = zap.NewAtomicLevelAt(level)
	}
	zapConfig.Encoding = cfg.Encoding
	zapConfig.OutputPaths = cfg.OutputPaths


	var err error
	log, err = zapConfig.Build()
	if err != nil {
		return err
	}

	return nil
}


func Sync() error {
	if log != nil {
		return log.Sync()
	}
	return nil
}


func Debug(msg string, fields ...zap.Field) {
	if log != nil {
		log.Debug(msg, fields...)
	}
}


func Info(msg string, fields ...zap.Field) {
	if log != nil {
		log.Info(msg, fields...)
	}
}


func Warn(msg string, fields ...zap.Field) {
	if log != nil {
		log.Warn(msg, fields...)
	}
}


func Error(msg string, fields ...zap.Field) {
	if log != nil {
		log.Error(msg, fields...)
	}
}


func Fatal(msg string, fields ...zap.Field) {
	if log != nil {
		log.Fatal(msg, fields...)
	}
	os.Exit(1)
}


func String(key, value string) zap.Field {
	return zap.String(key, value)
}


func Int(key string, value int) zap.Field {
	return zap.Int(key, value)
}


func Float64(key string, value float64) zap.Field {
	return zap.Float64(key, value)
}


func Bool(key string, value bool) zap.Field {
	return zap.Bool(key, value)
}


func Duration(key string, value time.Duration) zap.Field {
	return zap.Duration(key, value)
}


func Any(key string, value interface{}) zap.Field {
	return zap.Any(key, value)
}


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


func DefaultInit() error {
	return Init("debug", WithLevel("info"), WithEncoding("console"), WithOutputPaths([]string{"stdout"}))
} 
