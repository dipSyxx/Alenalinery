"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ComponentProps } from "react";

const viewport = { once: true, amount: 0.22 };

const revealPresets = {
  up: {
    hidden: { opacity: 0, y: 34 },
    visible: { opacity: 1, y: 0 },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  frame: {
    hidden: { opacity: 0, y: 22, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1 },
  },
} satisfies Record<string, Variants>;

const noMotion = {
  hidden: { opacity: 1, x: 0, y: 0, scale: 1 },
  visible: { opacity: 1, x: 0, y: 0, scale: 1 },
} satisfies Variants;

const childVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
} satisfies Variants;

type RevealPreset = keyof typeof revealPresets;

type MotionPresetProps = {
  preset?: RevealPreset;
  delay?: number;
};

function useRevealVariants(preset: RevealPreset) {
  return useReducedMotion() ? noMotion : revealPresets[preset];
}

function revealTransition(delay = 0) {
  return { duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] } as const;
}

export function MotionSection({
  preset = "up",
  delay = 0,
  ...props
}: ComponentProps<typeof motion.section> & MotionPresetProps) {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={useRevealVariants(preset)}
      transition={revealTransition(delay)}
      {...props}
    />
  );
}

export function Reveal({
  preset = "up",
  delay = 0,
  ...props
}: ComponentProps<typeof motion.div> & MotionPresetProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={useRevealVariants(preset)}
      transition={revealTransition(delay)}
      {...props}
    />
  );
}

export function StaggerGroup({
  delay = 0,
  ...props
}: ComponentProps<typeof motion.div> & { delay?: number }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={{
        hidden: {},
        visible: {
          transition: shouldReduceMotion
            ? { delayChildren: 0, staggerChildren: 0 }
            : { delayChildren: delay, staggerChildren: 0.09 },
        },
      }}
      {...props}
    />
  );
}

export function MotionArticle(props: ComponentProps<typeof motion.article>) {
  return (
    <motion.article
      variants={childVariants}
      transition={revealTransition()}
      {...props}
    />
  );
}

export function MotionFigure(props: ComponentProps<typeof motion.figure>) {
  return (
    <motion.figure
      variants={childVariants}
      transition={revealTransition()}
      {...props}
    />
  );
}
