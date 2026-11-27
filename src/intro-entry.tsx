import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Preloader } from './components/Preloader';
import { IntroHero } from './components/IntroHero';
import BlurText from './components/BlurText';

declare global {
  interface Window {
    __GEZENN_PRELOADER_ACTIVE__?: boolean;
    __finishPortfolioIntro?: () => void;
    __setHeroHeadline?: (headline: string) => void;
  }
}

const PRELOADER_STORAGE_KEY = 'gezenn_preloader_seen';
const DEFAULT_HEADLINE = 'Turning ideas into *visual stories.*';

let latestHeadline = DEFAULT_HEADLINE;
let headlineRoot: Root | null = null;

function renderHeroHeadline(text: string): void {
  if (!headlineRoot) return;
  headlineRoot.render(
    <React.StrictMode>
      <BlurText
        key={text}
        as="h2"
        text={text}
        effect="blur"
        animateBy="words"
        direction="top"
        staggerFrom="start"
        trigger="view"
        delay={180}
        stepDuration={0.38}
        blur={10}
        distance={44}
        threshold={0.15}
        parseAccent
        className="hero-headline"
      />
    </React.StrictMode>
  );
}

window.__setHeroHeadline = (headline: string) => {
  const next = (headline || '').trim() || DEFAULT_HEADLINE;
  if (next === latestHeadline && headlineRoot) return;
  latestHeadline = next;
  renderHeroHeadline(latestHeadline);
};

function shouldShowPreloader(): boolean {
  if (window.location.hash === '#gezenn-admin') return false;
  try {
    return window.sessionStorage.getItem(PRELOADER_STORAGE_KEY) !== '1';
  } catch {
    return true;
  }
}

function mountAll(): void {
  // 1. Editorial PORTFOLIO hero section
  const heroNode = document.getElementById('intro-hero-root');
  const heroRoot = heroNode ? createRoot(heroNode) : null;

  const renderHero = (readyToAnimate: boolean) => {
    if (!heroRoot) return;
    heroRoot.render(
      <React.StrictMode>
        <IntroHero
          title="PORTFOLIO"
          year="2026"
          roleLabel="VIDEO EDITOR"
          readyToAnimate={readyToAnimate}
          scrollTargetSelector="#overview"
        />
      </React.StrictMode>
    );
  };

  // 2. Hero headline BlurText inside #overview
  const headlineMount = document.getElementById('heroHeadline');
  if (headlineMount) {
    headlineRoot = createRoot(headlineMount);
    renderHeroHeadline(latestHeadline);
  }

  const unlockPortfolio = () => {
    window.__GEZENN_PRELOADER_ACTIVE__ = false;
    document.documentElement.classList.remove('preloader-pending');
    document.body.classList.remove('preloader-active');
    renderHero(true);
    if (typeof window.__finishPortfolioIntro === 'function') {
      window.__finishPortfolioIntro();
    } else {
      document.body.classList.add('page-loaded');
    }
  };

  // 3. Intro/Preloader overlay (once per session)
  const preloaderNode = document.getElementById('preloader-root');
  if (!preloaderNode || !shouldShowPreloader()) {
    preloaderNode?.remove();
    unlockPortfolio();
    return;
  }

  window.__GEZENN_PRELOADER_ACTIVE__ = true;
  document.body.classList.add('preloader-active');
  renderHero(false);

  const preloaderRoot = createRoot(preloaderNode);
  preloaderRoot.render(
    <React.StrictMode>
      <Preloader
        brandName="Gezenn"
        subtitle="Portfolio Loading"
        storageKey={PRELOADER_STORAGE_KEY}
        onExitStart={unlockPortfolio}
        onComplete={() => {
          preloaderRoot.unmount();
          preloaderNode.remove();
        }}
      />
    </React.StrictMode>
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountAll, { once: true });
} else {
  mountAll();
}
