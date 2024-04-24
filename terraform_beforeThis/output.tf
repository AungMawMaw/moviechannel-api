output "aws_sqs_url" {
  value = aws_sqs_queue.sqs_queue.url
}
output "aws_sqs_name" {
  value = aws_sqs_queue.sqs_queue.name
}
