import { APIGatewayProxyResult, SQSEvent } from "aws-lambda";
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
  PostToConnectionCommandInputType,
} from "@aws-sdk/client-apigatewaymanagementapi";
import {
  dynamodb_RemoveConnection,
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

  // const broadcastRes = await broadcastMessageWebsocket({
  //   apiGateway: apiManagementApi,
  //   tableName: WS_TABLE_NAME,
  //   message: message,
  //   connections: dbRes,
  // });
  //
  let broadcastRes;
  const props = {
    apiGateway: apiManagementApi,
    tableName: WS_TABLE_NAME,
    message: message,
    connections: dbRes,
  };

  try {
    const sendMovieCall = props.connections?.map(async (connection) => {
      const { connectionId } = connection;
      try {
        console.log("connectionID", connectionId);

        const input: PostToConnectionCommandInputType = {
          // PostToConnectionRequest
          Data: props.message, //new Uint8Array(), // e.g. Buffer.from("") or new TextEncoder().encode("")   // required
          ConnectionId: connectionId.toString(), // required
        };

        console.log("input", input);
        const command = new PostToConnectionCommand(input);

        console.log("command", command);
        const res = await props.apiGateway.send(command);
        console.log("result", res);
        return res;
      } catch (e) {
        if ((e as any).statusCode === 410) {
          console.log(`del statle connection, ${connectionId}`);
          const removeCon_res = await dynamodb_RemoveConnection(
            props.tableName,
            connectionId,
          );
          if (removeCon_res instanceof Error) {
            return e;
          } else {
            return e;
          }
        }
      }
    });

    try {
      const results = await Promise.all(sendMovieCall);
      // return results;
      console.log(results);
      const filteredResults = results.filter((result) => result !== null);
      console.log(filteredResults);
      // return filteredResults;
    } catch (e) {
      if (e instanceof Error) {
        // return e;
        console.log(e);
      }
      // return new Error(
      //   ` broadcastMessageWebsocket error obj unknown type Error`,
      //
      console.log(e);
    }
  } catch (e) {
    if (e instanceof Error) {
      console.log(e);
    }
    console.log(e);
  }

  //

  // if (broadcastRes instanceof Error) {
  //   return {
  //     statusCode: 500,
  //     body: JSON.stringify({
  //       Headers: {
  //         "content-type": "text/plain; charset=utf-8",
  //       },
  //       message: broadcastRes.message,
  //     }),
  //   };
  // }
  // console.log(`sent message: ${message} to ${dbRes.length} users!`);
  // console.log("broadcastRed", broadcastRes);
  // console.log("broadcastRed2", JSON.stringify(broadcastRes));

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
