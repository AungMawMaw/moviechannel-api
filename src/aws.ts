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
  PutItemCommandInput,
  PutItemCommand,
  IndexNotFoundException,
  TableNotFoundException,
  AttributeValue,
  DeleteItemCommandOutput,
  UpdateItemCommandOutput,
  PutItemCommandOutput,
  GetItemCommandOutput,
  GetItemCommandInput,
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
  } catch (e) {
    if (e instanceof TableNotFoundException) {
      console.error("Table  does not exist:", e);
      throw e;
    } else {
      console.error(`Error describing table ${tableName} record:`, e);
      throw e; // Re-throw other errors
    }
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
export const dynamodb_createRecord = async <T>(
  tableName: string,
  data: T,
): Promise<PutItemCommandOutput> => {
  try {
    const params: PutItemCommandInput = {
      TableName: tableName,
      Item: marshall(data),
    };
    const command = new PutItemCommand(params);
    const result = await client.send(command);
    console.log("Record created", result);
    return result;
  } catch (e) {
    console.error("Error creating record:", e);
    throw e;
  }
};

export const dynamodb_updateItem = async (
  tablename: string,
  Marshalled_KEY: Record<string, AttributeValue>, // Assuming movieId is the primary key of the movie record =>  marshall({ movieId: key_id })
  updatedAttributes: Record<string, any>, // Object containing the attributes to update
): Promise<UpdateItemCommandOutput> => {
  try {
    const updateExpression =
      "SET " +
      Object.keys(updatedAttributes)
        .map((attribute) => `${attribute} = :${attribute}`)
        .join(", ");

    // Explicitly defining the type for expressionAttributeValues
    const expressionAttributeValues: Record<string, any> = {};
    for (const [key, value] of Object.entries(updatedAttributes)) {
      expressionAttributeValues[`:${key}`] = value;
    }

    const params: UpdateItemCommandInput = {
      TableName: tablename,
      Key: Marshalled_KEY, // Marshall the primary key
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: marshall(expressionAttributeValues), // Marshall the attribute values object
    };

    const command = new UpdateItemCommand(params);
    const result = await client.send(command);
    console.log("record updated", result);
    return result;
  } catch (e) {
    if (e instanceof IndexNotFoundException) {
      console.error("IndexNotFound - provided key does not exist:", e);
      // Handle the case where the provided key does not exist
      // For example, you can log a message or return an appropriate response
      throw e;
    } else {
      console.error("Error updating record:", e);
      throw e; // Re-throw other errors
    }
  }
};
// export const dynamodb_updateRecord = async <T>(
//   tableName: string,
//   data: T,
// ) => {
//   try {
//     const params: UpdateItemCommandInput= {
//       TableName: tableName,
//       Key: marshall({
//         twitterId: tweeterId,
//       }),
//       UpdateExpression:
//         "set #tweets = list_append(if_not_exists(#tweets, :empty_list), :tweet), #updated = :updated",
//       ExpressionAttributeNames: {
//         "#tweets": "tweets",
//         "#updated": "updated",
//       },
//       ExpressionAttributeValues: marshall({
//         ":tweet": [tweet],
//         ":updated": Date.now(),
//         ":empty_list": [],
//       }),
//     };
//     const command = new PutItemCommand(params);
//     const result = await client.send(command);
//     console.log("Record created", result);
//     return result;
//   } catch (e) {
//     console.error("Error creating record:", e);
//     throw e;
//   }
// };
export const dynamodb_deleteItem = async (
  tableName: string,
  Marshalled_KEY: Record<string, AttributeValue>, // Assuming movieId is the primary key of the movie record =>  marshall({ movieId: key_id })
): Promise<DeleteItemCommandOutput> => {
  try {
    const params: DeleteItemCommandInput = {
      TableName: tableName,
      Key: Marshalled_KEY, // Provide the primary key of the item to delete
    };

    const command = new DeleteItemCommand(params);
    const result = await client.send(command);
    console.log("Movie record deleted", result);
    return result;
  } catch (e) {
    if (e instanceof IndexNotFoundException) {
      console.error("the provided key does not exist:", e);
      throw e;
      // Handle the case where the provided key does not exist
      // For example, you can log a message or return an appropriate response
    } else {
      console.error("Error deleting movie record:", e);
      throw e; // Re-throw other errors
    }
  }
};

export const dynamodb_getItem = async (
  tableName: string,
  Marshalled_KEY: Record<string, AttributeValue>, // Assuming movieId is the primary key of the movie record =>  marshall({ movieId: key_id })
): Promise<GetItemCommandOutput> => {
  try {
    const params: GetItemCommandInput = {
      TableName: tableName,
      Key: Marshalled_KEY, // Provide the primary key of the item to delete
    };

    const command = new DeleteItemCommand(params);
    const result = await client.send(command);
    console.log(" record ", result);
    return result;
  } catch (e) {
    if (e instanceof IndexNotFoundException) {
      console.error("the provided key does not exist:", e);
      throw e;
      // Handle the case where the provided key does not exist
      // For example, you can log a message or return an appropriate response
    } else {
      console.error("Error get record:", e);
      throw e; // Re-throw other errors
    }
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
      const results = await Promise.all(sendMovieCall);
      const filteredResults = results.filter((result) => result !== null);
      return filteredResults;
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
