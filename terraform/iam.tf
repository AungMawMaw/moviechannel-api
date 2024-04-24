# arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

#create iam policy for lambda
data "aws_iam_policy_document" "assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]
    effect  = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

# iam role with policy for lambda
resource "aws_iam_role" "lambda_main" {
  name               = "${var.app_name}-lambda"
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy.json
}

# adding lambdaexecutionrole to lambda
resource "aws_iam_role_policy_attachment" "attach_exec_role" {
  role       = aws_iam_role.lambda_main.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}
#end of lambda

#create iampolicy
data "aws_iam_policy_document" "lambda_websocket" {
  statement {
    effect = "Allow"
    actions = [
      "execute-api:Invoke",
      "execute-api:ManageConnections",
      "dynamodb:DescribeTable",
      "dynamodb:Scan",
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
    ]
    resources = [
      "arn:aws:sqs:${var.aws_region}:${local.account_id}:${var.sqs_queue_name}",
      "arn:aws:dynamodb:${var.aws_region}:${local.account_id}:table/${var.websocket_table_name}",
      "arn:aws:dynamodb:${var.aws_region}:${local.account_id}:table/${var.movie_table_name}",
      "${aws_apigatewayv2_api.websocket_gw.execution_arn}/*",
    ]
  }

}

resource "aws_iam_policy" "lambda_websocket" {
  name   = "${var.app_name}-lambda-websocket"
  policy = data.aws_iam_policy_document.lambda_websocket.json
}

resource "aws_iam_role_policy_attachment" "lambda_websocket" {
  policy_arn = aws_iam_policy.lambda_websocket.arn
  role       = aws_iam_role.lambda_main.name
}
