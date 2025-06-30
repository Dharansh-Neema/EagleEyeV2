"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  FormControl,
  Select,
  MenuItem,
  Card,
  CardContent,
  Grid,
  Button,
  Paper,
  Chip,
  useMediaQuery,
  Container,
  Divider,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  PhotoLibrary as ImageIcon,
  CheckCircle as AnnotatedIcon,
  Schedule as PendingIcon,
  Storage as DatasetIcon,
  CloudUpload as UploadIcon,
  Upload as ProductionUploadIcon,
  Edit as AnnotateIcon,
  Settings as ManageIcon,
  BarChart as OverviewIcon,
  Collections as GalleryIcon,
  Dns as DatabaseIcon,
  TrendingUp,
} from "@mui/icons-material";

// Professional Color Palette
const PRIMARY_BLUE = "#1e40af";
const SECONDARY_BLUE = "#3b82f6";
const LIGHT_BLUE = "#dbeafe";
const ACCENT_GREEN = "#10b981";
const ACCENT_ORANGE = "#f59e0b";
const ACCENT_PURPLE = "#8b5cf6";
const ACCENT_RED = "#ef4444";
const NEUTRAL_GRAY = "#6b7280";
const LIGHT_GRAY = "#f8fafc";
const WHITE = "#ffffff";
const TEXT_PRIMARY = "#1f2937";
const TEXT_SECONDARY = "#6b7280";

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: `linear-gradient(135deg, ${PRIMARY_BLUE} 0%, ${SECONDARY_BLUE} 100%)`,
  backdropFilter: "blur(10px)",
  boxShadow: "0 8px 32px rgba(30, 64, 175, 0.12)",
  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
}));

const LogoBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));

const MetricCard = styled(Card)(({ theme }) => ({
  background: WHITE,
  borderRadius: 20,
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
  border: "1px solid #e5e7eb",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  height: "100%",
  overflow: "hidden",
  position: "relative",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.1)",
  },
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: `linear-gradient(90deg, ${SECONDARY_BLUE}, ${ACCENT_GREEN})`,
  },
}));

const QuickActionButton = styled(Button)(({ theme, bgcolor, hovercolor }) => ({
  background: `linear-gradient(135deg, ${bgcolor} 0%, ${hovercolor} 100%)`,
  color: WHITE,
  borderRadius: 16,
  padding: theme.spacing(3, 2),
  minHeight: 100,
  fontWeight: 600,
  fontSize: 16,
  boxShadow: "0 6px 20px rgba(0, 0, 0, 0.1)",
  textTransform: "none",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  position: "relative",
  overflow: "hidden",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
  },
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: "-100%",
    width: "100%",
    height: "100%",
    background:
      "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
    transition: "left 0.5s",
  },
  "&:hover::before": {
    left: "100%",
  },
}));

const NavigationButton = styled(Button)(({ theme }) => ({
  borderRadius: 16,
  border: `2px solid ${SECONDARY_BLUE}`,
  color: PRIMARY_BLUE,
  fontWeight: 600,
  fontSize: 16,
  padding: theme.spacing(2.5, 3),
  background: WHITE,
  textTransform: "none",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  minHeight: 80,
  "&:hover": {
    background: LIGHT_BLUE,
    borderColor: PRIMARY_BLUE,
    transform: "translateY(-2px)",
    boxShadow: "0 8px 25px rgba(59, 130, 246, 0.15)",
  },
}));

const SectionPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: 24,
  background: WHITE,
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
  border: "1px solid #e5e7eb",
  marginBottom: theme.spacing(4),
  position: "relative",
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    background: `linear-gradient(90deg, ${SECONDARY_BLUE}, ${ACCENT_GREEN}, ${ACCENT_PURPLE})`,
  },
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  color: WHITE,
  fontWeight: 600,
  fontSize: 16,
  background: "rgba(255, 255, 255, 0.1)",
  backdropFilter: "blur(10px)",
  borderRadius: 12,
  minWidth: 280,
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  "& .MuiSvgIcon-root": {
    color: WHITE,
  },
}));

const MetricIconBox = styled(Box)(({ bgcolor }) => ({
  width: 64,
  height: 64,
  borderRadius: 16,
  background: `linear-gradient(135deg, ${bgcolor}15, ${bgcolor}25)`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 16,
  border: `2px solid ${bgcolor}20`,
}));

export default function OrganizationDashboard() {
  const router = useRouter();
  const [selectedProject, setSelectedProject] = useState("");
  const [metrics, setMetrics] = useState({
    totalImages: 1247,
    annotated: 892,
    pending: 355,
    datasetCount: 8,
  });
  const [loading, setLoading] = useState(false);
  const isMobile = useMediaQuery("(max-width:900px)");
  const isTablet = useMediaQuery("(max-width:1200px)");

  // Dummy data for projects
  const dummyProjects = [
    { id: "1", name: "Quality Control System - Line A" },
    { id: "2", name: "Project Alpha" },
    { id: "3", name: "Project Beta" },
    { id: "4", name: "Project Gamma" },
  ];
  const orgName = "ITC Limited";

  useEffect(() => {
    if (dummyProjects.length > 0) {
      setSelectedProject(dummyProjects[0].id);
    }
  }, []);

  const handleProjectChange = (event) => {
    setSelectedProject(event.target.value);
  };

  const handleQuickAction = (action) => {
    router.push("/" + action);
  };

  const handleNavigation = (nav) => {
    router.push("/" + nav);
  };

  const getSelectedProjectName = () => {
    return (
      dummyProjects.find((p) => p.id === selectedProject)?.name ||
      "Select Project"
    );
  };

  const getCompletionPercentage = () => {
    return Math.round((metrics.annotated / metrics.totalImages) * 100);
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fafbfc" }}>
      <StyledAppBar position="static" elevation={0}>
        <Toolbar sx={{ justifyContent: "space-between", py: 1 }}>
          <LogoBox>
            <Image
              src="/logo/Eagle_Eye_logo_white.png"
              alt="Eagle Eye Logo"
              width={isMobile ? 50 : 70}
              height={isMobile ? 50 : 70}
              style={{ borderRadius: 8 }}
              priority
            />
          </LogoBox>

          <FormControl>
            <StyledSelect
              value={selectedProject}
              onChange={handleProjectChange}
              displayEmpty
            >
              {dummyProjects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
            </StyledSelect>
          </FormControl>
        </Toolbar>
      </StyledAppBar>

      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        {/* Project Header */}
        <Box sx={{ mb: 5 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 2,
              mb: 2,
            }}
          >
            <Box>
              <Typography
                variant="h3"
                fontWeight={700}
                color={TEXT_PRIMARY}
                mb={1}
                sx={{
                  fontSize: { xs: 28, md: 36 },
                  background: `linear-gradient(135deg, ${PRIMARY_BLUE}, ${SECONDARY_BLUE})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {getSelectedProjectName()}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography
                  variant="h6"
                  color={TEXT_SECONDARY}
                  fontWeight={500}
                  sx={{ fontSize: { xs: 16, md: 18 } }}
                >
                  {orgName}
                </Typography>
                {/* <Chip
                  icon={<TrendingUp />}
                  label={`${getCompletionPercentage()}% Complete`}
                  color="success"
                  variant="outlined"
                  sx={{
                    fontWeight: 600,
                    fontSize: 14,
                    borderRadius: 20,
                  }}
                /> */}
              </Box>
            </Box>
            <Chip
              label="Active Project"
              sx={{
                background: `linear-gradient(135deg, ${ACCENT_GREEN}, #059669)`,
                color: WHITE,
                fontWeight: 600,
                fontSize: 14,
                height: 36,
                borderRadius: 18,
                px: 1,
              }}
            />
          </Box>
          <Divider sx={{ mt: 3, bgcolor: "#e5e7eb" }} />
        </Box>

        {/* Metrics Cards */}
        <Grid
          container
          spacing={3}
          sx={{ mb: 6 }}
          justifyContent="stretch"
          alignItems="stretch"
        >
          <Grid item xs={12} sm={6} md={3} lg={3} xl={3} display="flex">
            <MetricCard sx={{ flex: 1 }}>
              <CardContent sx={{ p: 4, textAlign: "center" }}>
                <MetricIconBox bgcolor={SECONDARY_BLUE}>
                  <ImageIcon sx={{ fontSize: 32, color: SECONDARY_BLUE }} />
                </MetricIconBox>
                <Typography
                  variant="h3"
                  fontWeight={700}
                  color={TEXT_PRIMARY}
                  mb={1}
                  sx={{ fontSize: 36 }}
                >
                  {metrics.totalImages.toLocaleString()}
                </Typography>
                <Typography
                  variant="body1"
                  color={TEXT_SECONDARY}
                  fontWeight={500}
                  sx={{ fontSize: 16 }}
                >
                  Total Images
                </Typography>
              </CardContent>
            </MetricCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3} lg={3} xl={3} display="flex">
            <MetricCard sx={{ flex: 1 }}>
              <CardContent sx={{ p: 4, textAlign: "center" }}>
                <MetricIconBox bgcolor={ACCENT_GREEN}>
                  <AnnotatedIcon sx={{ fontSize: 32, color: ACCENT_GREEN }} />
                </MetricIconBox>
                <Typography
                  variant="h3"
                  fontWeight={700}
                  color={TEXT_PRIMARY}
                  mb={1}
                  sx={{ fontSize: 36 }}
                >
                  {metrics.annotated.toLocaleString()}
                </Typography>
                <Typography
                  variant="body1"
                  color={TEXT_SECONDARY}
                  fontWeight={500}
                  sx={{ fontSize: 16 }}
                >
                  Annotated
                </Typography>
              </CardContent>
            </MetricCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3} lg={3} xl={3} display="flex">
            <MetricCard sx={{ flex: 1 }}>
              <CardContent sx={{ p: 4, textAlign: "center" }}>
                <MetricIconBox bgcolor={ACCENT_ORANGE}>
                  <PendingIcon sx={{ fontSize: 32, color: ACCENT_ORANGE }} />
                </MetricIconBox>
                <Typography
                  variant="h3"
                  fontWeight={700}
                  color={TEXT_PRIMARY}
                  mb={1}
                  sx={{ fontSize: 36 }}
                >
                  {metrics.pending.toLocaleString()}
                </Typography>
                <Typography
                  variant="body1"
                  color={TEXT_SECONDARY}
                  fontWeight={500}
                  sx={{ fontSize: 16 }}
                >
                  Pending
                </Typography>
              </CardContent>
            </MetricCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3} lg={3} xl={3} display="flex">
            <MetricCard sx={{ flex: 1 }}>
              <CardContent sx={{ p: 4, textAlign: "center" }}>
                <MetricIconBox bgcolor={ACCENT_PURPLE}>
                  <DatasetIcon sx={{ fontSize: 32, color: ACCENT_PURPLE }} />
                </MetricIconBox>
                <Typography
                  variant="h3"
                  fontWeight={700}
                  color={TEXT_PRIMARY}
                  mb={1}
                  sx={{ fontSize: 36 }}
                >
                  {metrics.datasetCount}
                </Typography>
                <Typography
                  variant="body1"
                  color={TEXT_SECONDARY}
                  fontWeight={500}
                  sx={{ fontSize: 16 }}
                >
                  Datasets
                </Typography>
              </CardContent>
            </MetricCard>
          </Grid>
        </Grid>

        {/* Quick Actions Section */}
        <SectionPaper elevation={0}>
          <Typography
            variant="h4"
            fontWeight={700}
            color={TEXT_PRIMARY}
            mb={4}
            sx={{ fontSize: { xs: 24, md: 28 } }}
          >
            Quick Actions
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} lg={3}>
              <QuickActionButton
                fullWidth
                bgcolor={SECONDARY_BLUE}
                hovercolor={PRIMARY_BLUE}
                startIcon={<UploadIcon sx={{ fontSize: 28 }} />}
                onClick={() => handleQuickAction("upload-training")}
              >
                Upload Training Data
              </QuickActionButton>
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <QuickActionButton
                fullWidth
                bgcolor={ACCENT_GREEN}
                hovercolor="#059669"
                startIcon={<ProductionUploadIcon sx={{ fontSize: 28 }} />}
                onClick={() => handleQuickAction("upload-production")}
              >
                Upload Production Data
              </QuickActionButton>
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <QuickActionButton
                fullWidth
                bgcolor={ACCENT_PURPLE}
                hovercolor="#7c3aed"
                startIcon={<AnnotateIcon sx={{ fontSize: 28 }} />}
                onClick={() => handleQuickAction("annotate")}
              >
                Annotate Images
              </QuickActionButton>
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <QuickActionButton
                fullWidth
                bgcolor={ACCENT_ORANGE}
                hovercolor="#d97706"
                startIcon={<ManageIcon sx={{ fontSize: 28 }} />}
                onClick={() => handleQuickAction("manage-dataset")}
              >
                Manage Datasets
              </QuickActionButton>
            </Grid>
          </Grid>
        </SectionPaper>

        {/* Navigation Section */}
        <SectionPaper elevation={0}>
          <Typography
            variant="h4"
            fontWeight={700}
            color={TEXT_PRIMARY}
            mb={4}
            sx={{ fontSize: { xs: 24, md: 28 } }}
          >
            Project Navigation
          </Typography>
          <Grid container spacing={3} justifyContent="center">
            <Grid item xs={12} md={4}>
              <NavigationButton
                fullWidth
                variant="outlined"
                startIcon={<OverviewIcon sx={{ fontSize: 28 }} />}
                onClick={() => handleNavigation("project-overview")}
              >
                Project Overview
              </NavigationButton>
            </Grid>
            <Grid item xs={12} md={4}>
              <NavigationButton
                fullWidth
                variant="outlined"
                startIcon={<GalleryIcon sx={{ fontSize: 28 }} />}
                onClick={() => handleNavigation("image-gallery")}
              >
                Image Gallery
              </NavigationButton>
            </Grid>
            <Grid item xs={12} md={4}>
              <NavigationButton
                fullWidth
                variant="outlined"
                startIcon={<DatabaseIcon sx={{ fontSize: 28 }} />}
                onClick={() => handleNavigation("dataset-management")}
              >
                Dataset Management
              </NavigationButton>
            </Grid>
          </Grid>
        </SectionPaper>
      </Container>
    </Box>
  );
}
