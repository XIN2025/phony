package response

import "github.com/gin-gonic/gin"

// ResponseFormatter defines how responses should be formatted
type ResponseFormatter interface {
	FormatSuccess(c *gin.Context, code int, data interface{}, message string)
	FormatError(c *gin.Context, code int, err error, message string)
}

// DefaultResponseFormatter is the default JSON response formatter
type DefaultResponseFormatter struct {
	// Customize the response structure
	StatusField  string
	MessageField string
	DataField    string
	ErrorField   string
}

// NewDefaultResponseFormatter creates a new default formatter
func NewDefaultResponseFormatter() *DefaultResponseFormatter {
	return &DefaultResponseFormatter{
		StatusField:  "status",
		MessageField: "message",
		DataField:    "data",
		ErrorField:   "error",
	}
}

// FormatSuccess formats a successful response
func (f *DefaultResponseFormatter) FormatSuccess(c *gin.Context, code int, data interface{}, message string) {
	response := make(map[string]interface{})
	response[f.StatusField] = "success"
	if message != "" {
		response[f.MessageField] = message
	}
	if data != nil {
		response[f.DataField] = data
	}
	c.JSON(code, response)
}

// FormatError formats an error response
func (f *DefaultResponseFormatter) FormatError(c *gin.Context, code int, err error, message string) {
	response := make(map[string]interface{})
	response[f.StatusField] = "error"
	if message != "" {
		response[f.MessageField] = message
	}
	if err != nil {
		response[f.ErrorField] = err.Error()
	}
	c.JSON(code, response)
}

// Global formatter instance
var formatter ResponseFormatter = NewDefaultResponseFormatter()

// SetFormatter sets the global response formatter
func SetFormatter(f ResponseFormatter) {
	formatter = f
}

// Success sends a successful response
func Success(c *gin.Context, code int, data interface{}, message string) {
	formatter.FormatSuccess(c, code, data, message)
}

// Error sends an error response
func Error(c *gin.Context, code int, err error, message string) {
	formatter.FormatError(c, code, err, message)
} 
