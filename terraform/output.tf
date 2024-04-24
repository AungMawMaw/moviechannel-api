output "movie-api-http_endpoint" {
  value = aws_apigatewayv2_api.http_gw.api_endpoint
}
output "movie-api-wss" {
  value = aws_apigatewayv2_api.websocket_gw.api_endpoint

}
