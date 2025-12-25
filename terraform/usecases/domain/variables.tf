variable "root_domain" {
  description = "Root domain name for Route53 hosted zone (e.g., stockbit.click)"
  type        = string
}

variable "app_domain" {
  description = "App domain name for Route53 hosted zone (e.g., app.stockbit.click)"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

