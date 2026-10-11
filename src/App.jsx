import React, { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import portfolioHTML from './content.html?raw';
import { initPortfolio } from './behavior.js';

/**
 * One maintainable source for all portfolio content: src/content.html.
 * Vite's ?raw imports the markup as a string without fetching an HTML page.
 * Motion and event listeners mount after render and tear down on unmount.
 */
export default function App() {
  useEffect(() => initPortfolio({ gsap, ScrollTrigger, Lenis }), []);
  return <div dangerouslySetInnerHTML={{ __html: portfolioHTML }} />;
}
