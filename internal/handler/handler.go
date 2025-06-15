package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/xin2025/go-template/pkg/response"
)

type Handler struct {

}

func NewHandler() *Handler {
	return &Handler{}
}


func (h *Handler) RegisterRoutes(router *gin.Engine) {

	v1 := router.Group("/api/v1")
	{

		v1.GET("/health", h.HealthCheck)
		

		users := v1.Group("/users")
		{
			users.POST("/register", h.RegisterUser)
			users.POST("/login", h.LoginUser)
		}
	}
}


func (h *Handler) HealthCheck(c *gin.Context) {
	response.Success(c, http.StatusOK, gin.H{
		"status": "ok",
		"version": "1.0.0",
	}, "Service is healthy")
}


func (h *Handler) RegisterUser(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required,min=3,max=50"`
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err, "Invalid request payload")
		return
	}


	response.Success(c, http.StatusCreated, gin.H{
		"username": req.Username,
		"email":    req.Email,
	}, "User registered successfully")
}


func (h *Handler) LoginUser(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err, "Invalid request payload")
		return
	}


	response.Success(c, http.StatusOK, gin.H{
		"message": "Login successful",
	}, "User logged in successfully")
} 
