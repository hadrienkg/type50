import { ChangeEvent, RefObject, useMemo, useState } from "react";
import Box from "@mui/material/Box";

interface TextBoxProps {
  text: string;
  input: string;
  finished: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  author?: string;
}

type CharEntry = {
  char: string;
  index: number;
};

export default function TextBox({ text, input, finished, inputRef, onChange, author }: TextBoxProps) {
  const [hasFocus, setHasFocus] = useState(true);

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

  const handleBlur = () => {
    setHasFocus(false);
  };

  return (
    <Box
      className="relative text-2xl leading-relaxed text-gray-300 font-medium p-4"
      onClick={focusInput}
    >
      {tokens.map((token, tokenIndex) => (
        <span key={`token-${tokenIndex}`} className="inline-flex flex-nowrap">
          {token.map(({ char, index }) => {
            const typed = input[index];
            const isCurrent = index === input.length;
            const isSpace = char === " ";
            const showSpaceMistake = Boolean(typed && typed !== char && isSpace);

            let color = "text-gray-400";
            if (typed) color = typed === char ? "text-black" : "text-red-500";

            return (
              <span
                key={index}
                className={`relative inline-flex items-center h-[1em] leading-none ${color} ${isSpace ? "w-3 justify-center" : ""}`}
              >
                {isCurrent && !finished && hasFocus && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 bg-black animate-pulse" />
                )}
                {showSpaceMistake && (
                  <span className="absolute inset-0 bg-red-500/40" />
                )}
                {isSpace ? "\u00A0" : char}
              </span>
            );
          })}
        </span>
      ))}

      {author && (
        <div className="mt-6 text-2xl font-semibold text-black tracking-tight">— {author}</div>
      )}

      <textarea
        ref={inputRef}
        value={input}
        onChange={onChange}
        onFocus={() => setHasFocus(true)}
        onBlur={handleBlur}
        className="absolute inset-0 h-full w-full opacity-0 cursor-text"
        autoFocus
      />
    </Box>
  );
}
