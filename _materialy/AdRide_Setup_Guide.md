# AdRide Reports — Step-by-Step Setup Guide
**How to create 6 Claude Projects + launch your team**

---

## 🎯 WHAT YOU'RE BUILDING

6 interconnected Claude Projects with role-based workflows:

```
MASTER: Project Brief ← Central hub (all refer here)
├── Strategy & Growth (Justyna leads)
├── Technical Setup (Claude Code leads)
├── Product & UX (Justyna leads)
├── Launch Checklist (Justyna + Andrzej)
└── Post-Launch Operations (Andrzej + Justyna)
```

Each project has:
- Specific owner (PM, Dev, or Owner)
- Defined scope (strategy, tech, product, launch, ops)
- Ready-to-paste prompts
- Document uploads
- Team collaboration setup

**Total setup time:** 30 minutes  
**Expected outcome:** Organized, executable roadmap for 8-week launch

---

## 📋 BEFORE YOU START

Gather these (you already have them):
- [ ] CLAUDE.md (in /mnt/user-data/uploads)
- [ ] QUICK_START.md
- [ ] IMPLEMENTATION_CHECKLIST.md
- [ ] kierowca.html
- [ ] reklamodawca.html
- [ ] adride_unit_economics.html
- [ ] mockups.html
- [ ] AdRide_Playbook_8Expert_v3.xlsx

People who need access:
- [ ] Justyna (PM) — needs email
- [ ] Claude Code developer (if external) — needs email
- [ ] You (Andrzej) — admin access

---

## 🚀 STEP-BY-STEP SETUP

### STEP 1: Create the 6 Projects (10 min)

Go to Claude.ai → **Projects** → **New project** (repeat 6 times)

**Project 1: MASTER: Project Brief & Context**
```
Name: MASTER: Project Brief & Context
Description: Central hub — all team members refer here for overview, timeline, and docs
Visibility: Team (share with Justyna)
```

**Project 2: Strategy & Growth**
```
Name: Strategy & Growth
Description: Customer acquisition, messaging, GTM. Justyna leads.
Visibility: Team (share with Justyna, Andrzej)
```

**Project 3: Technical Setup**
```
Name: Technical Setup
Description: Stripe, Supabase, deployment. Claude Code leads.
Visibility: Team (share with Claude Code, Andrzej)
```

**Project 4: Product & UX**
```
Name: Product & UX
Description: Landing page optimization, dashboard flows, user testing. Justyna leads.
Visibility: Team (share with Justyna, Andrzej)
```

**Project 5: Launch Checklist**
```
Name: Launch Checklist
Description: Pre-launch QA, go-live operations. Justyna + Andrzej
Visibility: Team (share with Justyna, Andrzej)
```

**Project 6: Post-Launch Operations**
```
Name: Post-Launch Operations
Description: Daily metrics, growth experiments, scaling. Andrzej + Justyna
Visibility: Team (share with Justyna, Andrzej)
```

---

### STEP 2: Upload Documents (10 min)

For each project, upload relevant documents in this order:

**PROJECT 1 (Master Brief):**
Upload:
1. CLAUDE.md (paste directly in chat or as doc)
2. Screenshot of adride_unit_economics.html

**PROJECT 2 (Strategy & Growth):**
Upload:
1. kierowca.html
2. reklamodawca.html
3. AdRide_Playbook_8Expert_v3.xlsx
4. Screenshot of adride_unit_economics.html

**PROJECT 3 (Technical Setup):**
Upload:
1. QUICK_START.md
2. IMPLEMENTATION_CHECKLIST.md
3. CLAUDE.md (reference)

**PROJECT 4 (Product & UX):**
Upload:
1. kierowca.html
2. reklamodawca.html
3. mockups.html
4. adride_unit_economics.html

**PROJECT 5 (Launch Checklist):**
Upload:
1. QUICK_START.md (reference)
2. IMPLEMENTATION_CHECKLIST.md (reference)

**PROJECT 6 (Post-Launch Operations):**
Upload:
1. None initially — will be populated with real data

---

### STEP 3: Paste Initial Prompts (10 min)

For each project, paste the corresponding prompt from `AdRide_Role_Based_Prompts.md`:

**PROJECT 1: MASTER**
```
Copy and paste the "PROJECT 1: MASTER: Project Brief & Context" section
(from AdRide_Role_Based_Prompts.md) into the first message
```

**PROJECT 2: Strategy & Growth**
```
Copy and paste the "PROJECT 2: Strategy & Growth" section
(from AdRide_Role_Based_Prompts.md) into the first message
Add: "Justyna, this is your project. Start here."
```

**PROJECT 3: Technical Setup**
```
Copy and paste the "PROJECT 3: Technical Setup" section
(from AdRide_Role_Based_Prompts.md) into the first message
Add: "Claude Code, this is your project. Start with QUICK_START.md"
```

**PROJECT 4: Product & UX**
```
Copy and paste the "PROJECT 4: Product & UX" section
(from AdRide_Role_Based_Prompts.md) into the first message
Add: "Justyna, this is your product QA project."
```

**PROJECT 5: Launch Checklist**
```
Copy and paste the "PROJECT 5: Launch Checklist" section
(from AdRide_Role_Based_Prompts.md) into the first message
```

**PROJECT 6: Post-Launch Operations**
```
Copy and paste the "PROJECT 6: Post-Launch Operations" section
(from AdRide_Role_Based_Prompts.md) into the first message
```

---

### STEP 4: Share with Team (5 min)

For each project, invite team members:

**PROJECT 1:** Share with Justyna (read access)
**PROJECT 2:** Share with Justyna (edit access)
**PROJECT 3:** Share with Claude Code (edit access)
**PROJECT 4:** Share with Justyna (edit access)
**PROJECT 5:** Share with Justyna + Andrzej (edit access)
**PROJECT 6:** Share with Justyna + Andrzej (edit access)

**How to invite:**
1. Open project
2. Click **Share** (top right)
3. Enter email → Select permission level → Done

---

### STEP 5: Configure Project Settings (5 min)

For each project, add these settings:

**PROJECT 1 (Master):**
- Set as "reference" project (don't chat much here)
- Pin: CLAUDE.md, timeline, key links
- Description: "Reference only — don't delete"

**PROJECT 2 (Strategy):**
- Set working hours (e.g., 9 AM - 6 PM)
- Enable notifications (new responses)
- Add calendar: Sync with weekly GTM reviews

**PROJECT 3 (Technical):**
- Set working hours (e.g., 8 AM - 8 PM)
- Enable notifications (P0 blockers)
- Add Slack integration (optional, for alerts)

**PROJECT 4 (Product):**
- Set working hours (e.g., 9 AM - 6 PM)
- Enable notifications
- Add calendar: User testing sessions

**PROJECT 5 (Launch):**
- Set working hours (e.g., 24/7 during launch week)
- Enable notifications (all)
- Add calendar: Daily standups

**PROJECT 6 (Operations):**
- Set working hours (e.g., 9 AM - 6 PM)
- Enable notifications (daily metrics)
- Add calendar: Weekly reviews

---

## ✅ VERIFICATION CHECKLIST

After setup, verify:

**Projects Created:**
- [ ] 6 projects visible in Claude Projects dashboard
- [ ] Each has correct name + description
- [ ] Team members have access

**Documents Uploaded:**
- [ ] Each project has relevant docs
- [ ] Docs are readable (no broken links)
- [ ] Team can access all docs

**Prompts Pasted:**
- [ ] Each project has initial prompt
- [ ] Prompt is formatted correctly
- [ ] Team can see prompt in chat history

**Team Configured:**
- [ ] Justyna has edit access to projects 2, 4, 5, 6
- [ ] Claude Code has edit access to project 3
- [ ] Andrzej (you) has admin access to all

**First Sync:**
- [ ] Send Slack message to Justyna + Claude Code
- [ ] Schedule 30-min kickoff meeting
- [ ] Share this document with both

---

## 📞 KICKOFF MEETING AGENDA (30 min)

Send to both: Justyna + Claude Code

```markdown
# AdRide Reports — Project Kickoff

**Date:** [Tomorrow at 10 AM] 
**Attendees:** Andrzej, Justyna, Claude Code
**Duration:** 30 minutes

## Agenda
1. (5 min) Overview of 6-project structure
   - Show the 6 projects
   - Explain why we split it this way

2. (10 min) Role clarity
   - Justyna: Strategy, customer acquisition, product, launch ops
   - Claude Code: All technical implementation
   - Andrzej: Owner, strategy validation, investor relations

3. (10 min) Critical path (next 2 weeks)
   - Claude Code: Get Stripe account + Supabase Vault ready by Day 5
   - Justyna: Start customer interviews + messaging by Day 3
   - Andrzej: Validate hypothesis by Day 7

4. (5 min) Communication & escalation
   - Daily standups: No (async in projects)
   - Weekly syncs: YES (Friday 4 PM)
   - Blockers: Slack immediately
   - Questions: Ask in relevant project

## Pre-Meeting
- [ ] All 3 read CLAUDE.md
- [ ] All 3 browse their own project
- [ ] Clarify any questions

## Post-Meeting
- [ ] Start execution in projects (Day 1)
- [ ] First status update Friday EOD
```

---

## 🎯 WHAT HAPPENS NOW

### Day 1 (After Kickoff)
- **Claude Code:** Opens Technical Setup → starts QUICK_START.md → creates Stripe account
- **Justyna:** Opens Strategy & Growth → lists 10 target drivers → writes first outreach email
- **Andrzej:** Opens Master Brief → reviews progress on all 6 projects

### Week 1
- Claude Code deploys: Stripe webhooks + Supabase migrations
- Justyna recruits: 5 driver outreaches + 2 advertiser pitches
- Andrzej validates: Strategy + investor readiness

### Week 2
- Claude Code tests: First payment flow end-to-end
- Justyna recruits: 10 drivers + 3 advertisers (target)
- Andrzej prepares: Investor pitch + financial model

### Week 3+
- Follow the weekly + sprint cadences in projects
- Ship to production (Week 5)

---

## 📊 SUCCESS METRICS (8 weeks)

| Metric | Target | Owner |
|--------|--------|-------|
| Drivers recruited | 10 | Justyna |
| Advertisers recruited | 3 | Justyna |
| Tech readiness | 0 critical bugs | Claude Code |
| Landing page CTR | >10% | Justyna |
| First campaign completion | Week 6 | All |
| NPS (post-campaign) | >7.0 | Justyna |
| Revenue ($) | 1st payout | Claude Code + Andrzej |

---

## 🚨 CRITICAL THINGS NOT TO DO

❌ Don't:
- Create a 7th project (stick with 6)
- Invite external people to sensitive projects (keep to team)
- Delete any project before launch (archive instead)
- Paste Stripe keys in chat (use Supabase Vault only)
- Skip the kickoff meeting (alignment is critical)
- Change ownership mid-project (causes confusion)

✅ Do:
- Pin important docs in each project
- Use project descriptions for context
- Archive old messages (keep chat clean)
- Escalate P0 blockers immediately
- Weekly reviews (Friday 4 PM)
- Document decisions in Master project

---

## 📚 REFERENCE FILES

Your 3 documents:
1. **AdRide_Projects_Playbook.md** — Full structure + rationale (read first)
2. **AdRide_Role_Based_Prompts.md** — Copy-paste prompts for each project (use during setup)
3. **AdRide_Setup_Guide.md** — This document (step-by-step instructions)

All files are in `/home/claude/` on your machine.

---

## 🎉 YOU'RE READY

Once you've completed STEP 1-5 above:
1. Run the verification checklist
2. Send kickoff invite to Justyna + Claude Code
3. Share this entire guide with them
4. Execute the kickoff meeting
5. Start moving together

**Estimated setup time:** 30 minutes  
**Expected launch:** 8 weeks  
**Success outcome:** 10 drivers + 3 advertisers + 1 completed campaign + revenue flowing

---

**Questions?** Refer back to:
- Master Brief (for overview)
- Role prompts (for specific guidance)
- QUICK_START.md (for technical questions)

**You're launching AdRide. Let's go! 🚀**
