const {
  AnalyzeExpenseCommand,
  TextractClient,
} = require("@aws-sdk/client-textract");

const REGION = "us-east-1";
const textractClient = new TextractClient({
  region: REGION,
});

exports.handler = async (event, context) => {
  const bucket = "ashish-term-bucket-b00931967";
  const photoObjectName = event.fileName;

  try {
    const params = {
      Document: {
        S3Object: {
          Bucket: bucket,
          Name: photoObjectName,
        },
      },
    };

    const aExpense = new AnalyzeExpenseCommand(params);
    const response = await textractClient.send(aExpense);

    let res = {};

    const extractedFields = [];
    response.ExpenseDocuments.forEach((expenseDoc) => {
      expenseDoc.LineItemGroups.forEach((lineItemGroup) => {
        lineItemGroup.LineItems.forEach((lineItem) => {
          const lineItemInfo = {};
          lineItem.LineItemExpenseFields.forEach((expenseField) => {
            const type = expenseField.Type?.Text;
            const value = expenseField.ValueDetection?.Text;

            if (type === "ITEM") {
              lineItemInfo.itemName = value;
            } else if (type === "PRICE") {
              lineItemInfo.itemPrice = value;
            }
          });
          extractedFields.push(lineItemInfo);
        });
      });

      let itemInfo = {};
      const summaryFields = expenseDoc.SummaryFields;
      summaryFields.forEach((summaryField) => {
        const type = summaryField.Type?.Text;
        const value = summaryField.ValueDetection?.Text;

        if (type === "SUBTOTAL") {
          itemInfo.subtotal = value;
        } else if (type === "TAX") {
          itemInfo.tax = value;
        } else if (type === "DISCOUNT") {
          itemInfo.discount = value;
        } else if (type === "TOTAL") {
          itemInfo.total = value;
        } else if (type === "VENDOR_NAME") {
          itemInfo.name = value;
        } else if (type === "ADDRESS_BLOCK") {
          itemInfo.address = value;
        } else if (type === "INVOICE_RECEIPT_DATE") {
          itemInfo.date = value;
        }
      });
      res = {
        extractedFields: extractedFields,
        itemInfo: itemInfo,
      };
      // extractedFields.push(itemInfo);
    });

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "*",
      },
      body: res,
    };
  } catch (err) {
    console.log("Error", err);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "*",
      },
      error: err,
    };
  }
};
