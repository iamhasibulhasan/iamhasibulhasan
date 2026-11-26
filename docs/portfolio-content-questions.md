# Questions to strengthen the case studies

The four case studies were drafted from the résumé only, so most of their
sections are empty and hidden for now. Answers to the questions below go into
`src/data/case-studies.ts`; a section appears on the page as soon as it has
content.

## Confirm what I inferred

1. Was the **US Bangla Land Asset Purchase & Sale** platform built at Cartup
   Ltd.? (Same dates as your Cartup role, so the timeline lists it there.)
2. Was **People Hub** built at ERA Infotech, and the **ERP** at Mass Data? (Also
   matched by dates.)

## For each project (Cartup Inventory, US Bangla Land, People Hub, ERP)

1. **The problem**, in your words: what was broken or missing before?
2. **Constraints**: scale, deadlines, legacy systems, team size, compliance.
3. **Two or three key decisions**, each with what you chose, why, and the
   alternatives you turned down.
4. **Results you can put a number on**: requests per day, records handled,
   time saved, fewer errors, users onboarded.
5. **What was yours** and what was shared with teammates.
6. **The architecture**, if you'd like a diagram: services, databases, queues,
   and how they connect.

## Assets

- **Screenshots** for US Bangla Land, People Hub and the ERP (Cartup now uses
  screenshots of the live cartup.com storefront) (ideally 16:10, about 1600×1000). Put them
  in `public/images/projects/<project>/` and list them in
  `src/data/portfolio.ts` in place of the placeholder.
- **The guide's name** is "Solvorn"; change `GUIDE_NAME` in `src/lib/guide/identity.ts`
  to rename it.

## Renosia Tech

1. What's your role at **Renosia Tech**: founder, owner, or one of the team?
   Should it get its own entry in the Experience timeline, and since when?
2. For **Renvoice**, **Renosia Admin** and **Orbivo**: when did you build each,
   what's the stack beyond React + Vite (backend, payments, PDF engine), and
   are Renosia Admin and Orbivo products you sell as templates? Each could
   become a case study.
3. A bug on Renosia Admin: opening an inner page directly (for example
   `https://reno-admin.renosiatech.com/apps/chat`) returns the host's
   `404: NOT_FOUND`. The host needs a rewrite that sends every route to
   `index.html`.
