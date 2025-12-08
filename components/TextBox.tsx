import { ChangeEvent, KeyboardEvent, RefObject, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

interface TextBoxProps {
  text: string;
  input: string;
  finished: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  author?: string;
  isTyping?: boolean;
  onFocusChange?: (focused: boolean) => void;
  onRestart?: () => void;
}

type CharEntry = {
  char: string;
  index: number;
};

export default function TextBox({
  text,
  input,
  finished,
  inputRef,
  onChange,
  author,
  isTyping,
  onFocusChange,
  onRestart,
}: TextBoxProps) {
  const [hasFocus, setHasFocus] = useState(true);
  // Split text into word/space chunks so spacing is not messed up when displayed
  const tokens = useMemo(() => {
    const result: CharEntry[][] = [];
    let currentToken: CharEntry[] = [];

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      currentToken.push({ char, index: i });
      const nextChar = text[i + 1];

      if (char === " ") {
        if (nextChar !== " ") {
          result.push(currentToken);
          currentToken = [];
        }
      } else if (nextChar === undefined) {
        result.push(currentToken);
        currentToken = [];
      }
    }

    if (currentToken.length) {
      result.push(currentToken);
    }

    return result;
  }, [text]);

  const focusInput = () => {
    inputRef.current?.focus();
    setHasFocus(true);
  };

  const handleFocus = () => {
    setHasFocus(true);
    onFocusChange?.(true);
  };

  const handleBlur = () => {
    setHasFocus(false);
    onFocusChange?.(false);
  };
  // Enter key pressed when finished to restart, Tab key pressed when not finished to restart
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (finished && event.key === "Enter") {
      event.preventDefault();
      onRestart?.();
      return;
    }

    if (!finished && event.key === "Tab") {
      event.preventDefault();
      onRestart?.();
    }
  };

  return (
    // Clickable typing area that contains the quote
    <Box
      onClick={focusInput}
      sx={{
        position: "relative",
        fontSize: { xs: "1.5rem", md: "1.65rem" },
        lineHeight: 1.6,
        fontWeight: 500,
        color: "#d1d5db",
        p: { xs: 3, md: 4 },
        cursor: "text",
      }}
    >
      {tokens.map((token, tokenIndex) => (
        <Box key={`token-${tokenIndex}`} component="span" sx={{ display: "inline-flex", flexWrap: "nowrap" }}>
          {token.map(({ char, index }) => {
            const typed = input[index];
            const isCurrent = index === input.length;
            const isSpace = char === " ";
            const showSpaceMistake = Boolean(typed && typed !== char && isSpace);

            const color = typed ? (typed === char ? "#000" : "#ef4444") : "#9ca3af";

            return (
              <Box
                key={index}
                component="span"
                sx={{
                  position: "relative",
                  display: "inline-flex",
                  alignItems: "center",
                  height: "1em",
                  lineHeight: 1,
                  color,
                  ...(isSpace ? { width: "0.75rem", justifyContent: "center" } : {}),
                }}
              >
                {isCurrent && !finished && hasFocus && (
                  <Box
                    sx={{
                      position: "absolute",
                      left: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      height: "1.5rem",
                      width: "2px",
                      bgcolor: "#000",
                      animation: isTyping ? "none" : "caretPulse 1.6s ease-in-out infinite",
                    }}
                  />
                )}
                {showSpaceMistake && (
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      bgcolor: "rgba(239, 68, 68, 0.4)",
                    }}
                  />
                )}
                {isSpace ? "\u00A0" : char}
              </Box>
            );
          })}
        </Box>
      ))}

      {author && (
        // Author, if available, is credited below the quote
        <Typography variant="h5" sx={{ mt: 3, fontWeight: 600, color: "#000", letterSpacing: "-0.01em" }}>
          — {author}
        </Typography>
      )}

      {/* Invisible textarea handles the actual typing */}
      <Box
        component="textarea"
        ref={inputRef}
        value={input}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        readOnly={finished}
        autoFocus
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0,
          cursor: "text",
          resize: "none",
        }}
      />
    </Box>
  );
}
