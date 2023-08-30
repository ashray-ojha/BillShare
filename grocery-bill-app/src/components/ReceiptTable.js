import React, { useState, useEffect } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import AWS from "aws-sdk";
import axios from "axios";

const ReceiptTable = ({ response, selectedImage }) => {
  const apiString = process.env.REACT_APP_API_GATEWAY_URL;
  const API_URL =
    "https://" + apiString + ".execute-api.us-east-1.amazonaws.com/prod/email";
  const AWS_REGION = "us-east-1";
  const API_KEY_ID = process.env.REACT_APP_API_GATEWAY_KEY_ID;

  const extractedFields = response?.extractedFields || [];
  const itemInfo = response?.itemInfo || {};
  let emailarray = [];
  const [emailMap, setEmailMap] = useState({});
  const [uniqueEmails, setUniqueEmails] = useState([]);
  const [isSubmitDisabled, setSubmitDisabled] = useState(true);
  const [topicArn, setTopicArn] = useState("");
  const [openImageModal, setOpenImageModal] = useState(false);

  const apiGateway = new AWS.APIGateway({ region: AWS_REGION });

  const getAPIKey = async (apiKeyId) => {
    const params = {
      apiKey: apiKeyId,
      includeValue: true,
    };

    try {
      const apiKeyResponse = await apiGateway.getApiKey(params).promise();
      if (apiKeyResponse.value) {
        return apiKeyResponse.value;
      } else {
        console.error("API key not found or value not available");
        return null;
      }
    } catch (error) {
      console.error("Error getting API key:", error);
      return null;
    }
  };

  useEffect(() => {
    const emails = Object.values(emailMap).filter(
      (email) => email.trim() !== ""
    );
    const uniqueEmailSet = new Set(emails);
    const uniqueEmailList = Array.from(uniqueEmailSet);
    setUniqueEmails(uniqueEmailList);
  }, [emailMap]);

  const handleEmailChange = (index, email) => {
    const lowerCaseEmail = email.toLowerCase();
    setEmailMap((prevMap) => ({
      ...prevMap,
      [index]: lowerCaseEmail,
    }));
  };

  const handleVerify = async () => {
    try {
      const apiKeyValue = await getAPIKey(API_KEY_ID);

      if (!apiKeyValue) {
        console.error("API key value is not available.");
        return;
      }
      const headers = {
        "Content-Type": "application/json",
        "x-api-key": apiKeyValue,
      };

      const response = await axios.post(
        API_URL,
        {
          type: "verify",
          emails: uniqueEmails,
        },
        { headers }
      );

      if (response.status === 200) {
        setSubmitDisabled(false);
        setTopicArn(response.data.body.topicArn);
        alert(
          "Verification emails sent successfully!! Please confirm the subscription before submitting the data."
        );
      } else {
        alert(`Email verification failed. Status ${response.status}`);
      }
    } catch (error) {
      console.error("Error verifying emails:", error);
      alert("Failed to verify emails. Please try again.");
    }
  };

  const handleSubmit = async () => {
    const { discount, tax } = itemInfo;
    const totalPricePerUser = {};
    extractedFields.forEach((item, index) => {
      const price = parseFloat(item.itemPrice);
      const email = emailMap[index];
      totalPricePerUser[email] = (totalPricePerUser[email] || 0) + price;
    });

    const totalPrice = Object.values(totalPricePerUser).reduce(
      (accumulator, price) => accumulator + price,
      0
    );

    const emailTotalPurchaseMap = {};
    for (const email in emailMap) {
      const item = extractedFields[email];
      const price = parseFloat(item.itemPrice);
      emailTotalPurchaseMap[emailMap[email]] =
        (emailTotalPurchaseMap[emailMap[email]] || 0) + price;
    }

    const percentageShares = {};
    for (const email in emailTotalPurchaseMap) {
      const totalPurchase = emailTotalPurchaseMap[email];
      percentageShares[email] = (totalPurchase / totalPrice) * 100;
    }

    const discountPerUser = {};
    const taxPerUser = {};
    for (const email in emailTotalPurchaseMap) {
      const percentageShare = percentageShares[email];
      discountPerUser[email] = discount
        ? (discount * percentageShare) / 100
        : 0;
      taxPerUser[email] = tax ? (tax * percentageShare) / 100 : 0;
    }

    for (const email in emailTotalPurchaseMap) {
      const price = emailTotalPurchaseMap[email];
      const finalPrice = price + taxPerUser[email] - discountPerUser[email];
      emailarray.push({ email: email, finalPrice: finalPrice.toFixed(2) });
    }

    const apiKeyValue = await getAPIKey(API_KEY_ID);

    if (!apiKeyValue) {
      console.error("API key value is not available.");
      return;
    }
    const headers = {
      "Content-Type": "application/json",
      "x-api-key": apiKeyValue,
    };

    const req = {
      type: "submit",
      users: emailarray,
      topicArn: topicArn,
    };

    try {
      const response = await axios.post(API_URL, req, { headers });

      if (response.status === 200) {
        emailarray = [];
        setEmailMap({});
        alert(`Notification Sent to users`);
      } else {
        emailarray = [];
        setEmailMap({});
        alert(`Retry: Status ${response.status}`);
      }
    } catch (error) {
      console.error("Error sending email:", error);
      emailarray = [];
      setEmailMap({});
      alert("Failed to send email. Please try again.");
    }
  };

  const handleOpenImageModal = () => {
    setOpenImageModal(true);
  };

  const handleCloseImageModal = () => {
    setOpenImageModal(false);
  };
  return (
    <Box mt={4}>
      <Box display="flex" justifyContent="center">
        <Paper sx={{ padding: 2, maxWidth: 500 }}>
          <Typography variant="h5" gutterBottom>
            Receipt Information
          </Typography>
          <Typography variant="body1" gutterBottom>
            Name: {itemInfo.name}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Address: {itemInfo.address}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Date: {itemInfo.date}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Subtotal: {itemInfo.subtotal}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Tax: {itemInfo.tax}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Total: {itemInfo.total}
          </Typography>
        </Paper>
      </Box>
      <Box mt={4} display="flex" justifyContent="center">
        <TableContainer component={Paper} sx={{ maxWidth: 500 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Item Name</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Email</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {extractedFields.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.itemName}</TableCell>
                  <TableCell>{item.itemPrice}</TableCell>
                  <TableCell>
                    <input
                      type="text"
                      value={emailMap[index] || ""}
                      onChange={(e) => handleEmailChange(index, e.target.value)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <Box mt={4} display="flex" justifyContent="center">
        {selectedImage && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenImageModal}
          >
            View Receipt Image
          </Button>
        )}
        <Button
          variant="contained"
          color="primary"
          onClick={handleVerify}
          style={{ marginLeft: "10px" }}
        >
          Verify
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          style={{ marginLeft: "10px" }}
        >
          Submit
        </Button>
      </Box>
      <Dialog open={openImageModal} onClose={handleCloseImageModal}>
        <DialogTitle>Receipt Image</DialogTitle>
        <DialogContent sx={{ textAlign: "center" }}>
          <img src={selectedImage} alt="Receipt" style={{ width: "100%" }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImageModal}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReceiptTable;
