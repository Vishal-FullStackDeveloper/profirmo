'use client';

import { useEffect, useState } from 'react';
import {
  MessagesSquare,
  ListChecks,
  CalendarCheck,
  Video,
  Workflow,
  Bot,
  LayoutDashboard,
  Search,
  CalendarDays,
  MessageCircle,
  CreditCard,
  User,
  LogOut,
  Play,
  X,
  Users,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

const STEPS = [
  {
    icon: MessagesSquare,
    titleKey: 'howItWorks.step1Title',
    descKey: 'howItWorks.step1Desc',
  },
  {
    icon: ListChecks,
    titleKey: 'howItWorks.step2Title',
    descKey: 'howItWorks.step2Desc',
  },
  {
    icon: CalendarCheck,
    titleKey: 'howItWorks.step3Title',
    descKey: 'howItWorks.step3Desc',
  },
  {
    icon: Video,
    titleKey: 'howItWorks.step4Title',
    descKey: 'howItWorks.step4Desc',
  },
];

// Faux dashboard sidebar items rendered behind the chat preview card — they
// mirror the screenshot the design team supplied for this section.
const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: Search, label: 'Find Experts' },
  { icon: MessageCircle, label: 'Discuss with AI', active: true },
  { icon: CalendarDays, label: 'My Bookings' },
  { icon: MessagesSquare, label: 'Messages' },
  { icon: CreditCard, label: 'Payments' },
  { icon: User, label: 'Profile' },
  { icon: LogOut, label: 'Logout' },
];

// Real-face stack for the "3000+ consultants" stat card.
const STAT_AVATARS = [16, 5, 36, 48, 32];

export default function HowItWorksSection() {
  const { t } = useLanguage();
  const [videoOpen, setVideoOpen] = useState(false);

  // Close the modal on Escape so the keyboard works as expected.
  useEffect(() => {
    if (!videoOpen) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') setVideoOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [videoOpen]);

  return (
    <section className="bg-slate-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-600 ring-1 ring-inset ring-indigo-200">
            <Workflow className="h-3.5 w-3.5" />
            {t('howItWorks.eyebrow')}
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {t('howItWorks.heading')}
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            {t('howItWorks.subtext')}
          </p>
        </div>

        {/* `items-stretch` keeps the left preview column the same height as
            the steps grid on the right. */}
        <div className="mt-16 grid items-stretch gap-10 lg:grid-cols-[28rem_1fr] lg:gap-12">
          {/* LEFT — chatbot preview that opens the video modal, with a
              stat card pinned to the bottom so the column matches the
              right column's height. */}
          <div className="relative mx-auto flex w-full max-w-md flex-col gap-4">
            <div
              className="pointer-events-none absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-emerald-500/20 via-amber-400/10 to-teal-400/20 blur-2xl"
              aria-hidden="true"
            />

            <button
              type="button"
              onClick={() => setVideoOpen(true)}
              aria-label={t('howItWorks.playVideoAria') || 'Play product video'}
              className="group relative flex flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white text-left shadow-card-lg transition hover:shadow-glow-cyan focus:outline-none focus:ring-4 focus:ring-emerald-200"
            >
              {/* Faux dashboard preview — fills the card height */}
              <div className="flex h-full">
                {/* Sidebar */}
                <div className="flex w-32 shrink-0 flex-col border-r border-slate-100 bg-slate-50/60 p-2.5">
                  <div className="mb-3 flex items-center gap-1.5 px-1">
                    <span className="grid h-6 w-6 place-items-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-[10px] font-extrabold text-white">
                      P
                    </span>
                    <span className="text-[11px] font-bold text-slate-800">
                      Pro Firmo
                    </span>
                  </div>
                  <ul className="space-y-0.5 text-[10px]">
                    {SIDEBAR_ITEMS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li
                          key={item.label}
                          className={`flex items-center gap-1.5 rounded-md px-1.5 py-1.5 ${
                            item.active
                              ? 'bg-white font-semibold text-emerald-700 shadow-sm ring-1 ring-emerald-200'
                              : 'text-slate-500'
                          }`}
                        >
                          <Icon className="h-3 w-3 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Chat panel — flexes to fill remaining width */}
                <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-bold text-slate-900">
                      Talk to Firmo
                    </p>
                    <div className="flex flex-col items-center">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-glow-sm">
                        <Bot className="h-5 w-5" />
                      </span>
                      <p className="mt-1 text-[10px] font-bold leading-none text-slate-900">
                        Firmo
                      </p>
                      <p className="text-[9px] font-medium leading-none text-emerald-700">
                        AI Agent
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-[11px]">
                    <p className="max-w-[90%] rounded-2xl rounded-bl-md bg-slate-100 px-3 py-2 leading-relaxed text-slate-700">
                      Hello! I&apos;m Firmo, your AI legal assistant. Tell me
                      about your issue and I will help you find the right
                      consultant.
                    </p>
                    <div className="flex justify-end">
                      <p className="max-w-[85%] rounded-2xl rounded-br-md bg-emerald-100 px-3 py-2 leading-relaxed text-emerald-800">
                        I need help with a landlord dispute. He is not
                        returning my security deposit.
                      </p>
                    </div>
                    <p className="max-w-[92%] rounded-2xl rounded-bl-md bg-slate-100 px-3 py-2 leading-relaxed text-slate-700">
                      Thank you for sharing. I can help you with that. I have
                      a few questions to better understand your situation.
                    </p>
                  </div>

                  <div className="mt-auto flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-400">
                    Type your message…
                    <span className="ml-auto grid h-5 w-5 place-items-center rounded-md bg-emerald-500 text-white">
                      ➜
                    </span>
                  </div>
                </div>
              </div>

              {/* Play button overlay — sits centred above the preview. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-900/0 transition group-hover:bg-slate-900/20"
              >
                <span className="grid h-16 w-16 place-items-center rounded-full bg-white/95 text-emerald-600 shadow-card-lg ring-1 ring-slate-200 transition group-hover:scale-110 group-hover:bg-white">
                  <Play className="h-7 w-7 fill-current" />
                </span>
              </span>
            </button>

            {/* "3000+ consultants onboard" stat card — pinned to the bottom
                so the column height matches the right column. */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2.5">
                  {STAT_AVATARS.map((n) => (
                    <span
                      key={n}
                      className="h-9 w-9 overflow-hidden rounded-full bg-gradient-to-br from-amber-400 to-teal-400 ring-2 ring-white"
                    >
                      <img
                        src={`https://i.pravatar.cc/80?img=${n}`}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </span>
                  ))}
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700 ring-2 ring-white">
                    +
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-1 text-base font-bold text-slate-900">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    3,000+ consultants
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    <Users className="mr-1 inline h-3 w-3 text-slate-400" />
                    Onboarded across legal &amp; tax categories
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Steps */}
          <div className="grid h-full gap-6 sm:grid-cols-2">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.titleKey}
                  className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-teal-300 hover:shadow-glow-cyan"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-gradient-to-br group-hover:from-indigo-600 group-hover:to-violet-600 group-hover:text-white">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="bg-gradient-to-br from-indigo-200 to-violet-200 bg-clip-text text-5xl font-bold text-transparent">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 text-base font-semibold text-slate-900">
                    {t(step.titleKey)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {t(step.descKey)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Video modal — only mounted while open so the <video> element
          isn't left running in the background. */}
      {videoOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="How Pro Firmo works"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          <button
            type="button"
            aria-label="Close video"
            onClick={() => setVideoOpen(false)}
            className="absolute inset-0 cursor-default bg-slate-900/80 backdrop-blur-sm"
          />
          <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-2xl">
            <button
              type="button"
              onClick={() => setVideoOpen(false)}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-slate-900/70 text-white transition hover:bg-slate-900"
            >
              <X className="h-4 w-4" />
            </button>
            <video
              src="/howitworks.mp4"
              controls
              autoPlay
              playsInline
              className="block h-auto w-full"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}
    </section>
  );
}
