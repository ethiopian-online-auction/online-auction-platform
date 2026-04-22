# Design Document: AuctionET Feature Completion

## Overview

This document covers the technical design for completing three partially or unimplemented features
on the AuctionET platform:

1. **Local Language Support** — expand the existing ~45-key i18n system to full UI coverage with
   type-safe enforcement and proper English fallback.
2. **Data Analytics Dashboards** — add a charting layer (recharts) to the admin panel and a new
   seller analytics page, backed by a pre-aggregating API endpoint.
3. **Bidder Information Encryption** — implement AES-256-GCM sealed-bid encryption so bid amounts
   and bidder identities are hidden during active auctions and revealed only after auction end.

All three features build on the existing Node.js/Express/PostgreSQL backend and Next.js 14 frontend
without replacing any currently working functionality.

---

## Architecture

### System Context

```
┌─────────────────────────────────────────────────────────────────┐
│  Next.js 14 Frontend (App Router + TypeScript + Tailwind)       │
│                                                                  │
│  LanguageContext ──► i18n.ts (expanded, type-safe)              │
│  AdminPage ──────► AnalyticsTab ──► recharts components         │
│  /seller/analytics ──────────────► recharts components          │
│  AuctionPage ────► bid history (masked/revealed per status)     │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP / WebSocket
┌──────────────────────────────▼──────────────────────────────────┐
│  Express Backend                                                 │
│                                                                  │
│  GET /api/admin/analytics?range=7|30|90                         │
│  GET /api/auctions/:id/bids  (masked or revealed)               │
│  POST /api/bids              (encrypt before INSERT)            │
│  bid-encryption.service.js   (AES-256-GCM, HKDF)               │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│  PostgreSQL                                                      │
│  bids (encrypted amount + bidder_id)                            │
│  revealed_bids (plaintext after auction end)                    │
│  users (language_preference column)                             │
└─────────────────────────────────────────────────────────────────┘
```

### Feature Interaction Map

- The encryption service is called inside `bid.controller.js` before every INSERT into `bids`.
- The analytics endpoint is a new route added to `admin.routes.js` and handled by a new function
  in `admin.controller.js`.
- The i18n expansion is purely frontend — no backend changes except adding `language_preference`
  support to the notification creation path.

---

## Components and Interfaces

### Feature 1: Local Language Support

#### `frontend/lib/i18n.ts` (rewrite)

The current implementation uses three inline objects and a loose `string` key lookup. The redesign
uses a single `TranslationKeys` interface as the source of truth.

```typescript
// All UI string keys defined once
export interface TranslationKeys {
  // navigation
  home: string;
  aboutUs: string;
  // ... (all keys)
}

// Each language map must satisfy TranslationKeys — compiler enforces completeness
type TranslationMap = Record<Language, TranslationKeys>;

export function t(lang: Language, key: keyof TranslationKeys): string {
  const map = translations[lang];
  // Fallback to English, never to raw key
  return map[key] ?? translations['en'][key];
}

export function serializeMap(map: TranslationKeys): string { ... }
export function deserializeMap(json: string): TranslationKeys | { error: string } { ... }
```

The `TranslationKeys` interface is the single source of truth. Adding a key to the interface without
providing it in all three language objects causes a TypeScript compile error.

#### `frontend/contexts/LanguageContext.tsx` (unchanged interface)

No changes to the context API. The `t()` function signature changes only in that `key` is now
`keyof TranslationKeys` instead of `string`, which is a narrowing — existing call sites remain valid.

#### Notification language support

`backend/src/utils/notification.util.js` will accept an optional `lang` parameter. When creating
notifications, the caller passes the target user's `language_preference`. The util will call a
lightweight server-side translation lookup (a plain JS object mirroring the critical notification
keys in all three languages).

### Feature 2: Data Analytics Dashboards

#### Backend: `GET /api/admin/analytics`

New function `getAnalytics` added to `admin.controller.js`:

```javascript
// Query parameters: range = 7 | 30 | 90 (default 30)
// Returns:
{
  "bidsPerDay":          [{ "date": "2025-07-01", "count": 42 }, ...],
  "revenuePerDay":       [{ "date": "2025-07-01", "amount": 15000 }, ...],
  "registrationsPerDay": [{ "date": "2025-07-01", "count": 5 }, ...],
  "categoryDistribution":[{ "category": "Electronics", "count": 18 }, ...]
}
```

The endpoint generates a complete date series for the range (filling zeros for days with no data)
so the frontend never receives a sparse array.

#### Backend: `GET /api/seller/analytics`

New function `getSellerAnalytics` added to `seller.controller.js`:

```javascript
// Auth: seller JWT required
// Returns:
{
  "bidsPerAuction":  [{ "auctionId": "...", "title": "...", "bidCount": 12 }, ...],
  "revenueOverTime": [{ "date": "2025-07-01", "amount": 5000 }, ...],
  "summary": {
    "totalAuctions": 8,
    "totalRevenue": 45000,
    "avgBidsPerAuction": 9.5
  }
}
```

#### Frontend: Admin Analytics Tab

Added to `frontend/app/admin/page.tsx` as a new tab entry `{ id: 'analytics', label: 'Analytics', icon: '📈' }`.

The tab renders four `recharts` chart components:
- `<LineChart>` — bids per day
- `<BarChart>` — revenue per day
- `<PieChart>` — category distribution
- `<LineChart>` — registrations per day

Each chart is wrapped in a `<ChartCard>` component that handles the empty-state display.

#### Frontend: Seller Analytics Page

New file `frontend/app/seller/analytics/page.tsx`. Renders:
- Summary cards (total auctions, total revenue, avg bids/auction)
- `<BarChart>` — bids received per auction
- `<LineChart>` — revenue over time

#### `<ChartCard>` component

```typescript
interface ChartCardProps {
  title: string;
  data: unknown[];
  children: React.ReactNode; // the recharts chart
}
// Renders children when data.length > 0
// Renders <EmptyState text="No data available for this period" /> when data.length === 0
```

### Feature 3: Bidder Information Encryption

#### `backend/src/services/bid-encryption.service.js`

```javascript
// Public API:
encryptBid(auctionId, plaintext)  → { iv, authTag, ciphertext }  (all hex strings)
decryptBid(auctionId, encrypted)  → plaintext string
deriveAuctionKey(auctionId)       → Buffer (32 bytes, via HKDF-SHA256)
revealBids(auctionId)             → Promise<void>  (idempotent)
```

Key derivation uses Node.js `crypto.hkdfSync`:
```
key = HKDF-SHA256(
  ikm  = BID_ENCRYPTION_MASTER_KEY (hex-decoded),
  salt = Buffer(0),
  info = Buffer(auctionId, 'utf8'),
  length = 32
)
```

Each field (amount, bidder_id) is encrypted independently with a fresh random IV per call.

#### Startup guard in `backend/src/server.js`

```javascript
if (!process.env.BID_ENCRYPTION_MASTER_KEY) {
  console.error('FATAL: BID_ENCRYPTION_MASTER_KEY is not set. Server cannot start.');
  process.exit(1);
}
```

This check runs before any route registration.

#### Modified `bid.controller.js` — `placeBid`

Before the `INSERT INTO bids` statement:
```javascript
const { encryptBid } = require('../services/bid-encryption.service');
const encAmount   = encryptBid(auctionId, String(amount));
const encBidderId = encryptBid(auctionId, String(userId));
// INSERT uses encAmount and encBidderId; also store encrypted current_bid on auctions
```

#### Modified bid history endpoint

`GET /api/auctions/:id/bids` checks `auction.status`:
- `active` → return `{ amount: '***', bidder_name: 'Anonymous Bidder', bid_time, status }`
- `ended` → JOIN with `revealed_bids` and return plaintext amounts and bidder names
- Admin role → always return from `revealed_bids` (or decrypt on the fly for ended auctions)

---

## Data Models

### New table: `revealed_bids`

```sql
CREATE TABLE revealed_bids (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id   UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    bid_id       UUID NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
    bidder_id    UUID NOT NULL REFERENCES users(id),
    amount       DECIMAL(15, 2) NOT NULL,
    bid_time     TIMESTAMP NOT NULL,
    revealed_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (bid_id)   -- idempotency: one revealed row per original bid
);

CREATE INDEX idx_revealed_bids_auction ON revealed_bids(auction_id);
```

The `UNIQUE (bid_id)` constraint is the database-level enforcement of idempotency for `revealBids()`.

### Modified `bids` table

```sql
-- Existing column already present:
is_encrypted BOOLEAN DEFAULT FALSE

-- New columns added via migration:
ALTER TABLE bids ADD COLUMN IF NOT EXISTS encrypted_amount   TEXT;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS encrypted_bidder_id TEXT;
-- The existing DECIMAL amount column is kept for the current-bid tracker
-- (stores the encrypted hex string cast — see note below)
```

Design decision: rather than changing the `amount` column type (which would break existing queries),
we add `encrypted_amount` and `encrypted_bidder_id` TEXT columns. The `amount` column continues to
hold the numeric value for wallet deduction logic (which runs server-side before encryption). The
`is_encrypted` flag signals to the bid history endpoint which columns to use.

### Modified `users` table

```sql
-- Already exists in schema; ensure 'or' is a valid value:
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_language_preference_check;
ALTER TABLE users ADD CONSTRAINT users_language_preference_check
  CHECK (language_preference IN ('en', 'am', 'or'));
```

### Analytics queries (no new tables)

The analytics endpoint aggregates from existing tables:

```sql
-- Bids per day
SELECT DATE(bid_time) as date, COUNT(*) as count
FROM bids
WHERE bid_time >= NOW() - INTERVAL '$range days'
GROUP BY DATE(bid_time);

-- Revenue per day (winning bids on completed auctions)
SELECT DATE(b.bid_time) as date, SUM(rb.amount) as amount
FROM revealed_bids rb
JOIN bids b ON rb.bid_id = b.id
JOIN auctions a ON rb.auction_id = a.id
WHERE a.status = 'ended' AND b.bid_time >= NOW() - INTERVAL '$range days'
  AND b.status = 'won'
GROUP BY DATE(b.bid_time);

-- Registrations per day
SELECT DATE(created_at) as date, COUNT(*) as count
FROM users
WHERE created_at >= NOW() - INTERVAL '$range days'
GROUP BY DATE(created_at);

-- Category distribution
SELECT category, COUNT(*) as count
FROM auctions
WHERE status = 'active'
GROUP BY category;
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a
system — essentially, a formal statement about what the system should do. Properties serve as the
bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Key Set Symmetry

*For any* language code `L` in `{am, or}`, the set of keys in `translations[L]` must equal the set
of keys in `translations['en']`. No key present in English may be absent in another language, and
no extra key may appear in a non-English map.

**Validates: Requirements 1.1**

---

### Property 2: No Raw-Key Leakage

*For any* key `k` in `TranslationKeys` and any language `L` in `{am, or}`, calling `t(L, k)` must
return a string that is not identical to `k` itself. A return value equal to the key string indicates
the translation is missing and the raw key is leaking.

**Validates: Requirements 1.2, 1.4**

---

### Property 3: English Fallback for Missing Keys

*For any* key `k` that exists in the English translation map, if `k` is absent from the Amharic or
Afan Oromo map, then `t('am', k)` and `t('or', k)` must return `t('en', k)` — the English string —
rather than the raw key identifier.

**Validates: Requirements 1.6**

---

### Property 4: Notification Language Preference

*For any* user with `language_preference = 'am'` or `'or'`, when a notification is created for that
user, the stored `title` and `message` fields must not be identical to the English versions of those
strings (confirming the preferred language was applied).

**Validates: Requirements 1.5**

---

### Property 5: Translation Map Serialization Round-Trip

*For any* valid `TranslationKeys` object `M`, deserializing the serialized form must produce an
object that deeply equals `M`:
`deserializeMap(serializeMap(M))` deeply equals `M`.

**Validates: Requirements 4.2, 4.4**

---

### Property 6: Analytics Aggregation Invariant

*For any* time range `R` in `{7, 30, 90}`, the sum of all `count` values in the `bidsPerDay` array
returned by `GET /api/admin/analytics?range=R` must equal the total number of rows in the `bids`
table with `bid_time >= NOW() - R days`.

**Validates: Requirements 2.9**

---

### Property 7: Bid Encryption Invariant

*For any* bid with plaintext amount `a` and bidder ID `u`, after `placeBid` completes, the
`encrypted_amount` stored in the `bids` table must not equal `String(a)`, and the
`encrypted_bidder_id` must not equal `String(u)`. The `is_encrypted` flag must be `true`.

**Validates: Requirements 3.1, 3.2**

---

### Property 8: Per-Auction Key Isolation

*For any* two distinct auction IDs `id1` and `id2`, `deriveAuctionKey(id1)` must not equal
`deriveAuctionKey(id2)`. Encrypting the same plaintext with both keys must produce different
ciphertexts, ensuring compromise of one auction's key does not expose another auction's bids.

**Validates: Requirements 3.6**

---

### Property 9: Encrypt/Decrypt Round-Trip

*For any* auction ID and any plaintext string `p` (representing a bid amount or bidder ID),
`decryptBid(auctionId, encryptBid(auctionId, p))` must equal `p` exactly.

**Validates: Requirements 3.1, 3.4, 3.5**

---

### Property 10: revealBids Idempotence

*For any* ended auction ID, calling `revealBids(auctionId)` once and then calling it again must
result in the same number of rows in `revealed_bids` for that auction. The second call must not
insert duplicate records or alter existing ones.

**Validates: Requirements 3.8**

---

## Error Handling

### Feature 1 — i18n

| Scenario | Behavior |
|---|---|
| Key exists in `en` but not in `am`/`or` | `t()` returns English string (Property 3) |
| Key does not exist in any language | `t()` returns empty string `''` (never throws) |
| `deserializeMap()` receives malformed JSON | Returns `{ error: "Invalid JSON" }` |
| `deserializeMap()` receives JSON missing required keys | Returns `{ error: "Missing key: <firstMissingKey>" }` |

### Feature 2 — Analytics

| Scenario | Behavior |
|---|---|
| `range` param is not 7, 30, or 90 | Backend returns 400 with `"range must be 7, 30, or 90"` |
| No data exists for the range | Returns zero-filled date series (never empty array) |
| Database query fails | Returns 500 with generic error; frontend shows error toast |
| Seller requests analytics for auctions they don't own | Filtered by `seller_id = req.user.userId` |

### Feature 3 — Encryption

| Scenario | Behavior |
|---|---|
| `BID_ENCRYPTION_MASTER_KEY` not set at startup | `process.exit(1)` with fatal log |
| Decryption fails (corrupted ciphertext) | `decryptBid` throws; `revealBids` logs error and skips that bid |
| `revealBids` called on active auction | Returns early with error: `"Auction is not ended"` |
| Bid history requested for active auction by non-admin | Returns masked data (amount=`"***"`, bidder=`"Anonymous Bidder"`) |
| Bid history requested for active auction by admin | Returns masked data (admin sees full data only for ended auctions) |

---

## Testing Strategy

### Dual Testing Approach

Both unit tests and property-based tests are required. Unit tests cover specific examples and
integration points; property tests verify universal correctness across randomized inputs.

### Property-Based Testing Library

**Backend (Node.js):** `fast-check` — `npm install --save-dev fast-check`  
**Frontend (TypeScript):** `fast-check` — same library, works in Jest/Vitest

Each property test must run a minimum of **100 iterations**.

Tag format for each test:
```
// Feature: auction-platform-feature-audit, Property <N>: <property_text>
```

### Property Test Specifications

**Property 1 — Key Set Symmetry**
```javascript
// Feature: auction-platform-feature-audit, Property 1: Key Set Symmetry
fc.assert(fc.property(fc.constant(null), () => {
  const enKeys = new Set(Object.keys(translations['en']));
  const amKeys = new Set(Object.keys(translations['am']));
  const orKeys = new Set(Object.keys(translations['or']));
  return setsEqual(enKeys, amKeys) && setsEqual(enKeys, orKeys);
}), { numRuns: 100 });
```

**Property 2 — No Raw-Key Leakage**
```javascript
// Feature: auction-platform-feature-audit, Property 2: No Raw-Key Leakage
fc.assert(fc.property(
  fc.constantFrom(...Object.keys(translations['en'])),
  fc.constantFrom('am', 'or'),
  (key, lang) => t(lang, key) !== key
), { numRuns: 100 });
```

**Property 3 — English Fallback**
```javascript
// Feature: auction-platform-feature-audit, Property 3: English Fallback
// Inject a key that exists only in 'en', verify fallback
fc.assert(fc.property(fc.string(), (randomKey) => {
  // Simulate missing key scenario via the fallback path
  const result = fallbackLookup('am', randomKey);
  return result === translations['en'][randomKey] || result === '';
}), { numRuns: 100 });
```

**Property 5 — Serialization Round-Trip**
```javascript
// Feature: auction-platform-feature-audit, Property 5: Serialization Round-Trip
fc.assert(fc.property(arbitraryTranslationMap(), (map) => {
  const result = deserializeMap(serializeMap(map));
  return !('error' in result) && deepEqual(result, map);
}), { numRuns: 100 });
```

**Property 6 — Analytics Aggregation Invariant**
```javascript
// Feature: auction-platform-feature-audit, Property 6: Analytics Aggregation Invariant
// Integration test against test DB
fc.assert(fc.property(fc.constantFrom(7, 30, 90), async (range) => {
  const response = await getAnalytics(range);
  const sumFromApi = response.bidsPerDay.reduce((s, d) => s + d.count, 0);
  const countFromDb = await countBidsInRange(range);
  return sumFromApi === countFromDb;
}), { numRuns: 100 });
```

**Property 7 — Bid Encryption Invariant**
```javascript
// Feature: auction-platform-feature-audit, Property 7: Bid Encryption Invariant
fc.assert(fc.property(
  fc.uuid(),
  fc.integer({ min: 100, max: 10_000_000 }),
  (auctionId, amount) => {
    const enc = encryptBid(auctionId, String(amount));
    return enc.ciphertext !== String(amount);
  }
), { numRuns: 100 });
```

**Property 8 — Per-Auction Key Isolation**
```javascript
// Feature: auction-platform-feature-audit, Property 8: Per-Auction Key Isolation
fc.assert(fc.property(fc.uuid(), fc.uuid(), (id1, id2) => {
  fc.pre(id1 !== id2);
  return !deriveAuctionKey(id1).equals(deriveAuctionKey(id2));
}), { numRuns: 100 });
```

**Property 9 — Encrypt/Decrypt Round-Trip**
```javascript
// Feature: auction-platform-feature-audit, Property 9: Encrypt/Decrypt Round-Trip
fc.assert(fc.property(
  fc.uuid(),
  fc.string({ minLength: 1 }),
  (auctionId, plaintext) => {
    return decryptBid(auctionId, encryptBid(auctionId, plaintext)) === plaintext;
  }
), { numRuns: 100 });
```

**Property 10 — revealBids Idempotence**
```javascript
// Feature: auction-platform-feature-audit, Property 10: revealBids Idempotence
fc.assert(fc.property(fc.uuid(), async (auctionId) => {
  await setupEndedAuction(auctionId);
  await revealBids(auctionId);
  const count1 = await countRevealedBids(auctionId);
  await revealBids(auctionId);
  const count2 = await countRevealedBids(auctionId);
  return count1 === count2;
}), { numRuns: 100 });
```

### Unit Test Specifications

**Masking during active auction (Requirement 3.3)**
```javascript
// Example: active auction returns masked bids
test('GET /api/auctions/:id/bids returns masked data for active auction', async () => {
  const { auctionId } = await createActiveAuctionWithBid();
  const res = await request(app).get(`/api/auctions/${auctionId}/bids`).set(userAuthHeader);
  expect(res.body.data[0].amount).toBe('***');
  expect(res.body.data[0].bidder_name).toBe('Anonymous Bidder');
});
```

**Startup guard (Requirement 3.7)**
```javascript
// Example: server refuses to start without master key
test('server exits if BID_ENCRYPTION_MASTER_KEY is not set', () => {
  delete process.env.BID_ENCRYPTION_MASTER_KEY;
  expect(() => require('../server')).toThrow();
});
```

**Empty state chart (Requirement 2.6, 2.8)**
```javascript
// Example: ChartCard renders empty state for empty data
test('ChartCard renders empty state when data is empty', () => {
  render(<ChartCard title="Test" data={[]}><div /></ChartCard>);
  expect(screen.getByText('No data available for this period')).toBeInTheDocument();
});
```

**Analytics tab presence (Requirement 2.10)**
```javascript
// Example: admin page contains Analytics tab
test('admin page renders Analytics tab', () => {
  render(<AdminPage />);
  expect(screen.getByText('Analytics')).toBeInTheDocument();
});
```

**Serialization error on missing key (Requirement 4.3)**
```javascript
// Edge case: deserializeMap returns error for missing key
test('deserializeMap returns error for missing required key', () => {
  const incomplete = JSON.stringify({ home: 'HOME' }); // missing all other keys
  const result = deserializeMap(incomplete);
  expect(result).toHaveProperty('error');
  expect(result.error).toMatch(/Missing key:/);
});
```
