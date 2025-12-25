# Terraform variables
# Usage: make apply e=production
# ENV options: develop, staging, production
# Note: environments/<env>/main.tf contains all modules (network, auth, etc.)
ENV ?= production
USECASE ?= ""  # Not required when using single main.tf per environment
TF_VERSION=1.14.3


# Determine terraform directory based on environment structure
# If environments/$(ENV) exists (single main.tf), use it; otherwise check environments/$(ENV)/$(USECASE) or usecases/$(USECASE)
TERRAFORM_DIR := $(shell if [ -f "environments/$(ENV)/main.tf" ]; then echo "environments/$(ENV)"; elif [ -d "environments/$(ENV)/$(USECASE)" ]; then echo "environments/$(ENV)/$(USECASE)"; else echo "usecases/$(USECASE)"; fi)

tfenv: ## change terraform version ## tfenv
	tfenv use ${TF_VERSION}

# Validate required arguments
check-args:
	@if [ -z "$(ENV)" ]; then \
		echo "Error: Environment (e) is required. Usage: make <command> e=<env>"; \
		echo "Valid environments: develop, staging, production"; \
		exit 1; \
	fi
	@if [ "$(ENV)" != "develop" ] && [ "$(ENV)" != "staging" ] && [ "$(ENV)" != "production" ]; then \
		echo "Error: Invalid environment '$(ENV)'. Valid environments: develop, staging, production"; \
		exit 1; \
	fi
	@if [ ! -d "$(TERRAFORM_DIR)" ] && [ ! -f "$(TERRAFORM_DIR)/main.tf" ]; then \
		echo "Error: Terraform directory '$(TERRAFORM_DIR)' does not exist or main.tf not found"; \
		exit 1; \
	fi

# Terraform commands
init: check-args ## initialize terraform ## make init e=production
	@echo "Initializing Terraform for environment: $(ENV)..."
	@echo "Terraform directory: $(TERRAFORM_DIR)"
	cd $(TERRAFORM_DIR) && terraform init

plan: check-args ## plan terraform ## make plan e=production
	@echo "Planning Terraform for environment: $(ENV)..."
	@echo "Terraform directory: $(TERRAFORM_DIR)"
	cd $(TERRAFORM_DIR) && terraform plan

apply: fmt check-args ## apply terraform ## make apply e=production
	@echo "Applying Terraform for environment: $(ENV)..."
	@echo "Terraform directory: $(TERRAFORM_DIR)"
	cd $(TERRAFORM_DIR) && terraform apply

destroy: check-args ## destroy terraform resources ## make destroy e=production
	@echo "Destroying Terraform resources for environment: $(ENV)..."
	@echo "Terraform directory: $(TERRAFORM_DIR)"
	cd $(TERRAFORM_DIR) && terraform destroy

validate: check-args ## validate terraform ## make validate e=production
	@echo "Validating Terraform for environment: $(ENV)..."
	@echo "Terraform directory: $(TERRAFORM_DIR)"
	cd $(TERRAFORM_DIR) && terraform validate

fmt: check-args ## format terraform files ## make fmt e=production
	@echo "Formatting Terraform files for environment: $(ENV)..."
	@echo "Terraform directory: $(TERRAFORM_DIR)"
	cd $(TERRAFORM_DIR) && terraform fmt -recursive

# Format all terraform files
fmt-all: ## format all terraform files ## make fmt-all
	@echo "Formatting all Terraform files..."
	terraform fmt -recursive

# Validate all terraform files
validate-all: ## validate all terraform files ## make validate-all
	@echo "Validating all Terraform files..."
	@find usecases -type f -name "*.tf" -exec terraform validate -chdir={\} \; 2>/dev/null || echo "Note: Some validations may require initialization"

# help で表示するためコマンドの定義は以下のように記述
# {コマンド}: ## {コマンドの説明} ## {引数使用の場合のコマンドを記述}
help: ## コマンド一覧を表示 ## make help
	@echo ""
	@echo "Command list:"
	@printf "\033[36m%-35s\033[0m %s\n" "[Sub command]" "[Description]"
	@grep -E '^[/a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | perl -pe 's%^([/a-zA-Z_-]+):.*?(##)%$$1 $$2%' | awk -F " *?## *?" '{printf "\033[36m%-35s\033[0m %s\n", $$3 ? $$3 : $$1, $$2}'
	@echo ''
