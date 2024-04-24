import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { dynamodb_AddConnection, dynamodb_RemoveConnection } from "./aws";

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const tableName =
    process.env.AWS_WEBSOCKET_TABLE_NAME ?? "websocket-connections";
  const connectionId = event.requestContext.connectionId ?? "";
  console.log("attempt user", connectionId);

  const res = await dynamodb_RemoveConnection(tableName, connectionId);
  if (res instanceof Error) {
    console.log("error", res.message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        Headers: {
          "content-type": "text/plain; charset=utf-8",
        },
        body: res.message,
      }),
    };
  }
  console.log("disconnected");
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `User ${connectionId} disconnected`,
    }),
  };
};
