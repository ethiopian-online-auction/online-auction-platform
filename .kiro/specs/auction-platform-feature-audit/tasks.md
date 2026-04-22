# Implementation Plan: AuctionET Feature Completion

## Overview

Incremental implementation of three features: Local Language Support (i18n expansion), Data Analytics
Dashboards (recharts + backend endpoint), and Bidder Information Encryption (AES-256-GCM sealed bids).
Each feature builds independently; encryption wiring is last to avoid breaking existing bid flow.

## Tasks

- [x] 1. Expand i18n system with type-safe TranslationKeys interface
  - Rewrite `frontend/lib/i18n.ts` to define a `TranslationKeys` interface as the single source of truth
  - Replace the loose `string` key lookup with `keyof TranslationKeys` so missing translations are compile errors
  - Populate English, Amharic, and Afan Oromo maps with all UI strings for: navigation, page headings, form labels, button text, table headers, status messages, error codes, admin dashboard, create-auction, seller dashboard, disputes, checkout, settings, become-seller pages
  - Implement `t(lang, key)` with English fallback: return `translations['en'][key]` when key is absent from the selected language map; never return the raw key string
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 1.7_

  - [ ]* 1.1 Write property test for Key Set Symmetry (Property 1)
    - **Property 1: Key Set Symmetry**
    - **Validates: Requirements 1.1**
    - Use `fc.constant(null)` to assert `keys(translations['am'])` equals `keys(translations['en'])` and same for `'or'`

  - [ ]* 1.2 Write property test for No Raw-Key Leakage (Property 2)
    - **Property 2: No Raw-Key Leakage**
    - **Validates: Requirements 1.2, 1.4**
    - Use `fc.constantFrom(...Object.keys(translations['en']))` and `fc.constantFrom('am', 'or')` to assert `t(lang, key) !== key`

  - [ ]* 1.3 Write property test for English Fallback (Property 3)
    - **Property 3: English Fallback for Missing Keys**
    - **Validates: Requirements 1.6**
    - Simulate missing-key scenario via the fallback path; assert result equals `translations['en'][key]` or `''`

- [ ] 2. Add serialization utilities to i18n.ts
  - Implement `serializeMap(map: TranslationKeys): string` — returns `JSON.stringify(map)`
  - Implement `deserializeMap(json: string): TranslationKeys | { error: string }` — validates all required keys are present; returns `{ error: "Missing key: <firstMissingKey>" }` on failure
  - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 2.1 Write property test for Serialization Round-Trip (Property 5)
    - **Property 5: Translation Map Serialization Round-Trip**
    - **Validates: Requirements 4.2, 4.4**
    - Use `arbitraryTranslationMap()` fast-check arbitrary; assert `deepEqual(deserializeMap(serializeMap(M)), M)`

  - [ ]* 2.2 Write unit test for deserializeMap error on missing key
    - Test that `deserializeMap(JSON.stringify({ home: 'HOME' }))` returns `{ error: /Missing key:/ }`
    - _Requirements: 4.3_

- [ ] 3. Wire t() calls into all untranslated pages
  - Update `frontend/app/admin/page.tsx`, `frontend/app/create-auction/page.tsx`, `frontend/app/dashboard/page.tsx`, disputes, checkout, settings, and become-seller pages to replace hardcoded English strings with `t(lang, key)` calls using the `LanguageContext`
  - _Requirements: 1.2, 1.3_

- [ ] 4. Add notification language preference support
  - Update `backend/src/utils/notification.util.js` to accept an optional `lang` parameter (`'en' | 'am' | 'or'`)
  - Add a server-side JS object with critical notification keys in all three languages
  - When `lang` is `'am'` or `'or'`, store the notification `title` and `message` in the preferred language
  - _Requirements: 1.5_

- [ ] 5. Checkpoint — i18n complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Add backend analytics endpoint
  - Add `getAnalytics(req, res)` function to `backend/src/controllers/admin.controller.js`
  - Accept `?range=7|30|90` query param; return 400 for invalid values
  - Run four SQL queries: bids per day, revenue per day (from `revealed_bids` JOIN), registrations per day, category distribution
  - Generate a complete date series for the range (fill zeros for days with no data) so the frontend never receives a sparse array
  - Register route `GET /api/admin/analytics` in the admin routes file
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.9_

  - [ ]* 6.1 Write property test for Analytics Aggregation Invariant (Property 6)
    - **Property 6: Analytics Aggregation Invariant**
    - **Validates: Requirements 2.9**
    - Use `fc.constantFrom(7, 30, 90)`; assert `SUM(bidsPerDay[i].count) === COUNT(*) FROM bids WHERE bid_time >= NOW() - range days`

- [ ] 7. Add backend seller analytics endpoint
  - Add `getSellerAnalytics(req, res)` to `backend/src/controllers/seller.controller.js`
  - Filter all queries by `seller_id = req.user.userId`
  - Return `{ bidsPerAuction, revenueOverTime, summary: { totalAuctions, totalRevenue, avgBidsPerAuction } }`
  - Register route `GET /api/seller/analytics` with seller JWT middleware
  - _Requirements: 2.7_

- [ ] 8. Install recharts and build admin Analytics tab
  - Run `npm install recharts` in the frontend directory
  - Create `frontend/components/ChartCard.tsx` — renders children when `data.length > 0`; renders `<p>No data available for this period</p>` when `data.length === 0`
  - Add `analytics` tab entry to the tabs array in `frontend/app/admin/page.tsx`
  - Implement the Analytics tab panel with four `recharts` charts: `<LineChart>` bids per day, `<BarChart>` revenue per day, `<PieChart>` category distribution, `<LineChart>` registrations per day
  - Add a time-range selector (7 / 30 / 90 days) that re-fetches all charts on change
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.10_

  - [ ]* 8.1 Write unit test for ChartCard empty state
    - Assert `ChartCard` renders "No data available for this period" when `data={[]}`
    - _Requirements: 2.6, 2.8_

  - [ ]* 8.2 Write unit test for Analytics tab presence
    - Assert admin page renders a tab with text "Analytics"
    - _Requirements: 2.10_

- [ ] 9. Build seller analytics page
  - Create `frontend/app/seller/analytics/page.tsx`
  - Fetch from `GET /api/seller/analytics` with seller JWT
  - Render summary cards (total auctions, total revenue, avg bids/auction)
  - Render `<BarChart>` bids per auction and `<LineChart>` revenue over time, both wrapped in `<ChartCard>`
  - _Requirements: 2.7_

- [ ] 10. Checkpoint — analytics complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Add startup guard for BID_ENCRYPTION_MASTER_KEY
  - In `backend/src/server.js`, before any route registration, add:
    ```js
    if (!process.env.BID_ENCRYPTION_MASTER_KEY) {
      console.error('FATAL: BID_ENCRYPTION_MASTER_KEY is not set. Server cannot start.');
      process.exit(1);
    }
    ```
  - _Requirements: 3.7_

  - [ ]* 11.1 Write unit test for startup guard
    - Assert server throws / exits when `BID_ENCRYPTION_MASTER_KEY` is absent
    - _Requirements: 3.7_

- [ ] 12. Create bid-encryption.service.js
  - Create `backend/src/services/bid-encryption.service.js`
  - Implement `deriveAuctionKey(auctionId)` using `crypto.hkdfSync('sha256', masterKeyBuffer, Buffer.alloc(0), Buffer.from(auctionId, 'utf8'), 32)`
  - Implement `encryptBid(auctionId, plaintext)` → `{ iv, authTag, ciphertext }` (all hex strings) using AES-256-GCM with a fresh random IV per call
  - Implement `decryptBid(auctionId, { iv, authTag, ciphertext })` → plaintext string; throw on auth tag mismatch
  - Implement `revealBids(auctionId)` — idempotent: INSERT INTO `revealed_bids` using `ON CONFLICT (bid_id) DO NOTHING`; return early with error if auction status is not `ended`
  - _Requirements: 3.1, 3.2, 3.4, 3.6, 3.8_

  - [ ]* 12.1 Write property test for Encrypt/Decrypt Round-Trip (Property 9)
    - **Property 9: Encrypt/Decrypt Round-Trip**
    - **Validates: Requirements 3.1, 3.4, 3.5**
    - Use `fc.uuid()` and `fc.string({ minLength: 1 })`; assert `decryptBid(id, encryptBid(id, p)) === p`

  - [ ]* 12.2 Write property test for Per-Auction Key Isolation (Property 8)
    - **Property 8: Per-Auction Key Isolation**
    - **Validates: Requirements 3.6**
    - Use two `fc.uuid()` arbitraries with `fc.pre(id1 !== id2)`; assert `!deriveAuctionKey(id1).equals(deriveAuctionKey(id2))`

  - [ ]* 12.3 Write property test for Bid Encryption Invariant (Property 7)
    - **Property 7: Bid Encryption Invariant**
    - **Validates: Requirements 3.1, 3.2**
    - Use `fc.uuid()` and `fc.integer({ min: 100, max: 10_000_000 })`; assert `enc.ciphertext !== String(amount)`

  - [ ]* 12.4 Write property test for revealBids Idempotence (Property 10)
    - **Property 10: revealBids Idempotence**
    - **Validates: Requirements 3.8**
    - Call `revealBids(auctionId)` twice; assert `COUNT(*) FROM revealed_bids` is the same after both calls

- [ ] 13. Add DB migration for encryption columns and revealed_bids table
  - Create `backend/database/migrations/add-bid-encryption.sql`
  - Add `ALTER TABLE bids ADD COLUMN IF NOT EXISTS encrypted_amount TEXT` and `encrypted_bidder_id TEXT`
  - Create `revealed_bids` table with `UNIQUE (bid_id)` constraint for idempotency
  - Add `CREATE INDEX idx_revealed_bids_auction ON revealed_bids(auction_id)`
  - _Requirements: 3.1, 3.2, 3.4, 3.8_

- [ ] 14. Modify bid.controller.js to encrypt bids on placement
  - In `placeBid`, require `bid-encryption.service.js`
  - Before the `INSERT INTO bids`, call `encryptBid(auctionId, String(amount))` and `encryptBid(auctionId, String(userId))`
  - Store results in `encrypted_amount` and `encrypted_bidder_id`; set `is_encrypted = true`
  - Keep the numeric `amount` column for wallet deduction logic (server-side only)
  - _Requirements: 3.1, 3.2_

- [ ] 15. Modify bid history endpoint to mask or reveal based on auction status
  - In `bid.controller.js` (or the relevant route handler for `GET /api/auctions/:id/bids`):
    - If `auction.status === 'active'` and requester is not admin: return `{ amount: '***', bidder_name: 'Anonymous Bidder', bid_time, status }`
    - If `auction.status === 'ended'`: JOIN with `revealed_bids` and return plaintext amounts and bidder names
  - _Requirements: 3.3, 3.5, 3.9, 3.10_

  - [ ]* 15.1 Write unit test for masking during active auction
    - Assert `GET /api/auctions/:id/bids` returns `amount: '***'` and `bidder_name: 'Anonymous Bidder'` for active auction
    - _Requirements: 3.3_

- [ ] 16. Wire revealBids into auction end transition
  - Find the location where auction status transitions to `ended` (auction scheduler or auction controller)
  - Call `revealBids(auctionId)` after the status update
  - Log and skip any bid that fails decryption rather than aborting the entire reveal
  - _Requirements: 3.4, 3.5_

- [ ] 17. Final checkpoint — encryption complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` with a minimum of 100 iterations per run
- The `UNIQUE (bid_id)` constraint in `revealed_bids` is the database-level idempotency guarantee for `revealBids()`
- The numeric `amount` column in `bids` is preserved for wallet deduction; only `encrypted_amount` is exposed to the bid history endpoint
