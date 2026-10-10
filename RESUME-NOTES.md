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

## Known gaps — address FIRST when the user resumes (never claim done)
1. **Mid-call cutoff NOT implemented** (`app/call/[id]/page.tsx`): auto-cut only at 60 min. A male with 5 min left can talk up to 60 min; deduction caps at remaining (no overcharge) BUT the female earns for unpaid minutes → real money leak. Fix: cut at min(remaining_min*60, 3600)s with a 1-min warning.
2. **Female TEXT not gated by male's subscription** (`app/api/chat/route.ts`): a female can send unlimited text to a male with no/expired subscription (photo/voice/number/link ARE gated on his sub). Product decision needed: (a) block her with "তার সাবস্ক্রিপশন শেষ" notice [recommended], or (b) let her send while he can't reply.
3. **3-partner count is lifetime** (counts all messages ever); renewing 100৳ does not reset. Confirm whether user expects per-subscription reset.

## Full business rules + final spec: see ~/MEMORY.md "WedGo v2 — Current Status" (2026-10-10 ~14:15 section).
