resource "aws_lambda_function" "connect" {
  function_name = "${var.app_name}-connect"
  role          = aws_iam_role.lambda_main.arn
  image_uri     = "${local.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/connect:${var.image_tag}"
  package_type  = "Image"
  timeout       = 30
  environment {
    variables = {
      AWS_WEBSOCKET_TABLE_NAME = "${var.websocket_table_name}"
    }
  }
}
resource "aws_lambda_permission" "connect_permision" {
  function_name = aws_lambda_function.connect.function_name
  principal     = "apigateway.amazonaws.com"
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  source_arn    = "${aws_apigatewayv2_api.websocket_gw.execution_arn}/*/*"
}
#### end of lambda connect

resource "aws_lambda_function" "disconnect" {
  function_name = "${var.app_name}-disconnect"
  role          = aws_iam_role.lambda_main.arn
  image_uri     = "${local.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/disconnect:${var.image_tag}"
  package_type  = "Image"
  timeout       = 30
  environment {
    variables = {
      AWS_WEBSOCKET_TABLE_NAME = "${var.websocket_table_name}"
    }
  }
}
resource "aws_lambda_permission" "disconnect_permision" {
  function_name = aws_lambda_function.disconnect.function_name
  principal     = "apigateway.amazonaws.com"
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  source_arn    = "${aws_apigatewayv2_api.websocket_gw.execution_arn}/*/*"
}
#### end of lambda disconnect

resource "aws_lambda_function" "sendmovie" {
  function_name = "${var.app_name}-sendmovie"
  role          = aws_iam_role.lambda_main.arn
  image_uri     = "${local.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/sendmovie:${var.image_tag}"
  package_type  = "Image"
  timeout       = 30
  environment {
    variables = {
      # AWS_REGION               = "${var.aws_region}"
      AWS_WEBSOCKET_TABLE_NAME = "${var.websocket_table_name}"
      AWS_SQS_QUEUE_URL        = "https://sqs.ap-southeast-1.amazonaws.com/688217156264/movie_sqs_que"
      AWS_WEBSOCKET_URL        = "${aws_apigatewayv2_api.websocket_gw.api_endpoint}/${var.api_gateway_stage_name}"
    }
  }
}

resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn = "arn:aws:sqs:${var.aws_region}:${local.account_id}:${var.sqs_queue_name}"
  function_name    = aws_lambda_function.sendmovie.arn
}

resource "aws_lambda_permission" "sendmovie_permision" {
  statement_id = "AllowExecutionFromSQS"
  source_arn   = "arn:aws:sqs:${var.aws_region}:${local.account_id}:${var.sqs_queue_name}"

  function_name = aws_lambda_function.sendmovie.function_name
  principal     = "sqs.amazonaws.com"
  action        = "lambda:InvokeFunction"
}
#### end of lambda sendmovie

resource "aws_lambda_function" "getmovies" {
  function_name = "${var.app_name}-getmovies"
  role          = aws_iam_role.lambda_main.arn
  image_uri     = "${local.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/getmovies:${var.image_tag}"
  package_type  = "Image"
  timeout       = 30
  environment {
    variables = {
      AWS_TABLE_NAME = "${var.movie_table_name}"
    }
  }
}
resource "aws_lambda_permission" "getmovies_permision" {
  function_name = aws_lambda_function.getmovies.function_name
  principal     = "apigateway.amazonaws.com"
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  source_arn    = "${aws_apigatewayv2_api.http_gw.execution_arn}/*/*"
}

#### end of lambda getmovies

resource "aws_lambda_function" "crudmovies" {
  function_name = "${var.app_name}-crudmovies"
  role          = aws_iam_role.lambda_main.arn
  image_uri     = "${local.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/crudmovies:${var.image_tag}"
  package_type  = "Image"
  timeout       = 30
  environment {
    variables = {
      AWS_TABLE_NAME = "${var.movie_table_name}"
    }
  }
}
resource "aws_lambda_permission" "crudmovies_permision" {
  function_name = aws_lambda_function.crudmovies.function_name
  principal     = "apigateway.amazonaws.com"
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  source_arn    = "${aws_apigatewayv2_api.http_gw.execution_arn}/*/*"
}

#NOTE: uncomment => main.yml> ecr blah blah and git upload


