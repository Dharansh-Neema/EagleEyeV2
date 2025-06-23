"use client";
import { Box, Typography, Paper } from "@mui/material";

export default function ProjectPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f4f6f8",
      }}
    >
      <Paper
        elevation={3}
        sx={{ p: 6, borderRadius: 4, textAlign: "center", background: "#fff" }}
      >
        <Typography variant="h4" fontWeight={700} color="#0a2342" mb={2}>
          Project Page (Coming Soon)
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This page will display project details and features in the future.
        </Typography>
      </Paper>
    </Box>
  );
}
