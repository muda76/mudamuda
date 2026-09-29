Homestead Commons
=================

A web app for a semi-rural or suburban neighborhood (built with the Chicago
suburbs in mind) to coordinate **who produces what** (bread, eggs,
vegetables, fruit, honey, grains, mushrooms) so the community covers its
nutritional needs together, and then **trade fairly** for everything
members don't make themselves.

> Man cannot live on bread alone. The baker, the gardener, and the
> hen-keeper trade, and everyone eats better than any of them could alone.

## Features

- **Member accounts.** Name, neighborhood, and household size. Household
  size sizes the community's nutritional needs.
- **What to grow** (`/catalog`). 17 foods across 7 activities. Each one
  shows its nutrients per unit (% of adult Daily Value), labor and material
  cost, growing season in northern Illinois, its value in Harvest Credits,
  and a summary of the typical local rules for that activity (hen permits,
  beehive registration, cottage food).
  Members pledge a weekly quantity of anything they'll produce.
- **Community plate** (`/community`). For any month, it shows how much of the
  neighborhood's weekly nutrition the in-season pledges cover, measured
  against a local-sourcing goal (25% by default). It lists the biggest gaps,
  and for each gap it names the in-season foods that supply the most of that
  nutrient per hour of work.
- **Market** (`/market`). Members post what they have available now.
- **Trades** (`/trade/new`, `/me`). Propose a trade, see a live fairness
  check, then accept, exchange, and mark it complete.

## How "fair" is defined

Everything is valued in **Harvest Credits (HC)**. See `server/src/valuation.js`.

| Dimension | How it's counted |
|---|---|
| Effort | Labor minutes per unit ÷ 60. One hour of kneading = one hour of weeding. |
| Materials | Input cost ÷ $20 per credit (feed, flour, seed, jars). |
| Nutrition | A food that fills the community's *current* nutrient gaps earns up to +25%, so members are rewarded for growing what the neighborhood actually needs. |

Trades don't need to match exactly. Any difference settles in credits when the
trade completes (**mutual credit**). Balances across the community always sum
to zero, and a member can go as low as −10 HC. That way the baker can take
eggs today and repay the neighborhood later, without waiting for the
hen-keeper to want bread. Each quote is locked in when the trade is
proposed, so the terms don't shift before the other side accepts.

The trade screen also shows each side's labor minutes and "nutrient-days"
(the average share of a day's Daily Values supplied, capped per nutrient),
so members can compare effort and nutrition as well as credit value.

The catalog's labor/cost figures and the constants (`DOLLARS_PER_CREDIT`,
`MAX_GAP_BONUS`, `CREDIT_LIMIT`, `LOCAL_GOAL`) are starting estimates, all
in one place so a community can tune them to its own experience.

**Caveats:** nutrient values are rounded approximations from USDA data, and
the local-rules text is general guidance, not legal advice. Rules vary by
village.

## Running it locally

Requires Node 20+.

```bash
# terminal 1: API (http://localhost:4100)
cd homestead/server
npm install
npm run seed      # optional: 8 demo neighbors, password "harvest123"
npm run dev

# terminal 2: front end (http://localhost:5174)
cd homestead/client
npm install
npm run dev
```

Log in as `maria@example.com` / `harvest123` (the baker) or
`dave@example.com` (the hen-keeper) to try a trade from both sides.

```bash
cd homestead/server && npm test   # valuation, nutrition, and API flow tests
```

Data is kept in `server/data/db.json` (gitignored). Delete that file to start
over.

## Deploying

The setup is the same as the cleaning app in the repo root: host the API on
Render (root `homestead/server`, start `npm start`) and the static front end
on Vercel (root `homestead/client`, with `VITE_API_URL` set to the API URL).
The JSON file store needs persistent disk, so before real use, attach a
persistent disk or swap `server/src/store.js` for a database.

## Ideas for next steps

- Email/SMS notifications when a trade is proposed or accepted
- Pickup scheduling and a map of neighbors (opt-in)
- Community-voted tuning of labor estimates and the credit limit
- Shared tools and skills (canning, coop building) valued in the same credits
- Admin/moderation tools and password reset
