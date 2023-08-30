const AWS = require("aws-sdk");
const sns = new AWS.SNS();

exports.handler = async (event, context) => {
  try {
    if (event.type === "submit") {
      const users = event.users;
      const emailContent = createEmailContent(users);

      const subject = "Update on Bill Split";
      const topicArn = event.topicArn;

      const params = {
        Message: emailContent,
        Subject: subject,
        TopicArn: topicArn,
      };

      await sns.publish(params).promise();
      console.log("Price details email sent successfully.");

      // Delete the SNS topic after sending the email
      await deleteSNSTopic(topicArn);

      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "*",
          "Access-Control-Allow-Headers": "*",
        },
        body: { message: "Prices sent successfully" },
      };
    } else if (event.type === "verify") {
      const emails = event.emails;
      const topicName = "BillSplitVerificationTopic";

      const createTopicParams = {
        Name: topicName,
      };

      const topicResult = await sns.createTopic(createTopicParams).promise();
      const topicArn = topicResult.TopicArn;

      const subscribePromises = emails.map((email) => {
        const subscribeParams = {
          Protocol: "email",
          TopicArn: topicArn,
          Endpoint: email,
        };
        return sns.subscribe(subscribeParams).promise();
      });

      await Promise.all(subscribePromises);

      console.log("Subscribed emails to verification topic:", emails);

      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "*",
          "Access-Control-Allow-Headers": "*",
        },
        body: { topicArn },
      };
    } else {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "*",
          "Access-Control-Allow-Headers": "*",
        },
        body: { message: "Invalid event type" },
      };
    }
  } catch (error) {
    console.error("Error processing event", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "*",
      },
      body: { message: "Error processing event", error },
    };
  }
};

function createEmailContent(users) {
  let emailContent =
    "Dear user,\n\nHere are the details of the bill split:\n\n\n";

  for (const user of users) {
    const { email, finalPrice } = user;
    emailContent += `Email: ${email} \t Final Price: ${finalPrice}\n\n`;
  }

  emailContent += "\n\nThank you!\n\n\nBest regards,\nAshish Ojha";

  return emailContent;
}

async function deleteSNSTopic(topicArn) {
  const deleteParams = {
    TopicArn: topicArn,
  };
  await sns.deleteTopic(deleteParams).promise();
  console.log(`SNS topic ${topicArn} deleted successfully.`);
}
