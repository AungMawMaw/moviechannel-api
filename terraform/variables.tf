variable "app_name" {
  type        = string
  description = "Application Name"
  default     = "movies-api"
}

variable "websocket_table_name" {
  type        = string
  description = "Name of the web socket connection table in dynamo db"
  default     = "moviechannel-websocket-connections"
}

variable "sqs_queue_name" {
  type        = string
  description = "Queue name"
  default     = "movie_sqs_que"
}

variable "sqs_queue_url" {
  # type        = string
  description = "Queue url"
  default     = "https://sqs.ap-southeast-1.amazonaws.com/688217156264/movies_sqs"
}

variable "api_gateway_stage_name" {
  type    = string
  default = "primary"
}

variable "movie_table_name" {
  description = "Table name for dynamodb vendors"
  default     = "movies"
}

variable "image_tag" {}

variable "aws_region" {}
