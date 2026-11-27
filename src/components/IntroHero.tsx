import React, { useEffect, useState } from 'react';
import {
  MotionConfig,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';

export interface IntroHeroProps {
  /** Main display typography */
  title?: string;
  /** Year inside the top-left pill */
  year?: string;
  /** Profession label inside the bottom-right cream pill */
  roleLabel?: string;
  /** Whether the entrance sequence is allowed to begin (waits for preloader exit). */
  readyToAnimate?: boolean;
  /** Target selector scrolled to when clicking the bottom scroll cue. */
  scrollTargetSelector?: string;
}

const APPLE_DECEL_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const APPLE_REVEAL_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * Editorial portfolio hero section. Permanent homepage hero with deliberate entrance
 * timing, continuous optical capsule drift, and gentle pointer parallax so the
 * halftone refraction stays pixel-locked while feeling fluid and alive.
 */
export const IntroHero: React.FC<IntroHeroProps> = ({
  title = 'PORTFOLIO',
  year = '2026',
  roleLabel = 'VIDEO EDITOR',
  readyToAnimate = true,
  scrollTargetSelector = '#overview',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [fontsReady, setFontsReady] = useState(false);

  // 1. Entrance glide offsets
  const leftEntranceX = useMotionValue(prefersReducedMotion ? 0 : -44);
  const leftEntranceY = useMotionValue(prefersReducedMotion ? 0 : 14);
  const rightEntranceX = useMotionValue(prefersReducedMotion ? 0 : 44);
  const rightEntranceY = useMotionValue(prefersReducedMotion ? 0 : -14);

  // 2. Continuous slow floating drift offsets
  const leftDriftX = useMotionValue(0);
  const leftDriftY = useMotionValue(0);
  const rightDriftX = useMotionValue(0);
  const rightDriftY = useMotionValue(0);

  // 3. Smooth pointer parallax (-1 to +1 normalized)
  const rawPointerX = useMotionValue(0);
  const rawPointerY = useMotionValue(0);
  const pointerX = useSpring(rawPointerX, { stiffness: 45, damping: 24, mass: 1.1 });
  const pointerY = useSpring(rawPointerY, { stiffness: 45, damping: 24, mass: 1.1 });

  // Compose total capsule positions while keeping inner halftone PORTFOLIO locked
  const leftPillX = useTransform(
    [leftEntranceX, leftDriftX, pointerX],
    ([entrance, drift, ptr]: number[]) => entrance + drift + ptr * 16
  );
  const leftPillY = useTransform(
    [leftEntranceY, leftDriftY, pointerY],
    ([entrance, drift, ptr]: number[]) => entrance + drift + ptr * 9
  );
  const rightPillX = useTransform(
    [rightEntranceX, rightDriftX, pointerX],
    ([entrance, drift, ptr]: number[]) => entrance + drift - ptr * 14
  );
  const rightPillY = useTransform(
    [rightEntranceY, rightDriftY, pointerY],
    ([entrance, drift, ptr]: number[]) => entrance + drift - ptr * 8
  );

  // Subtle counter-depth parallax for editorial clusters
  const stageParallaxX = useTransform(pointerX, (p) => p * -4);
  const stageParallaxY = useTransform(pointerY, (p) => p * -3);

  const negLeftPillX = useTransform(leftPillX, (v) => -v);
  const negLeftPillY = useTransform(leftPillY, (v) => -v);
  const negRightPillX = useTransform(rightPillX, (v) => -v);
  const negRightPillY = useTransform(rightPillY, (v) => -v);

  // Wait for serif font readiness (capped at 320ms)
  useEffect(() => {
    let cancelled = false;
    const fontWait =
      document.fonts && document.fonts.ready
        ? document.fonts.ready
        : Promise.resolve();
    const fallbackTimer = new Promise<void>((resolve) => {
      window.setTimeout(resolve, 320);
    });

    Promise.race([fontWait, fallbackTimer]).then(() => {
      if (!cancelled) setFontsReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const sequenceStarted = readyToAnimate && fontsReady;

  // Orchestrate elongated entrance + continuous gentle ambient float
  useEffect(() => {
    if (!sequenceStarted) return;

    if (prefersReducedMotion) {
      leftEntranceX.set(0);
      leftEntranceY.set(0);
      rightEntranceX.set(0);
      rightEntranceY.set(0);
      leftDriftX.set(0);
      leftDriftY.set(0);
      rightDriftX.set(0);
      rightDriftY.set(0);
      return;
    }

    const entranceControls = [
      animate(leftEntranceX, 0, {
        duration: 1.65,
        delay: 0.25,
        ease: APPLE_DECEL_EASE,
      }),
      animate(leftEntranceY, 0, {
        duration: 1.65,
        delay: 0.25,
        ease: APPLE_DECEL_EASE,
      }),
      animate(rightEntranceX, 0, {
        duration: 1.65,
        delay: 0.45,
        ease: APPLE_DECEL_EASE,
      }),
      animate(rightEntranceY, 0, {
        duration: 1.65,
        delay: 0.45,
        ease: APPLE_DECEL_EASE,
      }),
    ];

    const driftControls = [
      animate(leftDriftX, [0, 7, 0, -6, 0], {
        duration: 9.5,
        delay: 1.8,
        repeat: Infinity,
        ease: 'easeInOut',
      }),
      animate(leftDriftY, [0, -4, 3, -2, 0], {
        duration: 8.2,
        delay: 1.8,
        repeat: Infinity,
        ease: 'easeInOut',
      }),
      animate(rightDriftX, [0, -7, 0, 6, 0], {
        duration: 10.2,
        delay: 2.0,
        repeat: Infinity,
        ease: 'easeInOut',
      }),
      animate(rightDriftY, [0, 4, -3, 2, 0], {
        duration: 8.8,
        delay: 2.0,
        repeat: Infinity,
        ease: 'easeInOut',
      }),
    ];

    return () => {
      entranceControls.forEach((c) => c.stop());
      driftControls.forEach((c) => c.stop());
    };
  }, [
    leftDriftX,
    leftDriftY,
    leftEntranceX,
    leftEntranceY,
    prefersReducedMotion,
    rightDriftX,
    rightDriftY,
    rightEntranceX,
    rightEntranceY,
    sequenceStarted,
  ]);

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (prefersReducedMotion || e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    rawPointerX.set(nx);
    rawPointerY.set(ny);
  };

  const handlePointerLeave = () => {
    rawPointerX.set(0);
    rawPointerY.set(0);
  };

  const handleScrollDown = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const target = document.querySelector(scrollTargetSelector);
    if (!target) return;
    e.preventDefault();
    const navHeight = 90;
    const targetPos = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
    window.scrollTo({
      top: targetPos > 0 ? targetPos : 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <MotionConfig reducedMotion="user">
      <section
        className="intro-hero-section"
        aria-label={`${title} ${year}, ${roleLabel}`}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <motion.div
          className="intro-backdrop-vignette"
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: sequenceStarted ? 1 : 0 }}
          transition={{ duration: prefersReducedMotion ? 0.2 : 1.1, ease: APPLE_DECEL_EASE }}
        />
        <motion.div
          className="intro-grain"
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: sequenceStarted ? 0.09 : 0 }}
          transition={{ duration: prefersReducedMotion ? 0.2 : 1.2, ease: APPLE_DECEL_EASE }}
        />

        {/* Main Editorial Composition */}
        <motion.div
          className="intro-composition"
          style={
            prefersReducedMotion
              ? undefined
              : { x: stageParallaxX, y: stageParallaxY }
          }
        >
          <div className="intro-word-stage">
            {/* "2026" pill + outlined circle */}
            <motion.div
              className="intro-year-cluster"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
              animate={
                sequenceStarted
                  ? { opacity: 1, y: 0 }
                  : prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: 14 }
              }
              transition={{
                duration: prefersReducedMotion ? 0.2 : 1.15,
                delay: prefersReducedMotion ? 0 : 0.75,
                ease: APPLE_DECEL_EASE,
              }}
            >
              <span className="intro-ring-dot" aria-hidden="true" />
              <span className="intro-year-pill">{year}</span>
            </motion.div>

            {/* Main "PORTFOLIO" serif headline */}
            <div className="intro-title-clip">
              <motion.h1
                className="intro-title"
                initial={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: 34, scale: 0.985 }
                }
                animate={
                  sequenceStarted
                    ? { opacity: 1, y: 0, scale: 1 }
                    : prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 34, scale: 0.985 }
                }
                transition={{
                  duration: prefersReducedMotion ? 0.25 : 1.65,
                  delay: prefersReducedMotion ? 0 : 0.95,
                  ease: APPLE_REVEAL_EASE,
                }}
              >
                {title}
              </motion.h1>
            </div>

            {/* Left-bottom floating capsule */}
            <motion.div
              className="intro-lens intro-lens--left"
              aria-hidden="true"
              style={{ x: leftPillX, y: leftPillY }}
              initial={{ opacity: 0 }}
              animate={sequenceStarted ? { opacity: 1 } : { opacity: 0 }}
              transition={{
                duration: prefersReducedMotion ? 0.2 : 1.4,
                delay: prefersReducedMotion ? 0 : 0.25,
                ease: APPLE_DECEL_EASE,
              }}
            >
              <motion.div
                className="intro-lens-text-anchor"
                style={{ x: negLeftPillX, y: negLeftPillY }}
              >
                <motion.div
                  className="intro-halftone-stack"
                  initial={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 34, scale: 0.985 }
                  }
                  animate={
                    sequenceStarted
                      ? { opacity: 1, y: 0, scale: 1 }
                      : prefersReducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: 34, scale: 0.985 }
                  }
                  transition={{
                    duration: prefersReducedMotion ? 0.25 : 1.65,
                    delay: prefersReducedMotion ? 0 : 0.95,
                    ease: APPLE_REVEAL_EASE,
                  }}
                >
                  <span className="intro-title intro-title--bloom">{title}</span>
                  <span className="intro-title intro-title--halftone">{title}</span>
                </motion.div>
              </motion.div>
              <div className="intro-lens-sheen" />
            </motion.div>

            {/* Right-top floating capsule */}
            <motion.div
              className="intro-lens intro-lens--right"
              aria-hidden="true"
              style={{ x: rightPillX, y: rightPillY }}
              initial={{ opacity: 0 }}
              animate={sequenceStarted ? { opacity: 1 } : { opacity: 0 }}
              transition={{
                duration: prefersReducedMotion ? 0.2 : 1.4,
                delay: prefersReducedMotion ? 0 : 0.45,
                ease: APPLE_DECEL_EASE,
              }}
            >
              <motion.div
                className="intro-lens-text-anchor"
                style={{ x: negRightPillX, y: negRightPillY }}
              >
                <motion.div
                  className="intro-halftone-stack"
                  initial={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 34, scale: 0.985 }
                  }
                  animate={
                    sequenceStarted
                      ? { opacity: 1, y: 0, scale: 1 }
                      : prefersReducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: 34, scale: 0.985 }
                  }
                  transition={{
                    duration: prefersReducedMotion ? 0.25 : 1.65,
                    delay: prefersReducedMotion ? 0 : 0.95,
                    ease: APPLE_REVEAL_EASE,
                  }}
                >
                  <span className="intro-title intro-title--bloom">{title}</span>
                  <span className="intro-title intro-title--halftone">{title}</span>
                </motion.div>
              </motion.div>
              <div className="intro-lens-sheen" />
            </motion.div>

            {/* "VIDEO EDITOR" cream label */}
            <motion.div
              className="intro-role-cluster"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.92 }}
              animate={
                sequenceStarted
                  ? { opacity: 1, y: 0, scale: 1 }
                  : prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: 10, scale: 0.92 }
              }
              transition={{
                duration: prefersReducedMotion ? 0.2 : 1.15,
                delay: prefersReducedMotion ? 0 : 1.95,
                ease: APPLE_DECEL_EASE,
              }}
            >
              <span className="intro-solid-dot" aria-hidden="true" />
              <span className="intro-role-pill">{roleLabel}</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Interactive scroll down indicator */}
        <motion.a
          href={scrollTargetSelector}
          onClick={handleScrollDown}
          className="intro-hero-scroll-cue"
          aria-label="Scroll to portfolio overview"
          initial={{ opacity: 0, y: 8 }}
          animate={sequenceStarted ? { opacity: 0.72, y: 0 } : { opacity: 0, y: 8 }}
          whileHover={{ opacity: 1 }}
          whileFocus={{ opacity: 1 }}
          transition={{
            duration: 0.9,
            delay: prefersReducedMotion ? 0.2 : 2.55,
            ease: APPLE_DECEL_EASE,
          }}
        >
          <svg
            width="18"
            height="28"
            viewBox="0 0 18 28"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <rect x="1.5" y="1.5" width="15" height="25" rx="7.5" />
            <line x1="9" y1="7" x2="9" y2="12" className="intro-hero-scroll-line" />
          </svg>
        </motion.a>
      </section>
    </MotionConfig>
  );
};

export default IntroHero;
