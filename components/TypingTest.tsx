"use client";

import { useState, useEffect, useRef, useCallback, ChangeEvent } from "react";
import Box from "@mui/material/Box";

import { generateText } from "@/lib/generateText";
import StatsBar from "@/components/StatsBar";
import TextBox from "@/components/TextBox";

const LOADING_MESSAGE = "Loading quote…";
const ERROR_MESSAGE = "Unable to load quote. Please try again.";

export default function TypingTest() {
  const [text, setText] = useState(LOADING_MESSAGE);
  const [author, setAuthor] = useState("");
  const [input, setInput] = useState("");
  const [time, setTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [typedCharacters, setTypedCharacters] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const mistakeIndicesRef = useRef<Set<number>>(new Set());
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadQuote = useCallback(async () => {
    const quote = await generateText(100, 500);
    return quote;
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const frame = requestAnimationFrame(() => {
      loadQuote()
        .then(({ quote, author }) => {
          if (!isCancelled) {
            setText(quote);
            setAuthor(author);
          }
        })
        .catch((error) => {
          console.error("Failed to fetch quote", error);
          if (!isCancelled) {
            setText(ERROR_MESSAGE);
            setAuthor("");
          }
        });
    });

    return () => {
      isCancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [loadQuote]);

  useEffect(() => {
    if (!startTime || finished) return;

    const interval = setInterval(() => {
      setTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, finished]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const previousValue = input;

    if (!startTime) {
      setStartTime(Date.now());
    }

    if (value.length > previousValue.length) {
      const newCharacters = value.slice(previousValue.length);
      newCharacters.split("").forEach((char, index) => {
        const targetIndex = previousValue.length + index;
        const isMistake = char !== text[targetIndex];
        if (isMistake && !mistakeIndicesRef.current.has(targetIndex)) {
          mistakeIndicesRef.current.add(targetIndex);
          setMistakes((prev) => prev + 1);
        }
      });
    }

    setTypedCharacters((prev) => (value.length > prev ? value.length : prev));
    setInput(value);

    if (value.length >= text.length) {
      setFinished(true);
    }
  };

  const restart = useCallback(async () => {
    setInput("");
    setStartTime(null);
    setTime(0);
    setFinished(false);
    setTypedCharacters(0);
    setMistakes(0);
    mistakeIndicesRef.current = new Set();
    setText(LOADING_MESSAGE);
    setAuthor("");

    try {
      const { quote, author } = await loadQuote();
      setText(quote);
      setAuthor(author);
    } catch (error) {
      console.error("Failed to fetch quote", error);
      setText(ERROR_MESSAGE);
      setAuthor("");
    } finally {
      inputRef.current?.focus();
    }
  }, [loadQuote]);

  const netCorrect = Math.max(0, typedCharacters - mistakes);
  const minutes = time / 60;
  const wpm = minutes > 0 ? Math.round((typedCharacters / 5) / minutes) : 0;
  const accuracy = typedCharacters > 0
    ? Math.round((netCorrect / typedCharacters) * 100)
    : 100;

  return (
    <Box
      component="section"
      sx={{
        border: "4px solid #000",
        display: "flex",
        flexDirection: "column",
        bgcolor: "white",
        boxShadow: "0 8px 0 rgba(0,0,0,0.2)",
      }}
    >
      <StatsBar time={time} wpm={wpm} accuracy={accuracy} onRestart={restart} />

      <Box>
        <TextBox
          text={text}
          input={input}
          finished={finished}
          inputRef={inputRef}
          onChange={handleChange}
          author={author}
        />
      </Box>
    </Box>
  );
}
