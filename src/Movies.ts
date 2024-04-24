import { APIGatewayProxyResult } from "aws-lambda";
import { dynamodb_scanTable } from "./aws";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import {
  ScanCommandOutput,
  InternalServerError,
} from "@aws-sdk/client-dynamodb";
import { Movie } from "./types/movies";

const TABLE_NAME = process.env.AWS_TABLE_NAME ?? "movies";

export const getMovie_list = async (
  page_limt?: string,
  lastEvaluatedKey?: any,
): Promise<APIGatewayProxyResult> => {
  let scanTabelGen: AsyncGenerator<
    ScanCommandOutput,
    void,
    InternalServerError
  >;
  try {
    scanTabelGen = dynamodb_scanTable(
      TABLE_NAME,
      Number(page_limt),
      lastEvaluatedKey,
    );
  } catch (e) {
    return {
      statusCode: 500,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "Access-Control-Allow-Header": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
      },
      body:
        e instanceof Error
          ? e.message
          : "dynamodb_scanTable return an unknown error",
    };
  }

  const iterator = await scanTabelGen?.next();
  if (iterator?.value) {
    return {
      statusCode: 200,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "Access-Control-Allow-Header": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
      },
      body: JSON.stringify({
        Items: iterator.value.Items,
        count: iterator.value.Count,
        lastEvaluatedKey: iterator.value.LastEvaluatedKey
          ? unmarshall(iterator.value.LastEvaluatedKey)
          : null,
      }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "Access-Control-Allow-Header": "Content-Type",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
    },
    body: JSON.stringify({
      Items: [],
      count: 0,
      lastEvaluatedKey: null,
    }),
  };
};

export const getMovie = async (id: string) => {
  return {
    statusCode: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "Access-Control-Allow-Header": "Content-Type",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
    },
    body: JSON.stringify({
      Item: id,
    }),
  };
};

export const createMovie = async (body?: any) => {
  const data: Movie = body;
  if (!data) {
    BasRequest();
  }
  return {
    statusCode: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "Access-Control-Allow-Header": "Content-Type",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
    },
    body: JSON.stringify({
      Item: body,
    }),
  };
};

export const updateMovie = async (body?: any) => {
  const { id } = body;
  const data: Movie = body;
  if (!(id && data)) {
    BasRequest();
  }
  return {
    statusCode: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "Access-Control-Allow-Header": "Content-Type",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
    },
    body: JSON.stringify({
      Item: body,
    }),
  };
};
export const deleteMovie = async (id?: string) => {
  if (!id) {
    BasRequest();
  }
  return {
    statusCode: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "Access-Control-Allow-Header": "Content-Type",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
    },
    body: JSON.stringify({
      Item: id,
    }),
  };
};

export const BasRequest = async () => {
  return {
    statusCode: 400,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "Access-Control-Allow-Header": "Content-Type",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
    },
    body: JSON.stringify({
      title: `BasRequest something is missing`,
    }),
  };
};
