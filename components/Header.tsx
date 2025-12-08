import AppBar from "@mui/material/AppBar";
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

export default function Header() {
  return (
    // Navigation bar with the website title
    <AppBar
      position="static"
      color="transparent"
      elevation={0}
      sx={{ borderBottom: "4px solid #000", bgcolor: "white" }}
    >
      <Toolbar sx={{ minHeight: 140, py: 3 }}>
        <Container maxWidth="xl" disableGutters sx={{ px: { xs: 2, md: 6 } }}>
          <Typography variant="h3" component="div" sx={{ fontWeight: 600 }}>
            type50
          </Typography>
        </Container>
      </Toolbar>
    </AppBar>
  );
}
