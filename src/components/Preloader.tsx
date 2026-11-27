import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
} from 'motion/react';

export interface PreloaderProps {
  /** Brand text displayed in the intro (defaults to "Gezenn"). */
  brandName?: string;
  /** Subtitle under the brand name (defaults to "Portfolio Loading"). */
  subtitle?: string;
  /** Duration in ms before exit transition begins (defaults to 2800ms). */
  durationMs?: number;
  /** Session storage key so the intro only plays once per browser session. */
  storageKey?: string;
  /** Force playback even if already seen in this session. */
  forceShow?: boolean;
  /** Called right as the exit transition begins so the homepage can reveal underneath. */
  onExitStart?: () => void;
  /** Called after the exit transition finishes and the overlay is removed. */
  onComplete?: () => void;
}

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];
const EASE_IN_OUT: [number, number, number, number] = [0.65, 0, 0.35, 1];

const STORAGE_KEY_DEFAULT = 'gezenn_preloader_seen';

function readSeen(key: string): boolean {
  try {
    return window.sessionStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function writeSeen(key: string): void {
  try {
    window.sessionStorage.setItem(key, '1');
  } catch {
    // Ignore storage errors in restricted environments.
  }
}

/**
 * Intro screen adapted from RyHarJr/portofoliov2 PageLoader, tailored to the
 * Gezenn dark editorial palette (#07080a background, #d4ff4f accent, Space Grotesk & Inter).
 */
export const Preloader: React.FC<PreloaderProps> = ({
  brandName = 'Gezenn',
  subtitle = 'Portfolio Loading',
  durationMs = 6200,
  storageKey = STORAGE_KEY_DEFAULT,
  forceShow = false,
  onExitStart,
  onComplete,
}) => {
  const prefersReducedMotion = useReducedMotion();

  const [shouldRender, setShouldRender] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    if (forceShow) return true;
    return !readSeen(storageKey);
  });
  const [isVisible, setIsVisible] = useState(shouldRender);

  const hasExitedRef = useRef(false);
  const onExitStartRef = useRef(onExitStart);
  const onCompleteRef = useRef(onComplete);
  onExitStartRef.current = onExitStart;
  onCompleteRef.current = onComplete;

  const beginExit = useCallback(() => {
    if (hasExitedRef.current) return;
    hasExitedRef.current = true;
    writeSeen(storageKey);
    onExitStartRef.current?.();
    setIsVisible(false);
  }, [storageKey]);

  // If already seen in this session, unlock immediately
  useEffect(() => {
    if (!shouldRender) {
      onExitStartRef.current?.();
      onCompleteRef.current?.();
    }
  }, [shouldRender]);

  // Auto-dismiss after initial loading entrance completes
  useEffect(() => {
    if (!shouldRender) return;
    const waitMs = prefersReducedMotion ? 500 : durationMs;
    const timer = window.setTimeout(beginExit, waitMs);
    return () => window.clearTimeout(timer);
  }, [beginExit, durationMs, prefersReducedMotion, shouldRender]);

  // Escape key dismisses cleanly
  useEffect(() => {
    if (!isVisible) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') beginExit();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [beginExit, isVisible]);

  if (!shouldRender) return null;

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence
        onExitComplete={() => {
          setShouldRender(false);
          onCompleteRef.current?.();
        }}
      >
        {isVisible && (
          <motion.div
            key="loader"
            className="preloader-screen"
            role="status"
            aria-label={`${brandName} ${subtitle}`}
            initial={{ opacity: 1, y: 0 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0, transition: { duration: 0.2 } }
                : {
                    opacity: 0,
                    y: -100,
                    filter: 'blur(20px)',
                    transition: { duration: 0.8, ease: EASE_IN_OUT },
                  }
            }
          >
            {/* Aesthetic ambient glow orb adapted to Gezenn palette */}
            <div className="preloader-orb" aria-hidden="true" />

            {/* Staggered mask-reveal Brand Title */}
            <div className="preloader-brand-wrap">
              <motion.div
                className="preloader-brand-title"
                initial={prefersReducedMotion ? { opacity: 0 } : { y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  duration: prefersReducedMotion ? 0.2 : 0.85,
                  ease: EASE_OUT,
                  delay: prefersReducedMotion ? 0 : 0.2,
                }}
              >
                {brandName}
                <span className="preloader-brand-dot-char">.</span>
              </motion.div>
            </div>

            {/* Staggered mask-reveal Subtitle */}
            <div className="preloader-subtitle-wrap">
              <motion.div
                className="preloader-subtitle"
                initial={prefersReducedMotion ? { opacity: 0 } : { y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  duration: prefersReducedMotion ? 0.2 : 0.85,
                  ease: EASE_OUT,
                  delay: prefersReducedMotion ? 0 : 0.45,
                }}
              >
                {subtitle}
              </motion.div>
            </div>

            {/* Sliding Progress Bar */}
            <div className="preloader-progress-track" aria-hidden="true">
              <motion.div
                className="preloader-progress-fill"
                initial={prefersReducedMotion ? { x: '0%' } : { x: '-100%' }}
                animate={{ x: '0%' }}
                transition={{
                  duration: prefersReducedMotion ? 0.2 : 5.5,
                  ease: EASE_IN_OUT,
                  delay: prefersReducedMotion ? 0 : 0.35,
                }}
              />
            </div>

            {/* Subtle accessible skip option */}
            <motion.button
              type="button"
              className="preloader-skip"
              onClick={beginExit}
              aria-label="Skip intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.85 }}
              whileHover={{ opacity: 1 }}
              whileFocus={{ opacity: 1 }}
              transition={{ duration: 0.35, delay: prefersReducedMotion ? 0 : 0.8 }}
            >
              Skip
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
};

export default Preloader;
