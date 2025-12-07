import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

export default function Header() {
  return (
    <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: "4px solid #000", bgcolor: "white" }}>
      <Toolbar sx={{ minHeight: 140, py: 3 }}>
        <Box sx={{ width: "100%", maxWidth: "80rem", margin: "0 auto", px: 3 }}>
          <Typography variant="h3" component="div" sx={{ fontWeight: 600 }}>
            type50
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
