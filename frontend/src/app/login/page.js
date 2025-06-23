"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import {
  Box,
  Button,
  Container,
  CssBaseline,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  useMediaQuery,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const DARK_BLUE = "#0a2342";
const ACCENT_BLUE = "#1976d2";

const Root = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  display: "flex",
  flexDirection: "row",
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
  },
}));

const LeftPanel = styled(Box)(({ theme }) => ({
  background: DARK_BLUE,
  color: "#fff",
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
  [theme.breakpoints.down("md")]: {
    minHeight: 240,
    flex: "none",
    padding: theme.spacing(4, 0),
  },
}));

const RightPanel = styled(Box)(({ theme }) => ({
  background: "#fff",
  flex: 1,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  minHeight: "100vh",
  position: "relative",
  [theme.breakpoints.down("md")]: {
    minHeight: 400,
    flex: "none",
    padding: theme.spacing(4, 0),
  },
}));

const LoginBox = styled(Paper)(({ theme }) => ({
  margin: "0 auto",
  marginTop: theme.spacing(8),
  padding: theme.spacing(5, 4),
  maxWidth: 400,
  width: "100%",
  borderRadius: 16,
  boxShadow: "0 8px 32px rgba(10,35,66,0.12)",
  [theme.breakpoints.down("md")]: {
    marginTop: theme.spacing(2),
    boxShadow: "0 4px 16px rgba(10,35,66,0.10)",
  },
}));

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isMobile = useMediaQuery("(max-width:900px)");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(
        "/api/users/login",
        { email, password },
        { withCredentials: true }
      );
      if (res.data.success) {
        router.push("/dashboard");
      } else {
        setError(res.data.message || "Login failed");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Root>
      <CssBaseline />
      <LeftPanel>
        <Image
          src="/logo/Eagle_Eye_logo_white.png"
          alt="Eagle Eye Logo"
          width={isMobile ? 180 : 320}
          height={isMobile ? 180 : 320}
          style={{ maxWidth: "80%", height: "auto", objectFit: "contain" }}
          priority
        />
      </LeftPanel>
      <RightPanel>
        <Box sx={{ width: "100%", textAlign: "center", mt: isMobile ? 2 : 6 }}>
          <Typography
            variant={isMobile ? "h4" : "h3"}
            fontWeight={800}
            sx={{
              color: DARK_BLUE,
              letterSpacing: 2,
              mb: isMobile ? 2 : 4,
              fontFamily: "Roboto, Arial, sans-serif",
            }}
          >
            Eagle Eye
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "flex-end",
            height: "100%",
            minHeight: isMobile ? 0 : "calc(100vh - 120px)",
          }}
        >
          <LoginBox elevation={6}>
            <Typography
              component="h1"
              variant="h5"
              align="center"
              mb={2}
              fontWeight={700}
              sx={{ color: DARK_BLUE, letterSpacing: 1 }}
            >
              Login
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  style: { fontSize: 18 },
                }}
                InputLabelProps={{
                  style: { fontSize: 16 },
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  style: { fontSize: 18 },
                }}
                InputLabelProps={{
                  style: { fontSize: 16 },
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 2,
                  fontWeight: 700,
                  fontSize: 18,
                  background: DARK_BLUE,
                  color: "#fff",
                  boxShadow: "0 2px 8px rgba(10,35,66,0.10)",
                  ":hover": {
                    background: ACCENT_BLUE,
                  },
                }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : "Sign In"}
              </Button>
            </Box>
          </LoginBox>
        </Box>
      </RightPanel>
    </Root>
  );
}
