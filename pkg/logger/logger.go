package logger

import (
	"fmt"
	"os"
	"time"

	"github.com/sirupsen/logrus"
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
	log *logrus.Logger
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


	log = logrus.New()


	level, err := logrus.ParseLevel(cfg.Level)
	if err != nil {
		return fmt.Errorf("invalid log level: %s", cfg.Level)
	}
	log.SetLevel(level)


	log.SetOutput(os.Stdout)


	if cfg.Encoding == "json" {
		log.SetFormatter(&logrus.JSONFormatter{
			TimestampFormat: time.RFC3339,
		})
	} else {
		log.SetFormatter(&logrus.TextFormatter{
			FullTimestamp:   true,
			TimestampFormat: time.RFC3339,
			ForceColors:     true,
			DisableQuote:    true,
			PadLevelText:    true,
		})
	}

	return nil
}


func Sync() error {
	return nil 
}


func Debug(msg string, fields ...interface{}) {
	if log != nil {
		log.WithFields(convertFields(fields...)).Debug(msg)
	}
}


func Info(msg string, fields ...interface{}) {
	if log != nil {
		log.WithFields(convertFields(fields...)).Info(msg)
	}
}


func Warn(msg string, fields ...interface{}) {
	if log != nil {
		log.WithFields(convertFields(fields...)).Warn(msg)
	}
}


func Error(msg string, fields ...interface{}) {
	if log != nil {
		log.WithFields(convertFields(fields...)).Error(msg)
	}
}


func Fatal(msg string, fields ...interface{}) {
	if log != nil {
		log.WithFields(convertFields(fields...)).Fatal(msg)
	}
	os.Exit(1)
}


func String(key, value string) interface{} {
	return logrus.Fields{key: value}
}


func Int(key string, value int) interface{} {
	return logrus.Fields{key: value}
}


func Float64(key string, value float64) interface{} {
	return logrus.Fields{key: value}
}


func Bool(key string, value bool) interface{} {
	return logrus.Fields{key: value}
}


func Duration(key string, value time.Duration) interface{} {
	return logrus.Fields{key: value}
}


func Any(key string, value interface{}) interface{} {
	return logrus.Fields{key: value}
}


func ErrorField(err error) interface{} {
	return logrus.Fields{"error": err}
}

func GetLogger() *logrus.Logger {
	if log == nil {
		Init("development", WithLevel("info"), WithEncoding("console"), WithOutputPaths([]string{"stdout"}))
	}
	return log
}

func Initialize(level string) error {
	if level == "" {
		return fmt.Errorf("log level cannot be empty")
	}

	return Init("development", WithLevel(level))
}

func DefaultInit() error {
	return Init("debug", WithLevel("info"), WithEncoding("console"), WithOutputPaths([]string{"stdout"}))
}


func convertFields(fields ...interface{}) logrus.Fields {
	result := make(logrus.Fields)
	for _, field := range fields {
		if f, ok := field.(logrus.Fields); ok {
			for k, v := range f {
				result[k] = v
			}
		}
	}
	return result
} 
