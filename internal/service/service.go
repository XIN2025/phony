package service

import (
	"github.com/xin2025/go-template/internal/config"
	"github.com/xin2025/go-template/internal/repository"
)

// Service holds application dependencies
type Service struct {
	Store  *repository.Store
	Config *config.Config
}

// NewService initializes a new Service instance
func NewService(store *repository.Store, cfg *config.Config) *Service {
	return &Service{
		Store:  store,
		Config: cfg,
	}
}
