package middleware

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/xin2025/go-template/internal/config"
	"github.com/xin2025/go-template/pkg/logger"
)


type MiddlewareOption func(interface{})


func WithSkipPaths(paths []string) MiddlewareOption {
	return func(m interface{}) {
		if logging, ok := m.(*loggingMiddleware); ok {
			logging.skipPaths = paths
		}
	}
}


func WithLogRequestBody(log bool) MiddlewareOption {
	return func(m interface{}) {
		if logging, ok := m.(*loggingMiddleware); ok {
			logging.logRequestBody = log
		}
	}
}


func WithLogResponseBody(log bool) MiddlewareOption {
	return func(m interface{}) {
		if logging, ok := m.(*loggingMiddleware); ok {
			logging.logResponseBody = log
		}
	}
}


func WithAdditionalFields(fields map[string]interface{}) MiddlewareOption {
	return func(m interface{}) {
		if logging, ok := m.(*loggingMiddleware); ok {
			logging.additionalFields = fields
		}
	}
}


type loggingMiddleware struct {
	skipPaths       []string
	logRequestBody  bool
	logResponseBody bool
	additionalFields map[string]interface{}
}


func newLoggingMiddleware(cfg *config.LoggingConfig, options ...MiddlewareOption) gin.HandlerFunc {
	m := &loggingMiddleware{
		skipPaths:       cfg.SkipPaths,
		logRequestBody:  cfg.LogRequestBody,
		logResponseBody: cfg.LogResponseBody,
		additionalFields: cfg.AdditionalFields,
	}


	for _, option := range options {
		option(m)
	}

	return func(c *gin.Context) {

		for _, path := range m.skipPaths {
			if c.Request.URL.Path == path {
				c.Next()
				return
			}
		}

		start := time.Now()
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery


		c.Next()


		logger.Info("Request processed",
			logger.String("path", path),
			logger.String("query", query),
			logger.Int("status", c.Writer.Status()),
			logger.String("method", c.Request.Method),
			logger.String("ip", c.ClientIP()),
			logger.Duration("latency", time.Since(start)),
		)


		for k, v := range m.additionalFields {
			logger.Info("Additional field", logger.Any(k, v))
		}


		if m.logRequestBody && c.Request.Body != nil {

		}
		if m.logResponseBody && c.Writer != nil {

		}
	}
}


type recoveryMiddleware struct {
	logStack bool
}


func newRecoveryMiddleware(cfg *config.ErrorConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				logger.Error("Recovery from panic",
					logger.Any("error", err),
					logger.String("path", c.Request.URL.Path),
					logger.String("method", c.Request.Method),
				)

				if cfg.LogStack {

				}

				c.AbortWithStatus(http.StatusInternalServerError)
			}
		}()
		c.Next()
	}
}


func CreateLoggingMiddleware(cfg *config.LoggingConfig) gin.HandlerFunc {
	return newLoggingMiddleware(cfg)
}


func CreateRecoveryMiddleware(cfg *config.ErrorConfig) gin.HandlerFunc {
	return newRecoveryMiddleware(cfg)
} 


