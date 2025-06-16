# Go parameters
GOCMD=go
GOBUILD=$(GOCMD) build
GOCLEAN=$(GOCMD) clean
GOTEST=$(GOCMD) test
BINARY_NAME=go-template
MAIN_FILE=cmd/api/main.go

.PHONY: all build clean test run ent-generate

all: clean build

build:
	$(GOBUILD) -o $(BINARY_NAME) $(MAIN_FILE)

clean:
	$(GOCLEAN)
	rm -f $(BINARY_NAME)

test:
	$(GOTEST) -v ./tests/... -count=1

run: build
	./$(BINARY_NAME)

dev:
	$(GOCMD) run $(MAIN_FILE)

ent-generate:
	$(GOCMD) run entgo.io/ent/cmd/ent generate ./internal/ent/schema

help:
	@echo "Available commands:"
	@echo "  make build       - Build the application"
	@echo "  make clean       - Clean build files"
	@echo "  make test        - Run tests"
	@echo "  make run         - Build and run the application"
	@echo "  make dev         - Run in development mode"
	@echo "  make ent-generate - Generate Ent schema code"
