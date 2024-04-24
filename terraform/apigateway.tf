## WEBSOCKET API GATEWAY V2
resource "aws_apigatewayv2_api" "websocket_gw" {
  name                       = "${var.app_name}-websocket"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
}

### integration
resource "aws_apigatewayv2_integration" "connect" {
  api_id             = aws_apigatewayv2_api.websocket_gw.id
  integration_uri    = aws_lambda_function.connect.invoke_arn
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
}
resource "aws_apigatewayv2_integration" "disconnect" {
  api_id             = aws_apigatewayv2_api.websocket_gw.id
  integration_uri    = aws_lambda_function.disconnect.invoke_arn
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
}

resource "aws_apigatewayv2_integration" "sendmovie" {
  api_id             = aws_apigatewayv2_api.websocket_gw.id
  integration_uri    = aws_lambda_function.sendmovie.invoke_arn
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
}
## end of integrtion

### ROUTE
resource "aws_apigatewayv2_route" "_connect" {
  api_id    = aws_apigatewayv2_api.websocket_gw.id
  route_key = "$connect"
  target    = "integrations/${aws_apigatewayv2_integration.connect.id}"
}

resource "aws_apigatewayv2_route" "_disconnect" {
  api_id    = aws_apigatewayv2_api.websocket_gw.id
  route_key = "$disconnect"
  target    = "integrations/${aws_apigatewayv2_integration.disconnect.id}"
}
resource "aws_apigatewayv2_route" "_sendmovie" {
  api_id    = aws_apigatewayv2_api.websocket_gw.id
  route_key = "sendmovie"
  ##NOTE: not $sendmovie
  target = "integrations/${aws_apigatewayv2_integration.sendmovie.id}"
}
# end of route

#STAGE
resource "aws_apigatewayv2_stage" "primary_websocket" {
  name        = var.api_gateway_stage_name
  api_id      = aws_apigatewayv2_api.websocket_gw.id
  auto_deploy = true
}




#HTTP APIGATEWAY
resource "aws_apigatewayv2_api" "http_gw" {
  name          = "${var.app_name}-http"
  protocol_type = "HTTP"
  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["POST", "GET", "OPTIONS"]
    allow_headers = ["content-type"]
  }
}

### integration
resource "aws_apigatewayv2_integration" "getmovies" {
  api_id             = aws_apigatewayv2_api.http_gw.id
  integration_uri    = aws_lambda_function.getmovies.invoke_arn
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
}
### ROUTE
resource "aws_apigatewayv2_route" "_getmovies" {
  api_id    = aws_apigatewayv2_api.http_gw.id
  route_key = "GET /moviess"
  target    = "integrations/${aws_apigatewayv2_integration.getmovies.id}"
}
# //////////////////////////////////////////////
### Integration for GET /movies
resource "aws_apigatewayv2_integration" "getMoviesIntegration" {
  api_id             = aws_apigatewayv2_api.http_gw.id
  integration_uri    = aws_lambda_function.crudmovies.invoke_arn
  integration_type   = "AWS_PROXY"
  integration_method = "POST" # This is just a placeholder, as AWS_PROXY doesn't use this value for Lambda integrations
}

### Integration for POST /movies
resource "aws_apigatewayv2_integration" "createMovieIntegration" {
  api_id             = aws_apigatewayv2_api.http_gw.id
  integration_uri    = aws_lambda_function.crudmovies.invoke_arn
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
}

### Integration for PUT /movies/{id}
resource "aws_apigatewayv2_integration" "updateMovieIntegration" {
  api_id             = aws_apigatewayv2_api.http_gw.id
  integration_uri    = aws_lambda_function.crudmovies.invoke_arn
  integration_type   = "AWS_PROXY"
  integration_method = "POST" # You may want to change this to PUT if your Lambda function supports it
}

### Integration for DELETE /movies/{id}
resource "aws_apigatewayv2_integration" "deleteMovieIntegration" {
  api_id             = aws_apigatewayv2_api.http_gw.id
  integration_uri    = aws_lambda_function.crudmovies.invoke_arn
  integration_type   = "AWS_PROXY"
  integration_method = "POST" # You may want to change this to DELETE if your Lambda function supports it
}

### ROUTES
resource "aws_apigatewayv2_route" "_getMoviesRoute" {
  api_id    = aws_apigatewayv2_api.http_gw.id
  route_key = "GET /movies"
  target    = "integrations/${aws_apigatewayv2_integration.getMoviesIntegration.id}"
}

resource "aws_apigatewayv2_route" "_createMovieRoute" {
  api_id    = aws_apigatewayv2_api.http_gw.id
  route_key = "POST /movies"
  target    = "integrations/${aws_apigatewayv2_integration.createMovieIntegration.id}"
}

resource "aws_apigatewayv2_route" "_updateMovieRoute" {
  api_id    = aws_apigatewayv2_api.http_gw.id
  route_key = "PUT /movies/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.updateMovieIntegration.id}"
}

resource "aws_apigatewayv2_route" "_deleteMovieRoute" {
  api_id    = aws_apigatewayv2_api.http_gw.id
  route_key = "DELETE /movies/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.deleteMovieIntegration.id}"
}
###############################################

#STAGE
resource "aws_apigatewayv2_stage" "primary_http" {
  name        = var.api_gateway_stage_name
  api_id      = aws_apigatewayv2_api.http_gw.id
  auto_deploy = true
}

