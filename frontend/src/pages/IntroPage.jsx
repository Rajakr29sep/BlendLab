
import React from 'react';
import { useRef } from 'react';
import { ArrowDownRight, ArrowUpRight, FlaskConical, Orbit, Sparkles } from 'lucide-react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import ProteinScene from '../components/visuals/ProteinScene.jsx';

gsap.registerPlugin(useGSAP);

export default function IntroPage({ onEnter }) {
  const root = useRef(null);
  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo('.intro-eyebrow', { opacity: 0, y: 18, letterSpacing: '0.42em' }, { opacity: 1, y: 0, letterSpacing: '0.18em', duration: 0.8 })
      .fromTo('.intro-title-line', { opacity: 0, yPercent: 115, rotateX: -26 }, { opacity: 1, yPercent: 0, rotateX: 0, duration: 1.1, stagger: 0.13 }, '-=0.2')
      .fromTo('.intro-copy, .intro-actions, .intro-footnote', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.12 }, '-=0.4')
      .fromTo('.intro-orbit-label', { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.55, stagger: 0.12 }, '-=0.7');
    gsap.to('.intro-glow', { scale: 1.15, opacity: 0.72, duration: 4.2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.to('.intro-scroll-cue', { y: 7, duration: 1.2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  }, { scope: root });

  return (
    <main className="intro-screen" ref={root}>
      <div className="intro-grid" />
      <div className="intro-glow intro-glow--one" />
      <div className="intro-glow intro-glow--two" />
      <ProteinScene />
      <header className="intro-nav">
        <a className="brand-lockup" href="#top" aria-label="FormuLab home">
          <span className="brand-mark"><Orbit size={19} strokeWidth={1.7} /></span>
          <span>FORMU<span className="brand-accent">LAB</span><small>ALTERNATIVE PROTEIN INTELLIGENCE</small></span>
        </a>
        <span className="intro-status"><i /> EXPERIMENTAL MODE · V1.0</span>
      </header>
      <section className="intro-copy-block" id="top">
        <div className="intro-eyebrow"><span className="eyebrow-line" /> THE FUTURE OF FOOD, FORMULATED</div>
        <h1 className="intro-title">
          <span className="intro-title-line">Less guesswork.</span>
          <span className="intro-title-line title-second">More <em>good</em> food<span className="title-period">.</span></span>
        </h1>
        <p className="intro-copy">A virtual protein lab that turns real extrusion experiments into smarter plant-based meat formulations — faster, more transparent, and built around your targets.</p>
        <div className="intro-actions">
          <button className="button-primary button-large" onClick={onEnter}>Enter virtual lab <ArrowUpRight size={18} /></button>
          <span className="intro-action-note"><Sparkles size={14} /> DATA-GROUNDED FORMULATION</span>
        </div>
        <div className="intro-footnote"><span>001 / FORMULATION INTELLIGENCE</span><span>BUILT FOR PLANT-BASED MEAT ALTERNATIVES</span></div>
      </section>
      <div className="intro-orbit-label intro-orbit-label--top"><span className="orbit-dot" /> TEXTURE PREDICTION</div>
      <div className="intro-orbit-label intro-orbit-label--right"><FlaskConical size={14} /> VIRTUAL EXPERIMENTS</div>
      <div className="intro-orbit-label intro-orbit-label--bottom">PROTEIN BLENDS <span className="orbit-line" /></div>
      <div className="intro-scroll-cue"><span>SCROLL TO EXPLORE</span><ArrowDownRight size={16} /></div>
    </main>
  );
}
