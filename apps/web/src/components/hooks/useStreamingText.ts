'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

interface UseStreamingTextOptions {
  typingSpeed?: number; // milliseconds per character
  onComplete?: () => void;
}

/**
 * Hook for managing streaming text display with smooth typing animation
 * Uses requestAnimationFrame for smooth updates without blocking React's render cycle
 */
export function useStreamingText(
  targetText: string,
  options: UseStreamingTextOptions = {}
) {
  const { typingSpeed = 20, onComplete } = options;

  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);
  const currentTextRef = useRef('');
  const targetRef = useRef(targetText);
  const lastUpdateRef = useRef<number>(0);
  const isCompletedRef = useRef(false); // Track if typing has completed

  // keep targetRef up-to-date
  useEffect(() => {
    targetRef.current = targetText;
  }, [targetText]);

  const stopTyping = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsTyping(false);
    isCompletedRef.current = true; // Mark as completed
  }, []);

  const completeTyping = useCallback(() => {
    stopTyping();
    setDisplayedText(targetRef.current);
    currentTextRef.current = targetRef.current;
    onComplete?.();
  }, [stopTyping, onComplete]);

  // Safe update function that respects React's render cycle
  const scheduleUpdate = useCallback((newText: string) => {
    // Use requestAnimationFrame to ensure we're not updating during render
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    animationRef.current = requestAnimationFrame(() => {
      setDisplayedText(newText);
      currentTextRef.current = newText;
      animationRef.current = null;
    });
  }, []);

  // Internal typing loop that reads from targetRef so it can seamlessly continue
  const startTyping = useCallback((startIndex = currentTextRef.current.length) => {
    stopTyping();
    setIsTyping(true);

    // ensure displayedText and currentTextRef are in sync
    scheduleUpdate(currentTextRef.current);

    let currentIndex = Math.max(0, startIndex);

    const typeNext = () => {
      const target = targetRef.current;
      const now = Date.now();
      
      // Throttle updates to respect typing speed
      if (now - lastUpdateRef.current >= typingSpeed) {
        if (currentIndex < target.length) {
          const ch = target[currentIndex];
          const nextText = currentTextRef.current + ch;
          
          scheduleUpdate(nextText);
          currentIndex += 1;
          lastUpdateRef.current = now;
        }
      }

      if (currentIndex < target.length) {
        // Continue typing
        timeoutRef.current = setTimeout(typeNext, 10); // Check more frequently for smoother animation
      } else {
        // Typing complete
        timeoutRef.current = null;
        setIsTyping(false);
        onComplete?.();
      }
    };

    // kick off immediately
    lastUpdateRef.current = Date.now();
    timeoutRef.current = setTimeout(typeNext, typingSpeed);
  }, [stopTyping, scheduleUpdate, typingSpeed, onComplete]);

  // Effect to respond to incoming updates in targetRef
  useEffect(() => {
    // Don't restart if typing is already completed
    if (isCompletedRef.current) {
      return;
    }

    const currentTarget = targetRef.current;
    const currentDisplayed = currentTextRef.current;

    // Only start typing if we have new content AND we're not already typing
    // AND we haven't already started typing this content
    if (currentTarget.length > currentDisplayed.length && !isCompletedRef.current) {
      // Only restart if we genuinely haven't started yet, or if current display is empty
      // This prevents mid-stream restarts that cause jumping to full text
      if (currentDisplayed.length === 0) {
        startTyping(0);
      }
    }

    if (currentTarget.length < currentDisplayed.length) {
      stopTyping();
      scheduleUpdate(currentTarget);
    }
    // otherwise, do nothing — the existing typing loop will pick up new characters from targetRef
  }, [targetText, isTyping, startTyping, stopTyping, scheduleUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return {
    displayedText,
    isTyping,
    startTyping,
    stopTyping,
    completeTyping,
  };
}
