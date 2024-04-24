import {
  DynamoDBClient,
  DescribeTableCommand,
  ScanCommand,
  ScanCommandOutput,
  UpdateItemCommand,
  DescribeTableCommandOutput,
  ScanCommandInput,
  UpdateItemCommandInput,
  DeleteItemCommand,
  DeleteItemCommandInput,
  InternalServerError,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import {
  SQSClient,
  DeleteMessageCommand,
  DeleteMessageCommandInput,
} from "@aws-sdk/client-sqs";
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
  PostToConnectionCommandInputType,
} from "@aws-sdk/client-apigatewaymanagementapi";
import dotenv from "dotenv";
dotenv.config();

const sqsClient = new SQSClient({ region: process.env.AWS_REGION });

const client = new DynamoDBClient({ region: process.env.AWS_REGION });

// Describe a table
export const dynamodb_descriveTable = async (
  tableName: string,
): Promise<DescribeTableCommandOutput> => {
  try {
    const command = new DescribeTableCommand({ TableName: tableName });
    const response = await client.send(command);
    console.log("Table retrieved", response.Table);
    return response;
  } catch (error) {
    console.error("Error describing table:", error);
    throw error;
  }
};

// Scan a table
export const dynamodb_scanTable = async function* (
  tableName: string,
  limit: number = 25,
  lastEvaluatedKey?: Record<string, any>,
): AsyncGenerator<ScanCommandOutput, void, InternalServerError> {
  while (true) {
    const params: ScanCommandInput = {
      TableName: tableName,
      Limit: limit,
      ExclusiveStartKey: lastEvaluatedKey,
    };
    try {
      const command = new ScanCommand(params);
      const result = await client.send(command);
      if (!result.Count) {
        return;
      }
      lastEvaluatedKey = result.LastEvaluatedKey;
      result.Items = result.Items!.map((item) => unmarshall(item));
      yield result;
    } catch (e) {
      console.error("Error scanning table:", e);
      throw e;
    }
  }
};

// Get all scan results
export const dynamodb_getAllScanResult = async <T>(
  tableName: string,
  limit: number = 25,
): Promise<T[]> => {
  try {
    await dynamodb_descriveTable(tableName);

    const scanTableGen = dynamodb_scanTable(tableName, limit);

    const results: T[] = [];
    let isDone = false;

    while (!isDone) {
      const { done, value } = await scanTableGen.next();
      if (done || !value!.LastEvaluatedKey) {
        isDone = true;
      }
      if (value) {
        value.Items!.forEach((result: any) => results.push(result));
      }
    }
    return results;
  } catch (e) {
    console.error("Error getting all scan results:", e);
    throw e;
  }
};

//NOTE: for websocket dynamodb table

export const dynamodb_AddConnection = async (
  tableName: string,
  connectionId: string,
) => {
  try {
    const params: UpdateItemCommandInput = {
      TableName: tableName,
      Key: marshall({
        connectionId: connectionId,
      }),
    };

    const command = new UpdateItemCommand(params);

    const result = await client.send(command);

    return result;
  } catch (e) {
    console.error("Error add connection:", e);
    throw e;
  }
};
export const dynamodb_RemoveConnection = async (
  tableName: string,
  connectionId: string,
) => {
  try {
    const params: DeleteItemCommandInput = {
      TableName: tableName,
      Key: marshall({
        connectionId: connectionId,
      }),
    };

    const command = new DeleteItemCommand(params);

    const result = await client.send(command);

    return result;
  } catch (e) {
    console.error("Error remove connection:", e);
    // throw e;
    return new Error("error remove connection unknown type");
  }
};

// NOTE: for SQS
export const sqsDeleteMsg = async (queueUrl: string, receiptHandle: string) => {
  try {
    // Construct parameters for DeleteQueueCommand
    const params: DeleteMessageCommandInput = {
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    };

    // Create a new DeleteQueueCommand with the parameters
    const command = new DeleteMessageCommand(params);

    // Delete the queue using the DeleteQueueCommand
    const result = await sqsClient.send(command);

    // Log the result if needed
    console.log("Queue deleted:", result);

    return result; // Optionally, you can return the result
  } catch (error) {
    console.error("Error deleting queue:", error);
    throw error;
  }
};
// NOTE: APIGATEWAY
interface BroadcastMessageWebsocketProps {
  apiGateway: ApiGatewayManagementApiClient;
  connections: any[];
  message: string;
  tableName: string;
}
export const broadcastMessageWebsocket = async (
  props: BroadcastMessageWebsocketProps,
) => {
  // const { apiGateway,connections,tableName,message} = props

  try {
    const sendMovieCall = props.connections?.map(async (connection) => {
      const { connectionId } = connection;
      try {
        const input: PostToConnectionCommandInputType = {
          // PostToConnectionRequest
          Data: props.message, //new Uint8Array(), // e.g. Buffer.from("") or new TextEncoder().encode("")   // required
          ConnectionId: connectionId.toString(), // required
        };
        const command = new PostToConnectionCommand(input);
        const res = await props.apiGateway.send(command);
        console.log(res);
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
      const res = await Promise.all(sendMovieCall);
      return res;
    } catch (e) {
      if (e instanceof Error) {
        return e;
      }
      return new Error(
        ` broadcastMessageWebsocket error obj unknown type Error`,
      );
    }
  } catch (e) {
    if (e instanceof Error) {
      return e;
    }
    return new Error(` broadcastMessageWebsocket error obj unknown type Error`);
  }
};
