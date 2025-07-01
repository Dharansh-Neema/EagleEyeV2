"use client";
import React, { useState, useEffect, useRef } from "react";
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
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import ClearAllIcon from "@mui/icons-material/ClearAll";

const UploadBox = styled(Paper)(({ theme, isdragactive }) => ({
  border: `2px dashed ${isdragactive ? theme.palette.primary.main : "#bdbdbd"}`,
  background: isdragactive ? "#e3f2fd" : "#fafafa",
  borderRadius: 16,
  padding: theme.spacing(6, 2),
  textAlign: "center",
  cursor: "pointer",
  transition: "border 0.2s, background 0.2s",
  minHeight: 220,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: theme.spacing(2),
}));

const ImagePreview = styled("img")({
  width: 100,
  height: 100,
  objectFit: "cover",
  borderRadius: 8,
  border: "1px solid #e0e0e0",
  marginBottom: 8,
  boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
});

const MAX_FILES = 20;
const MAX_FILE_SIZE_MB = 10;

export default function UploadTrainingData() {
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
        setSuccess("Images uploaded successfully!");
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
    <Box sx={{ maxWidth: 900, mx: "auto", py: 6, px: { xs: 1, sm: 3 } }}>
      <Typography variant="h4" fontWeight={700} mb={4} align="center">
        Upload Training Data
      </Typography>
      <Paper sx={{ p: { xs: 2, sm: 4 }, borderRadius: 4, boxShadow: 3 }}>
        <Grid container spacing={4}>
          {/* Step 1: Inspection Station */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" fontWeight={600} mb={1}>
              1. Select Inspection Station
            </Typography>
            <FormControl fullWidth disabled={loadingStations || !projectId}>
              <InputLabel>Inspection Station</InputLabel>
              <Select
                value={selectedStation}
                label="Inspection Station"
                onChange={(e) => setSelectedStation(e.target.value)}
                MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
              >
                {stations.map((station) => (
                  <MenuItem key={station._id} value={station._id}>
                    {station.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {loadingStations && <CircularProgress size={24} sx={{ mt: 2 }} />}
          </Grid>
          {/* Step 2: Camera */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" fontWeight={600} mb={1}>
              2. Select Camera
            </Typography>
            <FormControl
              fullWidth
              disabled={!selectedStation || loadingCameras}
            >
              <InputLabel>Camera</InputLabel>
              <Select
                value={selectedCamera}
                label="Camera"
                onChange={(e) => setSelectedCamera(e.target.value)}
                MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
              >
                {cameras.map((cam) => (
                  <MenuItem key={cam._id} value={cam._id}>
                    {cam.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {loadingCameras && <CircularProgress size={24} sx={{ mt: 2 }} />}
          </Grid>
        </Grid>
        <Divider sx={{ my: 4 }} />
        {/* Step 3: File Upload */}
        <Typography variant="h6" fontWeight={600} mb={2}>
          3. Select Images to Upload
        </Typography>
        <UploadBox
          isdragactive={dragActive ? 1 : 0}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => selectedCamera && fileInputRef.current?.click()}
          sx={{
            opacity: selectedCamera ? 1 : 0.5,
            pointerEvents: selectedCamera ? "auto" : "none",
            mb: 2,
          }}
        >
          <CloudUploadIcon sx={{ fontSize: 56, color: "#1976d2", mb: 1 }} />
          <Typography variant="body1" color="textSecondary" mb={1}>
            Drag & drop images here, or{" "}
            <span
              style={{
                color: "#1976d2",
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              browse
            </span>
          </Typography>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={handleFileChange}
            disabled={!selectedCamera}
          />
          <Typography variant="caption" color="textSecondary">
            Only images. Max {MAX_FILES} files, {MAX_FILE_SIZE_MB}MB each.
          </Typography>
        </UploadBox>
        {fileError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {fileError}
          </Alert>
        )}
        {/* Step 4: Preview */}
        {files.length > 0 && (
          <Box sx={{ mt: 2, mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1 }}>
                Selected Images ({files.length})
              </Typography>
              <Tooltip title="Remove all">
                <IconButton color="error" onClick={handleRemoveAll}>
                  <ClearAllIcon />
                </IconButton>
              </Tooltip>
            </Box>
            <Grid container spacing={2}>
              {files.map((file, idx) => (
                <Grid item key={idx}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <ImagePreview
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                    />
                    <Typography variant="caption" noWrap sx={{ maxWidth: 100 }}>
                      {file.name}
                    </Typography>
                    <Tooltip title="Remove">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(idx);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
        {/* Step 5: Upload Button & Progress */}
        {uploading && (
          <Box sx={{ my: 2 }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="caption" color="textSecondary">
              Uploading... {progress}%
            </Typography>
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ my: 2 }}>
            {success}
          </Alert>
        )}
        <Button
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          disabled={!selectedCamera || files.length === 0 || uploading}
          onClick={handleUpload}
          sx={{
            mt: 2,
            borderRadius: 2,
            fontWeight: 600,
            py: 1.5,
            fontSize: 18,
          }}
        >
          Upload Images
        </Button>
      </Paper>
    </Box>
  );
}
