"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import PlaceIcon from "@mui/icons-material/Place";

const API_BASE = ""; // If you use a proxy, leave blank. Otherwise, set your API base URL.

function getImageUrl(full_path) {
  // Remove any leading slashes or backslashes, and convert all backslashes to slashes
  const normalized = full_path.replace(/^[/\\]+/, "").replace(/\\/g, "/");
  console.log(normalized);
  return `http://localhost:5000/storage/${normalized}`;
}

export default function ImageGallery() {
  const [projectId, setProjectId] = useState("");
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState("");
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState("");
  const [images, setImages] = useState([]);
  const [loadingStations, setLoadingStations] = useState(false);
  const [loadingCameras, setLoadingCameras] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [error, setError] = useState("");

  // Get projectId from sessionStorage or URL
  useEffect(() => {
    let pid = sessionStorage.getItem("selectedProjectId");
    if (!pid) {
      const url = new URL(window.location.href);
      pid = url.searchParams.get("projectId");
      if (pid) sessionStorage.setItem("selectedProjectId", pid);
    }
    setProjectId(pid || "");
  }, []);

  // Fetch stations
  useEffect(() => {
    if (!projectId) return;
    setLoadingStations(true);
    setError("");
    setStations([]);
    setSelectedStation("");
    setCameras([]);
    setSelectedCamera("");
    setImages([]);
    axios
      .post(
        `${API_BASE}/api/inspection-stations/project`,
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

  // Fetch cameras
  useEffect(() => {
    if (!selectedStation) return;
    setLoadingCameras(true);
    setError("");
    setCameras([]);
    setSelectedCamera("");
    setImages([]);
    axios
      .post(
        `${API_BASE}/api/cameras/station`,
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

  // Fetch images
  useEffect(() => {
    if (!selectedCamera) return;
    setLoadingImages(true);
    setError("");
    setImages([]);
    axios
      .post(
        `${API_BASE}/api/images/by-camera`,
        { cameraId: selectedCamera },
        { withCredentials: true }
      )
      .then((res) => {
        if (res.data.success) {
          setImages(res.data.data);
        } else {
          setError("Failed to fetch images");
        }
      })
      .catch(() => setError("Failed to fetch images"))
      .finally(() => setLoadingImages(false));
  }, [selectedCamera]);

  // Handlers
  const handleStationChange = (e) => {
    setSelectedStation(e.target.value);
  };
  const handleCameraChange = (e) => {
    setSelectedCamera(e.target.value);
  };

  // Image actions
  const handleView = (img) => {
    const image_path = `/storage/${img.full_path.replace(/\\/g, "/")}`;
    // window.open(image_path, "_blank");
  };
  const handleDownload = (img) => {
    const link = document.createElement("a");
    link.href = getImageUrl(img.full_path);
    link.download = img.filename;
    link.click();
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f8fafc",
        py: 4,
        px: { xs: 2, sm: 4 },
      }}
    >
      <Box sx={{ maxWidth: 1400, mx: "auto" }}>
        <Typography variant="h4" fontWeight={700} mb={4} align="center">
          Image Gallery
        </Typography>
        <Grid container spacing={4} alignItems="flex-start">
          {/* Left column: Filters */}
          <Grid item xs={12} md={3}>
            <Box
              sx={{
                bgcolor: "#fff",
                p: 3,
                borderRadius: 3,
                boxShadow: 2,
                mb: { xs: 3, md: 0 },
                minWidth: 0,
              }}
            >
              <Typography variant="h6" fontWeight={600} mb={2}>
                Filters
              </Typography>
              <FormControl
                fullWidth
                disabled={loadingStations || !projectId}
                sx={{ mb: 3 }}
              >
                <InputLabel>Inspection Station</InputLabel>
                <Select
                  value={selectedStation}
                  label="Inspection Station"
                  onChange={handleStationChange}
                  displayEmpty
                  renderValue={(selected) =>
                    selected
                      ? stations.find((s) => s._id === selected)?.name
                      : "Select station"
                  }
                >
                  <MenuItem value="" disabled>
                    <em>Select station</em>
                  </MenuItem>
                  {stations.map((station) => (
                    <MenuItem key={station._id} value={station._id}>
                      <PlaceIcon
                        fontSize="small"
                        sx={{ mr: 1, color: "#1976d2" }}
                      />
                      {station.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl
                fullWidth
                disabled={!selectedStation || loadingCameras}
              >
                <InputLabel>Camera</InputLabel>
                <Select
                  value={selectedCamera}
                  label="Camera"
                  onChange={handleCameraChange}
                  displayEmpty
                  renderValue={(selected) =>
                    selected
                      ? cameras.find((c) => c._id === selected)?.name
                      : "Select camera"
                  }
                >
                  <MenuItem value="" disabled>
                    <em>Select camera</em>
                  </MenuItem>
                  {cameras.map((cam) => (
                    <MenuItem key={cam._id} value={cam._id}>
                      <CameraAltIcon
                        fontSize="small"
                        sx={{ mr: 1, color: "#1976d2" }}
                      />
                      {cam.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Grid>

          {/* Right column: Gallery */}
          <Grid item xs={12} md={9}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            {loadingStations || loadingCameras || loadingImages ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress size={48} />
              </Box>
            ) : null}
            <Box sx={{ mt: 2 }}>
              {images.length === 0 && selectedCamera && !loadingImages ? (
                <Box
                  sx={{ textAlign: "center", color: "text.secondary", py: 8 }}
                >
                  <ImageIcon sx={{ fontSize: 64, mb: 2 }} />
                  <Typography variant="h6">
                    No images found for this camera.
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={4}>
                  {images.map((img) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={img._id}>
                      <Card
                        sx={{
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          borderRadius: 4,
                          boxShadow: 3,
                          transition: "box-shadow 0.2s",
                          "&:hover": { boxShadow: 8 },
                        }}
                      >
                        <CardHeader
                          title={img.filename}
                          subheader={new Date(img.created_at).toLocaleString()}
                          titleTypographyProps={{
                            fontSize: 16,
                            fontWeight: 600,
                            noWrap: true,
                          }}
                          subheaderTypographyProps={{
                            fontSize: 13,
                            color: "text.secondary",
                          }}
                          sx={{ pb: 1 }}
                        />
                        <CardContent
                          sx={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            p: 2,
                          }}
                        >
                          <Box
                            component="img"
                            src={getImageUrl(img.full_path)}
                            alt={img.filename}
                            sx={{
                              width: "100%",
                              maxHeight: 180,
                              objectFit: "contain",
                              borderRadius: 2,
                              boxShadow: 1,
                              background: "#f3f4f6",
                            }}
                            loading="lazy"
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
