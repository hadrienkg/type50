import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

interface StatsBarProps {
  time: number;
  wpm: number;
  accuracy: number;
  onRestart: () => void;
}

export default function StatsBar({ time, wpm, accuracy, onRestart }: StatsBarProps) {
  return (
    // Shows the live typing stats and restart button
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
        {/* Restart button refreshes the quote and restarts typing stats. */}
        <Button
          type="button"
          onClick={onRestart}
          disableElevation
          sx={{
            px: { xs: 3.5, md: 4 },
            py: { xs: 1, md: 1.25 },
            border: "4px solid #000",
            bgcolor: "#86EFAC",
            fontWeight: 600,
            color: "black",
            boxShadow: "0 4px 0 rgba(0,0,0,0.2)",
            textTransform: "none",
            borderRadius: 0,
            minWidth: "auto",
            lineHeight: 1,
            height: "auto",
            fontSize: { xs: "1.35rem", md: "1.5rem" },
            '&:hover': {
              bgcolor: "#4ade80",
            },
          }}
        >
          Restart
        </Button>
      </Box>
    </Box>
  );
}
