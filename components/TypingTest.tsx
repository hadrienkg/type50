"use client";

import { useState, useEffect, useRef, useCallback, ChangeEvent, useMemo } from "react";
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
  const [isTyping, setIsTyping] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(true);
  const [time, setTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [typedCharacters, setTypedCharacters] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const mistakeIndicesRef = useRef<Set<number>>(new Set());
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const accumulatedTimeRef = useRef(0);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetSession = useCallback(() => {
    setInput("");
    setIsTyping(false);
    setIsInputFocused(true);
    setStartTime(null);
    setTime(0);
    setFinished(false);
    setTypedCharacters(0);
    setMistakes(0);
    mistakeIndicesRef.current = new Set();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    accumulatedTimeRef.current = 0;
  }, []);

  // Fetch a new quote from the Quote API
  const fetchQuote = useCallback(async (signal?: AbortSignal) => {
    try {
      const { quote, author } = await generateText(100, 500);
      if (signal?.aborted) return;
      setText(quote);
      setAuthor(author);
    } catch (error) {
      if (signal?.aborted) return;
      console.error("Failed to fetch quote", error);
      setText(ERROR_MESSAGE);
      setAuthor("");
    }
  }, []);

  // Loads the first quote when the page first loads or when refreshed
  useEffect(() => {
    const controller = new AbortController();
    const frame = requestAnimationFrame(() => {
      void fetchQuote(controller.signal);
    });

    return () => {
      controller.abort();
      cancelAnimationFrame(frame);
    };
  }, [fetchQuote]);

  // Timer only goes when test is started, the text area is being focused on, and not finished
  useEffect(() => {
    if (!startTime || finished || !isInputFocused) return;

    const interval = setInterval(() => {
      const elapsedMs = accumulatedTimeRef.current + (Date.now() - startTime);
      setTime(Math.floor(elapsedMs / 1000));
    }, 250);

    return () => clearInterval(interval);
  }, [startTime, finished, isInputFocused]);

  // Updates stats and mistakes as user types
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (finished) return;

    const value = e.target.value;
    const previousValue = input;
    setIsTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      typingTimeoutRef.current = null;
    }, 300);

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
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (startTime) {
        accumulatedTimeRef.current += Date.now() - startTime;
        setStartTime(null);
      }
      setTime(Math.floor(accumulatedTimeRef.current / 1000));
    }
  };

  const handleFocusChange = (focused: boolean) => {
    setIsInputFocused(focused);
    if (!focused) {
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (startTime) {
        accumulatedTimeRef.current += Date.now() - startTime;
        setStartTime(null);
        setTime(Math.floor(accumulatedTimeRef.current / 1000));
      }
    } else if (!finished) {
      if (!startTime && (input.length > 0 || typedCharacters > 0)) {
        setStartTime(Date.now());
      }
    }
  };

  const restart = useCallback(async () => {
    resetSession();
    setText(LOADING_MESSAGE);
    setAuthor("");

    await fetchQuote();
    inputRef.current?.focus();
  }, [fetchQuote, resetSession]);

  const { wpm, accuracy } = useMemo(() => {
    const netCorrect = Math.max(0, typedCharacters - mistakes);
    const minutes = time / 60;
    const calculatedWpm = minutes > 0 ? Math.round((typedCharacters / 5) / minutes) : 0;
    const calculatedAccuracy = typedCharacters > 0
      ? Math.round((netCorrect / typedCharacters) * 100)
      : 100;

    return {
      wpm: calculatedWpm,
      accuracy: calculatedAccuracy,
    };
  }, [typedCharacters, mistakes, time]);

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
      {/* Stats bar on top of text area */}
      <StatsBar time={time} wpm={wpm} accuracy={accuracy} onRestart={restart} />

      <Box>
        {/* Contains quote/typing area */}
        <TextBox
          text={text}
          input={input}
          finished={finished}
          inputRef={inputRef}
          onChange={handleChange}
          author={author}
          isTyping={isTyping}
          onFocusChange={handleFocusChange}
        />
      </Box>
    </Box>
  );
}
