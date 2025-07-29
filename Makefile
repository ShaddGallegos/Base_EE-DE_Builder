# EE-DE Builder - Simple Development Makefile

.PHONY: help setup dev backend frontend stop clean

# Configuration
PYTHON := python3
VENV_DIR := venv
BACKEND_DIR := backend
FRONTEND_DIR := frontend
CHECK_VENV := @test -f $(VENV_DIR)/bin/activate || (echo "❌ Run 'make setup' first to create the virtualenv"; exit 1)

## Show available commands
help:
	@echo "EE-DE Builder Development Commands:"
	@echo ""
	@echo "  setup      - Install all dependencies (run once)"
	@echo "  dev        - Start both backend and frontend servers"
	@echo "  backend    - Start only backend server"
	@echo "  frontend   - Start only frontend server" 
	@echo "  stop       - Stop all development servers"
	@echo "  clean      - Clean build artifacts"
	@echo ""
	@echo "Quick start: make setup && make dev"

## Install all dependencies
setup:
	@echo "Setting up development environment..."
	@if [ ! -d "$(VENV_DIR)" ]; then \
		$(PYTHON) -m venv $(VENV_DIR); \
		echo "✅ Created Python virtual environment"; \
	fi
	@$(VENV_DIR)/bin/pip install --upgrade pip
	@$(VENV_DIR)/bin/pip install -r $(CURDIR)/requirements.txt
	@echo "✅ Installed Python dependencies inside virtualenv"
	@cd $(FRONTEND_DIR) && npm install
	@echo "✅ Installed Node.js dependencies"
	@echo "✅ Setup complete! Run 'make dev' to start servers"

## Start both backend and frontend servers
dev: stop
	$(CHECK_VENV)
	@echo "Starting development servers..."
	@echo "Backend: http://localhost:8000"
	@echo "Frontend: http://localhost:3000"
	@echo "API Docs: http://localhost:8000/docs"
	@echo ""
	@cd $(BACKEND_DIR) && ../$(VENV_DIR)/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 &
	@sleep 2
	@cd $(FRONTEND_DIR)/src && npm start &
	@echo "Servers starting... Press Ctrl+C to stop"
	@wait

## Start only backend server
backend:
	$(CHECK_VENV)
	@echo "Starting backend server at http://localhost:8000"
	@cd $(BACKEND_DIR) && ../$(VENV_DIR)/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000

## Start only frontend server
frontend:
	@echo "Starting frontend server at http://localhost:3000"
	@cd $(FRONTEND_DIR)/src && npm start

## Stop all development servers
stop:
	@echo "Stopping backend (uvicorn)..."
	@ps aux | grep 'uvicorn app.main:app' | grep -v grep | awk '{print $$2}' | xargs -r kill
	@echo "Stopping React frontend (npm start)..."
	@ps aux | grep 'react-scripts start' | grep -v grep | awk '{print $$2}' | xargs -r kill
	@echo "✅ Servers stopped"

## Clean build artifacts
clean: stop
	@echo "Cleaning build artifacts..."
	@rm -rf $(FRONTEND_DIR)/build 2>/dev/null || true
	@rm -rf $(FRONTEND_DIR)/node_modules/.cache 2>/dev/null || true
	@find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
	@find . -name "*.pyc" -delete 2>/dev/null || true
	@echo "Cleaned up"
