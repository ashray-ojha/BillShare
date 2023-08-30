const AWS = require("aws-sdk");
const s3BucketName = "term-bucket-ashish";
const REGION = "us-east-1";

exports.handler = async (event) => {
  const imageData = event.imageData;
  const fileName = event.fileName;

  const s3 = new AWS.S3({ region: REGION });

  try {
    console.log("imageiiiiiiiiiiiiii", imageData);
    const params = {
      Bucket: s3BucketName,
      Key: fileName,
      Body: imageData,
      ContentType: "image/jpeg",
      ContentEncoding: "base64",
    };

    await s3.putObject(params).promise();
    const response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "*",
      },
      body: fileName,
    };

    return response;
  } catch (error) {
    const errorResponse = {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "*",
      },
      error: error,
    };

    return errorResponse;
  }
};
