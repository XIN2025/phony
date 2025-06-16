package service

import (
	"github.com/xin2025/go-template/internal/config"
	"github.com/xin2025/go-template/internal/ent"
)

// Service holds application dependencies
type Service struct {
	Client *ent.Client
	Config *config.Config
}

// NewService initializes a new Service instance
func NewService(client *ent.Client, cfg *config.Config) *Service {
	return &Service{
		Client: client,
		Config: cfg,
	}
}
