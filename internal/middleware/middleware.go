package middleware

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/xin2025/go-template/internal/auth"
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
	skipPaths        []string
	logRequestBody   bool
	logResponseBody  bool
	additionalFields map[string]interface{}
}

func newLoggingMiddleware(cfg *config.LoggingConfig, options ...MiddlewareOption) gin.HandlerFunc {
	m := &loggingMiddleware{
		skipPaths:        cfg.SkipPaths,
		logRequestBody:   cfg.LogRequestBody,
		logResponseBody:  cfg.LogResponseBody,
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

		status := c.Writer.Status()
		if status >= 500 {
			logger.Error("Request processed",
				logger.String("path", path),
				logger.String("query", query),
				logger.Int("status", status),
				logger.String("method", c.Request.Method),
				logger.String("ip", c.ClientIP()),
				logger.Duration("latency", time.Since(start)),
			)
		} else if status >= 400 {
			logger.Warn("Request processed",
				logger.String("path", path),
				logger.String("query", query),
				logger.Int("status", status),
				logger.String("method", c.Request.Method),
				logger.String("ip", c.ClientIP()),
				logger.Duration("latency", time.Since(start)),
			)
		} else {
			logger.Info("Request processed",
				logger.String("path", path),
				logger.String("query", query),
				logger.Int("status", status),
				logger.String("method", c.Request.Method),
				logger.String("ip", c.ClientIP()),
				logger.Duration("latency", time.Since(start)),
			)
		}

		for k, v := range m.additionalFields {
			logger.Info("Additional field", logger.Any(k, v))
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


func AuthMiddleware(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header"})
			return
		}

		tokenString := parts[1]
		claims, err := auth.ValidateJWT(tokenString, cfg.JWT.Secret)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			return
		}

		c.Set("user_id", claims.UserID)
		c.Next()
	}
}
