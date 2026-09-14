import type { Icon } from "@phosphor-icons/react";
import {
  HandPalm,
  LockSimpleOpen,
  PencilSimple,
  ShieldCheck,
  SignIn,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";

/** Shared copy for the public pages, so the landing and the standalone
 *  pages describe the product in exactly the same words. */

export const REPO_URL = "https://github.com/Rayrayyh/Melting-Pot";

export const STEPS: { number: string; icon: Icon; title: string; body: string }[] = [
  {
    number: "1",
    icon: SignIn,
    title: "Join your class",
    body: "A classmate sends you six characters and the whole vault opens. No forms, no setup, nothing to sign before you can look.",
  },
  {
    number: "2",
    icon: PencilSimple,
    title: "Write it rough",
    body: "Type what you remember between classes. Typos, fragments, half-ideas: all welcome. Formatting is not your job.",
  },
  {
    number: "3",
    icon: UsersThree,
    title: "Approve and share",
    body: "Review the organized version next to your original, change anything, then share it with the class.",
  },
];

export const PRINCIPLES: { icon: Icon; title: string; body: string }[] = [
  {
    icon: LockSimpleOpen,
    title: "Your original is always there",
    body: "Every note is kept exactly as you wrote it, and it stays one tap away from every version that comes after.",
  },
  {
    icon: HandPalm,
    title: "Nothing publishes itself",
    body: "The organizer suggests a title, a structure, and somewhere to file it. Sharing is a button you press.",
  },
  {
    icon: ShieldCheck,
    title: "People decide corrections",
    body: "A suggested fix arrives with a reason and any sources, and a person decides what happens to it.",
  },
];

/** The people behind the app, credited in the footer. */
export const MAKERS: { name: string; avatar: string; href: string }[] = [
  {
    name: "Rayrayyh",
    avatar: "/credits/rayrayyh.png",
    href: "https://github.com/Rayrayyh",
  },
  {
    name: "metabender",
    avatar: "/credits/metabender.png",
    href: "https://github.com/metabender",
  },
  {
    name: "cozbrozdevarc",
    avatar: "/credits/cozbrozdevarc.jpg",
    href: "https://github.com/cozbrozdevarc",
  },
  {
    name: "AnonymousDev",
    avatar: "/credits/anonymousdev.png",
    href: "https://github.com/AnonymousDev",
  },
];
