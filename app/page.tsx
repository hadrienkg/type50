import Box from "@mui/material/Box";

import Header from "@/components/Header";
import TypingTest from "@/components/TypingTest";

export default function Home() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "white", color: "black" }}>
      <Header />

      <Box component="main" sx={{ maxWidth: "80rem", mx: "auto", p: 6 }}>
        <TypingTest />
      </Box>
    </Box>
  );
}
