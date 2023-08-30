import React, { useState } from "react";
import AWS from "aws-sdk";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import CircularProgress from "@mui/material/CircularProgress";

AWS.config.update({
  region: "us-east-1",
  credentials: new AWS.Credentials({
    accessKeyId: "ASIAUFJKIHQDGGZLQGT5",
    secretAccessKey: "e9Bk18sA1YBxscPofu3cL2HqxaBPTo8fYayVUHxb",
    sessionToken:
      "FwoGZXIvYXdzEFIaDEcDQMJ8IzSjyoynxiK8AcDtnxhH0xorrnMFCAEm04NrGeQ1L7jRcBmKtbnirBrk66F5AWL3KwfFTbduyjOGT4ggkVcXfUqyXMIR6yKuWIhjLY0xPLk2JN4ISj1Yq+M1ohltK5K0n4NK637DVhYvEcPIVRZjkUEhfcmNNaty4FGiyE4EJqNxAk2My3wFdX1ANDDeuIVjgZ1mY1AaJuu8uhnsOOJA64C6CiZumSW7crpx1RokKzlWexiPrz/A1uC0vcpK9B2WO91OKNl0KKTcpKYGMi37briHSRz5xZR2u2NNzU0MNIgzHXvRm2un8zDFx9ikJj2tKXRDXDkoLC4zyE4=",
  }),
});

const s3 = new AWS.S3();

const ReceiptUploader = ({ onUpload, setSelectedImage }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [openZoom, setOpenZoom] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setSelectedImage(URL.createObjectURL(e.target.files[0]));
  };

  const handleUpload = async () => {
    if (selectedFile) {
      setIsUploading(true);

      const fileName = selectedFile.name;

      try {
        const uploadParams = {
          Bucket: "ashish-term-bucket-b00931967",
          Key: fileName,
          Body: selectedFile,
        };

        const uploadResult = await s3.upload(uploadParams).promise();

        if (uploadResult && uploadResult.Location) {
          onUpload(fileName);
        } else {
          console.error("Error uploading image to S3.");
        }
      } catch (error) {
        console.error("Error uploading image:", error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleZoomOpen = () => {
    setOpenZoom(true);
  };

  const handleZoomClose = () => {
    setOpenZoom(false);
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: 4,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Upload Receipt Image
        </Typography>
        {selectedFile ? (
          <>
            <Card
              sx={{
                maxWidth: 400,
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                borderRadius: 8,
                marginBottom: 3,
                cursor: "pointer",
              }}
              onClick={handleZoomOpen}
            >
              <CardMedia
                component="img"
                image={URL.createObjectURL(selectedFile)}
                alt="Selected Receipt"
                height="300"
              />
            </Card>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Upload"
              )}
            </Button>
            <Dialog open={openZoom} onClose={handleZoomClose} maxWidth="lg">
              <DialogTitle>Zoomed Image</DialogTitle>
              <DialogContent sx={{ textAlign: "center" }}>
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="Zoomed Receipt"
                  style={{ width: "100%" }}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={handleZoomClose}>Close</Button>
              </DialogActions>
            </Dialog>
          </>
        ) : (
          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              marginBottom: 3,
            }}
          >
            <label htmlFor="upload-input">
              <input
                id="upload-input"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <Button
                variant="contained"
                color="primary"
                component="span"
                startIcon={<CloudUploadIcon />}
                sx={{ marginBottom: 3 }}
              >
                Select Image
              </Button>
            </label>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default ReceiptUploader;
