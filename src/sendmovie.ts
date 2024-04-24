import { APIGatewayProxyResult, SQSEvent } from "aws-lambda";
import { ApiGatewayManagementApiClient } from "@aws-sdk/client-apigatewaymanagementapi";
import {
  broadcastMessageWebsocket,
  dynamodb_getAllScanResult,
  sqsDeleteMsg,
} from "./aws";

export const handler = async (
  event: SQSEvent,
): Promise<APIGatewayProxyResult> => {
  const WS_TABLE_NAME =
    process.env.AWS_WEBSOCKET_TABLE_NAME ??
    "moviechannel-websocket-connections";
  const SQS_URL =
    process.env.AWS_SQS_QUEUE_URL ??
    "https://sqs.ap-southeast-1.amazonaws.com/688217156264/movie_sqs_que";
  const WEBSOCKET_URL = process.env.AWS_WEBSOCKET_URL ?? "";

  const endpoint = new URL(WEBSOCKET_URL);
  const apiManagementApi = new ApiGatewayManagementApiClient({
    apiVersion: "2018-11-29",
    endpoint: endpoint.hostname + endpoint.pathname,
  });

  const message = event.Records[0].body;
  if (!message) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        Headers: {
          "content-type": "text/plain; charset=utf-8",
        },
        message: "event message empty or null",
      }),
    };
  }

  const dbRes = await dynamodb_getAllScanResult<{ connectionId: string }>(
    WS_TABLE_NAME,
  );
  if (dbRes instanceof Error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        Headers: {
          "content-type": "text/plain; charset=utf-8",
        },
        message: dbRes.message,
      }),
    };
  }
  console.log(
    `connections: ${JSON.stringify(dbRes)},\ntableName: ${WS_TABLE_NAME},\napiGateway: ${JSON.stringify(apiManagementApi)},\nmessage:${message}`,
  );

  const broadcastRes = await broadcastMessageWebsocket({
    apiGateway: apiManagementApi,
    tableName: WS_TABLE_NAME,
    message: message,
    connections: dbRes,
  });

  if (broadcastRes instanceof Error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        Headers: {
          "content-type": "text/plain; charset=utf-8",
        },
        message: broadcastRes.message,
      }),
    };
  }
  console.log(`sent message: ${message} to ${dbRes.length} users!`);
  console.log("broadcastRed", broadcastRes);
  console.log("broadcastRed2", JSON.stringify(broadcastRes));

  try {
    console.log(
      "Received message. Receipt handle:",
      event.Records[0].receiptHandle,
    );
    await sqsDeleteMsg(SQS_URL, event.Records[0].receiptHandle);
  } catch (e) {
    console.log("error at sqs del", e);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: ` sent message: ${message} to ${dbRes.length} users!`,
    }),
  };
};
