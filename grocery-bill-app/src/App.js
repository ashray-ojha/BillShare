import React, { useState, useEffect } from "react";
import AWS from "aws-sdk";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import Container from "@mui/material/Container";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import ReceiptUploader from "./components/ReceiptUploader";
import ReceiptTable from "./components/ReceiptTable";
import axios from "axios";

const apiString = process.env.REACT_APP_API_GATEWAY_URL;
const API_ENDPOINT =
  "https://" + apiString + ".execute-api.us-east-1.amazonaws.com/prod/extract";
const AWS_REGION = "us-east-1";
const API_KEY_ID = process.env.REACT_APP_API_GATEWAY_KEY_ID;

const App = () => {
  const [isDataReceived, setIsDataReceived] = useState(false);
  const [data, setData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const navigate = useNavigate();

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

  const handleUpload = async (formData) => {
    setIsLoading(true);

    try {
      const apiKeyValue = await getAPIKey(API_KEY_ID);

      if (!apiKeyValue) {
        console.error("API key value is not available.");
        return;
      }

      const reqData = {
        fileName: formData,
      };

      const headers = {
        "Content-Type": "application/json",
        "x-api-key": apiKeyValue,
      };

      const response = await axios.post(API_ENDPOINT, reqData, { headers });

      if (response.status === 200) {
        setData(response.data.body);
        setIsDataReceived(true);
      } else {
        console.error("Error uploading image:", response.data); // Handle non-2xx responses
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Error uploading image:", error);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    const navigateToReceiptTable = () => {
      navigate("/table");
    };
    if (isDataReceived) {
      navigateToReceiptTable();
    }
  }, [isDataReceived, navigate]);

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            component={Link}
            to="/"
            style={{ textDecoration: "none", color: "white" }}
          >
            BillShare+
          </Typography>
        </Toolbar>
      </AppBar>
      <Container>
        <Routes>
          <Route
            path="/"
            element={
              <>
                {isLoading ? (
                  <CircularProgress
                    style={{
                      display: "block",
                      margin: "auto",
                      marginTop: "20px",
                    }}
                  />
                ) : (
                  <ReceiptUploader
                    onUpload={(formData) => {
                      handleUpload(formData);
                    }}
                    setSelectedImage={setSelectedImage}
                  />
                )}
              </>
            }
          />
          <Route
            path="/table"
            element={
              <ReceiptTable response={data} selectedImage={selectedImage} />
            }
          />
        </Routes>
      </Container>
    </>
  );
};

export default App;
