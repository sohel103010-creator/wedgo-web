# WedGo — Resume Notes (ফ্রিজ অবস্থা)

**Status:** PAUSED per user on 2026-10-10 ~14:15 Dhaka. Do NOT resume or change code until the user explicitly says so.
**Frozen at:** commit `8bc467a` ("Voice messages only for package 3 & 4 holders"), pushed to `sohel103010-creator/wedgo-web` main. Live on Vercel: https://wedgo-web.vercel.app

## All final business rules — IMPLEMENTED + COMMITTED + PUSHED (user was told done, all true)
- Package limits: Pkg1(100৳)=3 chat partners, 10 days unlimited msg; Pkg2(500৳)=15 views/10 chats; Pkg3(2000৳)=50 views/50 chats; Pkg4(5000৳)=unlimited everything
- Females: functionally 100% free (no "free for females" text anywhere)
- Number/link sharing: ONLY package 4 holders (all-country numbers incl. Bengali digits blocked for others; link patterns blocked); violation → 2-day auto-suspend
- Voice messages: ONLY package 3 & 4 holders; females per male partner's package
- Extra minutes (10m=510, 20m=1020, 30m=2040, 40m=3000): ONLY pkg 3&4, only shown when minutes finished; admin approval adds minutes to subscription (wallet-credit bug fixed)
- Female earnings rates: video 10m=300/20m=500/30m=700/40m=900/50m=1100/60m=1300; audio 10m=100/20m=180/30m=250/60m=400/90m=700/120m=900
- Coupon system REMOVED; gold-hearts logo at public/logo.png; auto-scroll to payment form on Buy click

## Known gaps — status (updated 2026-10-11 ~22:50 Dhaka)
1. **Mid-call cutoff — FIXED** (commit 53ac815): server returns `max_duration_sec` = min(payer male's remaining minutes × 60, 3600) in GET /api/calls; call page cuts at that mark with a 1-min "⏳ ১ মিনিট বাকি" warning banner.
2. **Female TEXT teaser limit — IMPLEMENTED per user's product decision** (commit 53ac815): when the male has no active subscription, the female may send max 3 text messages (counted since his last subscription expired; resets on each expiry) — the renewal hook. Error: "তিনি প্যাকেজ কিনলে আবার কথা বলতে পারবেন 💛". Unlimited while his subscription is active.
3. **3-partner count is lifetime — CONFIRMED as intended behavior** (user decision 2026-10-11 ~22:55): each 100৳ renewal continues chat with the SAME 3 partners; no new partners on renewal. Current code already does exactly this (existing partners bypass the cap check). NO CHANGE NEEDED.

## Full business rules + final spec: see ~/MEMORY.md "WedGo v2 — Current Status" (2026-10-10 ~14:15 section).

## 2026-10-11 ~23:00 — International phone numbers
- Register/login/forgot-password now have a country-code selector (18 countries: BD +91 +92 +966 +971 +974 +965 +968 +973 +60 +65 +44 +1 +61 +39 +33 +49 +34).
- All numbers stored E.164 (+<cc><number>); login/forgot try legacy BD format ("017...") as fallback for old accounts.
- OPEN ISSUE: payments are still BD-only (bKash/Nagad/Rocket) — international users cannot buy packages yet. Needs product decision (Stripe/card?).

## 2026-10-11 ~23:30 — 3 advanced features (commit 42bd6c2, Vercel READY)
1. **BN/EN language slide toggle**: বাং ⇄ EN pill toggle in bottom nav (all member pages) + landing/auth headers; choice saved in localStorage; full dictionary in lib/dict.ts; admin panel + terms/privacy/refund stay Bengali-only.
2. **Web push notifications**: VAPID keys set as Vercel env on wedgo-web project; dashboard has "🔔 নোটিফিকেশন চালু করুন" button; push sent on new chat message + incoming call (fire-and-forget, dead subs pruned); sw.js handles push + click-to-open.
3. **Today's top matches**: /api/daily-matches returns top-5 by compatibility, rotated daily; shown on dashboard in pink-bordered card.
Note: VAPID vars were briefly created on zenera-shop project by mistake — harmless (unused there), correct ones live on wedgo-web.
