"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Popover,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  useMediaQuery,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

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
  justifyContent: "center",
  minHeight: "calc(100vh - 120px)",
  paddingTop: theme.spacing(6),
  paddingBottom: theme.spacing(8),
  background: "linear-gradient(135deg, #f4f6f8 60%, #e3eefd 100%)",
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
              width={isMobile ? 40 : 56}
              height={isMobile ? 40 : 56}
              style={{ marginRight: 16 }}
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
            </Popover>
          </Box>
        </Toolbar>
      </StyledAppBar>
      <CenterBox>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Paper
          elevation={3}
          sx={{
            width: isMobile ? "100%" : 600,
            p: 3,
            borderRadius: 4,
            boxShadow: "0 4px 24px rgba(10,35,66,0.10)",
            background: "#fff",
          }}
        >
          <Typography
            variant="h5"
            fontWeight={700}
            color={DARK_BLUE}
            mb={2}
            align="center"
          >
            Organizations
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{ fontWeight: 700, color: ACCENT_BLUE, fontSize: 16 }}
                  >
                    Name
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 700, color: ACCENT_BLUE, fontSize: 16 }}
                  >
                    Description
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {organizations.map((org) => (
                  <TableRow key={org._id} hover>
                    <TableCell>
                      <Typography
                        sx={{
                          color: DARK_BLUE,
                          fontWeight: 600,
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                        onClick={() => router.push("/project")}
                      >
                        {org.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{org.description || "No description"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </CenterBox>
      <CopyrightFooter>&copy; Qualitas 2025</CopyrightFooter>
    </Box>
  );
}
