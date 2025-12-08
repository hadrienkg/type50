"use client";

import { useState, useEffect, useRef, useCallback, ChangeEvent, useMemo } from "react";
import Box from "@mui/material/Box";

import { generateText } from "@/lib/generateText";
import StatsBar from "@/components/StatsBar";
import TextBox from "@/components/TextBox";

const LOADING_MESSAGE = "Loading quote…";
const ERROR_MESSAGE = "Unable to load quote. Please try again.";
const STORY_PROGRESS_KEY = "type50-story-progress";
const STORY_QUOTES = [
  { quote: "Are you procrastinating again?", author: "type50" },
  { quote: "You know you shouldn't do that, right?", author: "type50" },
  { quote: "There's so much more you could be doing instead.", author: "type50" },
  { quote: "You don't have to do this again.", author: "type50" },
  { quote: "You can be better.", author: "type50" },
  { quote: "I will be better.", author: "You" },
];
type StoryProgress = {
  nextIndex: number;
  currentIndex: number | null;
  unlocked: boolean;
};

export default function TypingTest() {
  const [text, setText] = useState(LOADING_MESSAGE);
  const [author, setAuthor] = useState("");
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(true);
  const [isStoryQuote, setIsStoryQuote] = useState(false);
  const [time, setTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [typedCharacters, setTypedCharacters] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const mistakeIndicesRef = useRef<Set<number>>(new Set());
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const accumulatedTimeRef = useRef(0);
  const storyQuoteIndexRef = useRef(0);
  const storyUnlockedRef = useRef(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Persist story progress for the current tab session so refreshes resume the same quote
  const saveStoryProgress = useCallback((nextIndex: number, currentIndex: number | null, unlocked?: boolean) => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(
      STORY_PROGRESS_KEY,
      JSON.stringify({ nextIndex, currentIndex, unlocked: unlocked ?? storyUnlockedRef.current } satisfies StoryProgress),
    );
  }, []);

  // Loads a specific story quote and advances the story
  const loadStoryQuote = useCallback(
    (index: number) => {
      if (!storyUnlockedRef.current) {
        return false;
      }

      if (index < 0 || index >= STORY_QUOTES.length) {
        return false;
      }

      const nextQuote = STORY_QUOTES[index];
      storyQuoteIndexRef.current = index + 1;
      setText(nextQuote.quote);
      setAuthor(nextQuote.author);
      setIsStoryQuote(true);
      saveStoryProgress(storyQuoteIndexRef.current, index);
      return true;
    },
    [saveStoryProgress],
  );

  // Loads the next queued story quote if any remain
  const loadStoryQuoteIfAvailable = useCallback(() => {
    if (!storyUnlockedRef.current) {
      return false;
    }
    const nextIndex = storyQuoteIndexRef.current;
    if (nextIndex >= STORY_QUOTES.length) {
      return false;
    }
    return loadStoryQuote(nextIndex);
  }, [loadStoryQuote]);

  // Resets the typing test session state when starting a new quote
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
      setIsStoryQuote(false);
      saveStoryProgress(storyQuoteIndexRef.current, null);
    } catch (error) {
      if (signal?.aborted) return;
      console.error("Failed to fetch quote", error);
      setText(ERROR_MESSAGE);
      setAuthor("");
      setIsStoryQuote(false);
      saveStoryProgress(storyQuoteIndexRef.current, null);
    }
  }, [saveStoryProgress]);

  // When page is loaded, restore story progress or fetch a random quote
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let storyTimeout: number | null = null;
    let resetTimeout: number | null = null;
    let controller: AbortController | null = null;
    let frame: number | null = null;

    const stored = window.sessionStorage.getItem(STORY_PROGRESS_KEY);
    let parsed: StoryProgress | null = null;

    if (stored) {
      try {
        parsed = JSON.parse(stored) as StoryProgress;
      } catch (error) {
        console.warn("Failed to parse saved progress", error);
      }
    }

    if (parsed && typeof parsed.nextIndex === "number") {
      storyQuoteIndexRef.current = parsed.nextIndex;
    } else {
      storyQuoteIndexRef.current = 0;
    }

    storyUnlockedRef.current = Boolean(parsed?.unlocked);

    if (
      parsed &&
      typeof parsed.currentIndex === "number" &&
      parsed.currentIndex >= 0 &&
      parsed.currentIndex < STORY_QUOTES.length
      && storyUnlockedRef.current
    ) {
      storyTimeout = window.setTimeout(() => {
        loadStoryQuote(parsed!.currentIndex as number);
      }, 0);
    } else {
      resetTimeout = window.setTimeout(() => {
        setIsStoryQuote(false);
        saveStoryProgress(storyQuoteIndexRef.current, null, storyUnlockedRef.current);
      }, 0);

      controller = new AbortController();
      frame = requestAnimationFrame(() => {
        void fetchQuote(controller!.signal);
      });
    }

    return () => {
      if (storyTimeout) {
        clearTimeout(storyTimeout);
      }
      if (resetTimeout) {
        clearTimeout(resetTimeout);
      }
      if (controller) {
        controller.abort();
      }
      if (frame !== null) {
        cancelAnimationFrame(frame);
      }
    };
  }, [fetchQuote, loadStoryQuote, saveStoryProgress]);

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

  // Handles changes when the text area gains or loses focus
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

  // Restarting uses story quotes before going back to random quote fetches
  const restart = useCallback(async () => {
    if (isStoryQuote && !finished) {
      return;
    }

    // Unlock story mode when first quote is finished
    if (finished && !storyUnlockedRef.current) {
      storyUnlockedRef.current = true;
      saveStoryProgress(storyQuoteIndexRef.current, null, true);
    }

    resetSession();

    const servedStoryQuote = loadStoryQuoteIfAvailable();
    if (!servedStoryQuote) {
      setIsStoryQuote(false);
      saveStoryProgress(storyQuoteIndexRef.current, null);
      setText(LOADING_MESSAGE);
      setAuthor("");
      await fetchQuote();
    }

    inputRef.current?.focus();
  }, [fetchQuote, finished, isStoryQuote, loadStoryQuoteIfAvailable, resetSession, saveStoryProgress]);

  // Calculate WPM and accuracy
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
      <StatsBar
        time={time}
        wpm={wpm}
        accuracy={accuracy}
        onRestart={restart}
        restartDisabled={isStoryQuote && !finished}
      />

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
          onRestart={restart}
        />
      </Box>
    </Box>
  );
}
