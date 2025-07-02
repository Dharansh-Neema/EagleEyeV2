"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  LinearProgress,
  Divider,
  Tooltip,
  Card,
  CardContent,
  CardHeader,
  CardActions,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import ImageIcon from "@mui/icons-material/Image";
import InfoIcon from "@mui/icons-material/Info";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";

const UploadBox = styled(Paper)(({ theme, isdragactive }) => ({
  border: `2px dashed ${isdragactive ? theme.palette.primary.main : "#bdbdbd"}`,
  background: isdragactive ? "#e3f2fd" : "#fafafa",
  borderRadius: 16,
  padding: theme.spacing(6, 2),
  textAlign: "center",
  cursor: "pointer",
  transition: "all 0.3s ease",
  minHeight: 220,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: theme.spacing(2),
  "&:hover": {
    borderColor: theme.palette.primary.main,
    background: "#f5f9ff",
  },
}));

const ImagePreview = styled("img")({
  width: 80,
  height: 80,
  objectFit: "cover",
  borderRadius: 8,
  border: "1px solid #e0e0e0",
  boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
});

const FilePreviewCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(1),
  border: "1px solid #e0e0e0",
  borderRadius: 8,
  transition: "all 0.2s ease",
  "&:hover": {
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
}));

const MAX_FILES = 50;
const MAX_FILE_SIZE_MB = 100;

export default function UploadTrainingData() {
  const router = useRouter();

  // --- State ---
  const [projectId, setProjectId] = useState("");
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState("");
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState("");
  const [files, setFiles] = useState([]);
  const [loadingStations, setLoadingStations] = useState(false);
  const [loadingCameras, setLoadingCameras] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef();

  // --- Get projectId ---
  useEffect(() => {
    let pid = sessionStorage.getItem("selectedProjectId");
    if (!pid) {
      const url = new URL(window.location.href);
      pid = url.searchParams.get("projectId");
      if (pid) {
        sessionStorage.setItem("selectedProjectId", pid);
      }
    }
    if (!pid) {
      setError("No project selected. Please go back and select a project.");
    } else {
      setProjectId(pid);
    }
  }, []);

  // --- Fetch inspection stations ---
  useEffect(() => {
    if (!projectId) return;
    setLoadingStations(true);
    setError("");
    setStations([]);
    setSelectedStation("");
    setCameras([]);
    setSelectedCamera("");
    setFiles([]);
    axios
      .post(
        "/api/inspection-stations/project",
        { projectId },
        { withCredentials: true }
      )
      .then((res) => {
        if (res.data.success) {
          setStations(res.data.data);
        } else {
          setError("Failed to fetch inspection stations");
        }
      })
      .catch(() => setError("Failed to fetch inspection stations"))
      .finally(() => setLoadingStations(false));
  }, [projectId]);

  // --- Fetch cameras ---
  useEffect(() => {
    if (!selectedStation) {
      setCameras([]);
      setSelectedCamera("");
      setFiles([]);
      return;
    }
    setLoadingCameras(true);
    setError("");
    setCameras([]);
    setSelectedCamera("");
    setFiles([]);
    axios
      .post(
        "/api/cameras/station",
        { stationId: selectedStation },
        { withCredentials: true }
      )
      .then((res) => {
        if (res.data.success) {
          setCameras(res.data.data);
        } else {
          setError("Failed to fetch cameras");
        }
      })
      .catch(() => setError("Failed to fetch cameras"))
      .finally(() => setLoadingCameras(false));
  }, [selectedStation]);

  // --- File Handling ---
  const validateAndAddFiles = (newFiles) => {
    let validFiles = [];
    let errorMsg = "";
    const allFiles = [...files];
    for (let file of newFiles) {
      if (!file.type.startsWith("image/")) {
        errorMsg = "Only image files are allowed.";
        continue;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        errorMsg = `File ${file.name} is too large (max ${MAX_FILE_SIZE_MB}MB).`;
        continue;
      }
      if (allFiles.find((f) => f.name === file.name && f.size === file.size)) {
        errorMsg = `File ${file.name} is already selected.`;
        continue;
      }
      validFiles.push(file);
      allFiles.push(file);
    }
    if (allFiles.length > MAX_FILES) {
      errorMsg = `You can upload up to ${MAX_FILES} images at once.`;
      validFiles = validFiles.slice(0, MAX_FILES - files.length);
    }
    if (errorMsg) setFileError(errorMsg);
    else setFileError("");
    if (validFiles.length > 0) setFiles((prev) => [...prev, ...validFiles]);
  };

  const handleFileChange = (e) => {
    validateAndAddFiles(Array.from(e.target.files || []));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleRemoveFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };
  const handleRemoveAll = () => {
    setFiles([]);
  };

  // --- Upload ---
  const handleUpload = async () => {
    if (!selectedCamera || files.length === 0) return;
    setUploading(true);
    setProgress(0);
    setError("");
    setSuccess("");
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("image", file));
      const res = await axios.post(
        `/api/images/upload?cameraId=${selectedCamera}`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            if (e.total) setProgress(Math.round((e.loaded * 100) / e.total));
          },
        }
      );
      if (res.data.success) {
        setSuccess(`Successfully uploaded ${res.data.count} images!`);
        setFiles([]);
      } else {
        setError(res.data.message || "Upload failed");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  // --- Render ---
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc" }}>
      {/* Header */}
      <Box sx={{ bgcolor: "white", borderBottom: "1px solid #e5e7eb" }}>
        <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: "flex", alignItems: "center", py: 2 }}>
            <Button
              variant="text"
              onClick={() => router.back()}
              startIcon={<ArrowBackIcon />}
              sx={{ mr: 2 }}
            >
              Back
            </Button>
            <Box>
              <Typography variant="h5" fontWeight={600} color="text.primary">
                Upload Training Data
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add training data
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ maxWidth: "100%", mx: "auto", px: { xs: 2, sm: 4 }, py: 4 }}>
        <Grid container spacing={4}>
          {/* Left Column - Station & Camera Selection */}
          <Grid item xs={12} md={3}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Inspection Station Selection */}
              <Card sx={{ p: 3 }}>
                <CardHeader
                  title="Inspection Station"
                  subheader="Select the inspection station"
                  sx={{ pb: 2 }}
                />
                <CardContent sx={{ pt: 0 }}>
                  <FormControl
                    fullWidth
                    disabled={loadingStations || !projectId}
                  >
                    <InputLabel>Inspection Station *</InputLabel>
                    <Select
                      value={selectedStation}
                      label="Inspection Station *"
                      onChange={(e) => setSelectedStation(e.target.value)}
                    >
                      {stations.map((station) => (
                        <MenuItem key={station._id} value={station._id}>
                          {station.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {loadingStations && (
                    <CircularProgress size={20} sx={{ mt: 1 }} />
                  )}
                </CardContent>
              </Card>

              {/* Camera Selection */}
              <Card sx={{ p: 3 }}>
                <CardHeader
                  title="Camera"
                  subheader="Select the camera"
                  sx={{ pb: 2 }}
                />
                <CardContent sx={{ pt: 0 }}>
                  <FormControl
                    fullWidth
                    disabled={!selectedStation || loadingCameras}
                  >
                    <InputLabel>Camera *</InputLabel>
                    <Select
                      value={selectedCamera}
                      label="Camera *"
                      onChange={(e) => setSelectedCamera(e.target.value)}
                    >
                      {cameras.map((cam) => (
                        <MenuItem key={cam._id} value={cam._id}>
                          {cam.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {loadingCameras && (
                    <CircularProgress size={20} sx={{ mt: 1 }} />
                  )}
                </CardContent>
              </Card>

              {/* Upload Progress */}
              {uploading && (
                <Card sx={{ p: 3 }}>
                  <CardHeader title="Upload Progress" sx={{ pb: 2 }} />
                  <CardContent sx={{ pt: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ flex: 1 }}
                      >
                        Uploading files...
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {progress}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={progress}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </CardContent>
                </Card>
              )}
            </Box>
          </Grid>

          {/* Center Column - Image Upload Space */}
          <Grid item xs={12} md={5}>
            <Card sx={{ p: 4, height: "fit-content" }}>
              <CardHeader
                title="Upload Images"
                subheader="Upload images for annotation and analysis"
                sx={{ pb: 3 }}
              />
              <CardContent sx={{ pt: 0 }}>
                <UploadBox
                  isdragactive={dragActive ? 1 : 0}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() =>
                    selectedCamera && fileInputRef.current?.click()
                  }
                  sx={{
                    opacity: selectedCamera ? 1 : 0.5,
                    pointerEvents: selectedCamera ? "auto" : "none",
                    minHeight: 400,
                    p: 6,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CloudUploadIcon
                    sx={{ fontSize: 80, color: "#1976d2", mb: 4 }}
                  />
                  <Typography
                    variant="h4"
                    fontWeight={600}
                    mb={3}
                    textAlign="center"
                  >
                    Drop images here or click to browse
                  </Typography>
                  <Typography
                    variant="h6"
                    color="text.secondary"
                    mb={4}
                    textAlign="center"
                  >
                    Support for JPEG, PNG, TIFF formats
                  </Typography>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<FolderOpenIcon />}
                    disabled={!selectedCamera}
                    sx={{ px: 6, py: 2, fontSize: "1.1rem" }}
                  >
                    Select Files
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                    disabled={!selectedCamera}
                  />
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mt: 3, textAlign: "center" }}
                  >
                    Max {MAX_FILES} files, {MAX_FILE_SIZE_MB}MB each
                  </Typography>
                </UploadBox>
                {fileError && (
                  <Alert severity="warning" sx={{ mt: 4 }}>
                    {fileError}
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column - Image Preview */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Card sx={{ p: 3 }}>
                <CardHeader
                  title="File Preview"
                  subheader={`${files.length} files selected for upload`}
                  action={
                    files.length > 0 && (
                      <Tooltip title="Remove all">
                        <IconButton
                          color="error"
                          onClick={handleRemoveAll}
                          size="large"
                        >
                          <ClearAllIcon />
                        </IconButton>
                      </Tooltip>
                    )
                  }
                  sx={{ pb: 2 }}
                />
                <CardContent sx={{ pt: 0 }}>
                  <Box sx={{ maxHeight: 500, overflowY: "auto" }}>
                    {files.length === 0 ? (
                      <Box
                        sx={{
                          textAlign: "center",
                          py: 6,
                          color: "text.secondary",
                        }}
                      >
                        <ImageIcon sx={{ fontSize: 64, mb: 3 }} />
                        <Typography variant="h6" mb={1}>
                          No files selected
                        </Typography>
                        <Typography variant="body2">
                          Select files to see previews here
                        </Typography>
                      </Box>
                    ) : (
                      files.map((file, index) => (
                        <FilePreviewCard key={index} sx={{ p: 3, mb: 2 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                            }}
                          >
                            <ImagePreview
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              sx={{ width: 100, height: 100 }}
                            />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="h6" fontWeight={600} noWrap>
                                {file.name}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 1 }}
                              >
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 0.5,
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  <strong>Camera:</strong>{" "}
                                  {cameras.find((c) => c._id === selectedCamera)
                                    ?.name || "Not selected"}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  <strong>Station:</strong>{" "}
                                  {stations.find(
                                    (s) => s._id === selectedStation
                                  )?.name || "Not selected"}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  <strong>Time:</strong>{" "}
                                  {new Date().toLocaleString()}
                                </Typography>
                              </Box>
                            </Box>
                            <Tooltip title="Remove">
                              <IconButton
                                size="large"
                                color="error"
                                onClick={() => handleRemoveFile(index)}
                                sx={{ ml: 1 }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </FilePreviewCard>
                      ))
                    )}
                  </Box>
                </CardContent>
              </Card>

              {/* Upload Actions */}
              {files.length > 0 && (
                <Card sx={{ p: 3 }}>
                  <CardHeader title="Upload Actions" sx={{ pb: 2 }} />
                  <CardContent sx={{ pt: 0 }}>
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                    >
                      <Typography
                        variant="h6"
                        color="text.secondary"
                        textAlign="center"
                      >
                        {files.length} files ready to upload
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        <Button
                          variant="contained"
                          size="large"
                          onClick={handleUpload}
                          disabled={
                            uploading || !selectedStation || !selectedCamera
                          }
                          startIcon={
                            uploading ? (
                              <CircularProgress size={20} />
                            ) : (
                              <CloudUploadIcon />
                            )
                          }
                          sx={{ py: 1.5 }}
                        >
                          {uploading ? "Uploading..." : "Upload Files"}
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={handleRemoveAll}
                          size="large"
                          sx={{ py: 1.5 }}
                        >
                          Clear All
                        </Button>
                      </Box>
                    </Box>
                    {(!selectedStation || !selectedCamera) && (
                      <Alert
                        severity="warning"
                        icon={<InfoIcon />}
                        sx={{ mt: 2 }}
                      >
                        Please select both station and camera before uploading
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}
            </Box>
          </Grid>
        </Grid>

        {/* Error and Success Messages */}
        {error && (
          <Alert
            severity="error"
            sx={{ mt: 4 }}
            icon={<ErrorIcon color="error" />}
          >
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            severity="success"
            sx={{ mt: 4 }}
            icon={<CheckCircleIcon color="success" />}
          >
            {success}
          </Alert>
        )}
      </Box>
    </Box>
  );
}
