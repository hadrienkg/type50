import Box from "@mui/material/Box";
import Container from "@mui/material/Container";

import Header from "@/components/Header";
import TypingTest from "@/components/TypingTest";

export default function Home() {
  return (
    // Page background and colors
    <Box sx={{ minHeight: "100vh", bgcolor: "white", color: "black" }}>
      <Header />

      {/* Contains the actual typing test */}
      <Container component="main" maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>
        <TypingTest />
      </Container>
    </Box>
  );
}
