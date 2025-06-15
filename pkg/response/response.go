package response

import "github.com/gin-gonic/gin"


type ResponseFormatter interface {
	FormatSuccess(c *gin.Context, code int, data interface{}, message string)
	FormatError(c *gin.Context, code int, err error, message string)
}


type DefaultResponseFormatter struct {

	StatusField  string
	MessageField string
	DataField    string
	ErrorField   string
}


func NewDefaultResponseFormatter() *DefaultResponseFormatter {
	return &DefaultResponseFormatter{
		StatusField:  "status",
		MessageField: "message",
		DataField:    "data",
		ErrorField:   "error",
	}
}


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


var formatter ResponseFormatter = NewDefaultResponseFormatter()


func SetFormatter(f ResponseFormatter) {
	formatter = f
}


func Success(c *gin.Context, code int, data interface{}, message string) {
	formatter.FormatSuccess(c, code, data, message)
}


func Error(c *gin.Context, code int, err error, message string) {
	formatter.FormatError(c, code, err, message)
} 
