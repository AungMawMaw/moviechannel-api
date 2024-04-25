import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { marshall } from "@aws-sdk/util-dynamodb";
import {
  BasRequest,
  createMovie,
  deleteMovie,
  getMovie,
  getMovie_list,
  updateMovie,
} from "./Movies";

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  // Check if event.requestContext.http is defined
  console.log(event);
  console.log(JSON.stringify(event));
  if (!event.requestContext || !event.requestContext.httpMethod) {
    return {
      statusCode: 400,
      body: "Bad request: requestContext or http property is missing",
    };
  }
  const method = event.requestContext.httpMethod;
  console.log(method);
  const resourceId = event.pathParameters?.id;

  switch (method) {
    case "POST":
      // Create operation
      const body = event.body;
      if (body) {
        return createMovie(body);
      }
    case "GET":
      // Read operation
      if (resourceId) {
        return getMovie(resourceId);
      } else {
        const page_limt = event.queryStringParameters?.limit;
        const lastEvaluatedKey = event.queryStringParameters?.lastEvaluatedKey
          ? marshall(JSON.parse(event.queryStringParameters?.lastEvaluatedKey))
          : undefined;

        return getMovie_list(page_limt, lastEvaluatedKey);
      }
    case "PUT":
      // Update operation
      return updateMovie(event.body);
    case "DELETE":
      // Delete operation
      if (resourceId) {
        return deleteMovie(resourceId);
      }
      BasRequest();
    default:
      return {
        statusCode: 405,
        body: "Method not allowed",
      };
  }
};
