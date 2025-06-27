"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Popover,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  useMediaQuery,
  Grid,
  Card,
  CardContent,
  CardActionArea,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import { Button } from "@mui/material";

const DARK_BLUE = "#0a2342";
const ACCENT_BLUE = "#1976d2";

const CopyrightFooter = styled(Box)(({ theme }) => ({
  position: "fixed",
  left: 0,
  right: 0,
  bottom: 0,
  textAlign: "center",
  color: theme.palette.grey[500],
  fontWeight: 500,
  fontSize: 16,
  letterSpacing: 1,
  padding: theme.spacing(1, 0),
  zIndex: 10,
  background: "rgba(255,255,255,0.9)",
}));

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: DARK_BLUE,
  boxShadow: "0 2px 8px rgba(10,35,66,0.10)",
}));

const LogoBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
}));

const UserAvatar = styled(Avatar)(({ theme }) => ({
  background: ACCENT_BLUE,
  cursor: "pointer",
}));

const CenterBox = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "flex-start",
  minHeight: "calc(100vh - 120px)",
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(8),
  background: "linear-gradient(135deg, #f4f6f8 60%, #e3eefd 100%)",
  width: "100%",
}));

const OrganizationCard = styled(Card)(({ theme }) => ({
  height: 200,
  background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
  borderRadius: 16,
  boxShadow: "0 4px 20px rgba(10,35,66,0.08)",
  border: "1px solid rgba(10,35,66,0.05)",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  cursor: "pointer",
  position: "relative",
  overflow: "hidden",

  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "4px",
    background: `linear-gradient(90deg, ${DARK_BLUE}, ${ACCENT_BLUE})`,
    transform: "scaleX(0)",
    transition: "transform 0.3s ease",
  },

  "&:hover": {
    transform: "translateY(-8px) scale(1.02)",
    boxShadow: "0 12px 40px rgba(10,35,66,0.15)",
    borderColor: ACCENT_BLUE,

    "&::before": {
      transform: "scaleX(1)",
    },

    "& .organization-name": {
      color: ACCENT_BLUE,
      transform: "translateX(8px)",
    },

    "& .organization-description": {
      opacity: 1,
      transform: "translateY(0)",
    },
  },
}));

const OrganizationName = styled(Typography)(({ theme }) => ({
  fontSize: "1.5rem",
  fontWeight: 700,
  color: DARK_BLUE,
  marginBottom: theme.spacing(1),
  transition: "all 0.3s ease",
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const OrganizationDescription = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: "1rem",
  lineHeight: 1.6,
  opacity: 0.8,
  transform: "translateY(4px)",
  transition: "all 0.3s ease",
}));

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const isMobile = useMediaQuery("(max-width:900px)");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const userRes = await axios.get("/api/users/me", {
          withCredentials: true,
        });
        if (!userRes.data.success) throw new Error("Not authenticated");
        setUser(userRes.data.data);
        const orgRes = await axios.get("/api/organizations", {
          withCredentials: true,
        });
        setOrganizations(orgRes.data.data || []);
      } catch (err) {
        if (err.response && err.response.status === 401) {
          router.push("/login");
        } else {
          setError(err.response?.data?.message || "Failed to load dashboard");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line
  }, []);

  const handleAvatarClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handlePopoverClose = () => {
    setAnchorEl(null);
  };
  const open = Boolean(anchorEl);

  const handleLogout = async () => {
    try {
      await axios.get("/api/users/logout", { withCredentials: true });
    } catch {}
    router.push("/login");
  };

  const handleOrganizationClick = (orgId) => {
    router.push("/organization-dashboard");
  };

  if (loading) {
    return (
      <CenterBox>
        <CircularProgress />
      </CenterBox>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f4f6f8" }}>
      <StyledAppBar position="static" elevation={0}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <LogoBox>
            <Image
              src="/logo/Eagle_Eye_logo_white.png"
              alt="Eagle Eye Logo"
              width={isMobile ? 80 : 120}
              height={isMobile ? 80 : 120}
              style={{ marginRight: 24 }}
              priority
            />
          </LogoBox>
          <Box>
            <IconButton onClick={handleAvatarClick} size="large">
              {user?.name ? (
                <UserAvatar>{user.name[0]?.toUpperCase()}</UserAvatar>
              ) : (
                <AccountCircleIcon sx={{ fontSize: 36, color: "#fff" }} />
              )}
            </IconButton>
            <Popover
              open={open}
              anchorEl={anchorEl}
              onClose={handlePopoverClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              PaperProps={{ sx: { p: 2, minWidth: 200 } }}
            >
              <Typography fontWeight={700}>{user?.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
              <Button
                variant="outlined"
                color="error"
                startIcon={
                  <Image
                    src="/log-out.svg"
                    alt="Logout"
                    width={20}
                    height={20}
                  />
                }
                sx={{
                  mt: 2,
                  fontWeight: 600,
                  textTransform: "none",
                  borderRadius: 2,
                }}
                onClick={handleLogout}
                fullWidth
              >
                Logout
              </Button>
            </Popover>
          </Box>
        </Toolbar>
      </StyledAppBar>
      <CenterBox
        sx={{ width: "100%", flex: 1, p: 0, m: 0, alignItems: "stretch" }}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ p: 3, width: "100%", maxWidth: "1200px", mx: "auto" }}>
          <Typography
            variant="h4"
            fontWeight={700}
            color={DARK_BLUE}
            mb={4}
            align="center"
          >
            Organizations
          </Typography>
          <Grid container spacing={3}>
            {organizations.map((org) => (
              <Grid item xs={12} sm={6} md={4} key={org._id}>
                <OrganizationCard
                  onClick={() => handleOrganizationClick(org._id)}
                >
                  <CardActionArea sx={{ height: "100%", p: 0 }}>
                    <CardContent
                      sx={{
                        p: 3,
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      }}
                    >
                      <OrganizationName className="organization-name">
                        {org.name}
                      </OrganizationName>
                      <OrganizationDescription className="organization-description">
                        {org.description || "No description available"}
                      </OrganizationDescription>
                    </CardContent>
                  </CardActionArea>
                </OrganizationCard>
              </Grid>
            ))}
          </Grid>
        </Box>
      </CenterBox>
      <CopyrightFooter>&copy; Qualitas 2025</CopyrightFooter>
    </Box>
  );
}
