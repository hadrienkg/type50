import Box from "@mui/material/Box";

interface StatsBarProps {
  time: number;
  wpm: number;
  accuracy: number;
  onRestart: () => void;
}

export default function StatsBar({ time, wpm, accuracy, onRestart }: StatsBarProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        alignItems: "center",
        gap: 3,
        borderBottom: "4px solid #000",
        px: { xs: 3, md: 6 },
        py: { xs: 1.5, md: 2 },
        fontSize: { xs: "1.35rem", md: "1.5rem" },
        fontWeight: 600,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <Box sx={{ textAlign: "left" }}>Time: {time}s</Box>
      <Box sx={{ textAlign: "left" }}>WPM: {wpm}</Box>
      <Box sx={{ textAlign: "left" }}>Accuracy: {accuracy}%</Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Box
          component="button"
          type="button"
          onClick={onRestart}
          sx={{
            px: 3,
            py: 0.5,
            border: "4px solid #000",
            bgcolor: "#86EFAC",
            fontWeight: 600,
            color: "black",
            cursor: "pointer",
            boxShadow: "0 4px 0 rgba(0,0,0,0.2)",
            transition: "background-color 150ms ease",
            '&:hover': {
              bgcolor: "#4ade80",
            },
          }}
        >
          Restart
        </Box>
      </Box>
    </Box>
  );
}
