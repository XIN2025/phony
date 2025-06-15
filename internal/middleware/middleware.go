package middleware

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/xin2025/go-template/internal/config"
	"github.com/xin2025/go-template/pkg/logger"
)

// MiddlewareOption is a function that modifies middleware behavior
type MiddlewareOption func(interface{})

// WithSkipPaths sets the paths to skip in logging middleware
func WithSkipPaths(paths []string) MiddlewareOption {
	return func(m interface{}) {
		if logging, ok := m.(*loggingMiddleware); ok {
			logging.skipPaths = paths
		}
	}
}

// WithLogRequestBody enables/disables request body logging
func WithLogRequestBody(log bool) MiddlewareOption {
	return func(m interface{}) {
		if logging, ok := m.(*loggingMiddleware); ok {
			logging.logRequestBody = log
		}
	}
}

// WithLogResponseBody enables/disables response body logging
func WithLogResponseBody(log bool) MiddlewareOption {
	return func(m interface{}) {
		if logging, ok := m.(*loggingMiddleware); ok {
			logging.logResponseBody = log
		}
	}
}

// WithAdditionalFields adds custom fields to logs
func WithAdditionalFields(fields map[string]interface{}) MiddlewareOption {
	return func(m interface{}) {
		if logging, ok := m.(*loggingMiddleware); ok {
			logging.additionalFields = fields
		}
	}
}

// loggingMiddleware handles request logging
type loggingMiddleware struct {
	skipPaths       []string
	logRequestBody  bool
	logResponseBody bool
	additionalFields map[string]interface{}
}

// newLoggingMiddleware creates a new logging middleware
func newLoggingMiddleware(cfg *config.LoggingConfig, options ...MiddlewareOption) gin.HandlerFunc {
	m := &loggingMiddleware{
		skipPaths:       cfg.SkipPaths,
		logRequestBody:  cfg.LogRequestBody,
		logResponseBody: cfg.LogResponseBody,
		additionalFields: cfg.AdditionalFields,
	}

	// Apply custom options
	for _, option := range options {
		option(m)
	}

	return func(c *gin.Context) {
		// Skip logging for specified paths
		for _, path := range m.skipPaths {
			if c.Request.URL.Path == path {
				c.Next()
				return
			}
		}

		start := time.Now()
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery

		// Process request
		c.Next()

		// Log request details
		logger.Info("Request processed",
			logger.String("path", path),
			logger.String("query", query),
			logger.Int("status", c.Writer.Status()),
			logger.String("method", c.Request.Method),
			logger.String("ip", c.ClientIP()),
			logger.Duration("latency", time.Since(start)),
		)

		// Add custom fields
		for k, v := range m.additionalFields {
			logger.Info("Additional field", logger.Any(k, v))
		}

		// Log request/response bodies if enabled
		if m.logRequestBody && c.Request.Body != nil {
			// Implementation for request body logging
		}
		if m.logResponseBody && c.Writer != nil {
			// Implementation for response body logging
		}
	}
}

// recoveryMiddleware handles panic recovery
type recoveryMiddleware struct {
	logStack bool
}

// newRecoveryMiddleware creates a new recovery middleware
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
					// Add stack trace to fields
				}

				c.AbortWithStatus(http.StatusInternalServerError)
			}
		}()
		c.Next()
	}
}

// CreateLoggingMiddleware creates a logging middleware with the given configuration
func CreateLoggingMiddleware(cfg *config.LoggingConfig) gin.HandlerFunc {
	return newLoggingMiddleware(cfg)
}

// CreateRecoveryMiddleware creates a recovery middleware with the given configuration
func CreateRecoveryMiddleware(cfg *config.ErrorConfig) gin.HandlerFunc {
	return newRecoveryMiddleware(cfg)
} 


