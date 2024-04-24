import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { marshall } from "@aws-sdk/util-dynamodb";
import {
  createMovie,
  deleteMovie,
  getMovie,
  getMovie_list,
  updateMovie,
} from "./Movies";

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const method = event.requestContext.http.method;
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
      return deleteMovie(resourceId);
    default:
      return {
        statusCode: 405,
        body: "Method not allowed",
      };
  }

  // TEST: v3
  ///////////////////////////////////////////////////////////////////////////
};
