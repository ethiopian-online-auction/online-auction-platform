# Requirements Document

## Introduction

AuctionET (BidAmharic) is an Ethiopian online auction platform built with Node.js/Express, PostgreSQL,
Next.js 14, and Socket.io. This document serves a dual purpose:

1. **Audit** — records the implementation status of all 11 required features against the actual codebase.
2. **Completion Requirements** — defines formal requirements for the two partially-implemented features
   (Local Language Support, Data Analytics Dashboards) and the one missing feature
   (Bidder Information Encryption), so that the platform fully satisfies all university requirements.

---

## Glossary

- **AuctionET**: The Ethiopian online auction platform (also referred to as BidAmharic).
- **Platform**: The combined frontend (Next.js 14) and backend (Node.js/Express + PostgreSQL) system.
- **I18n_System**: The internationalization layer comprising `frontend/lib/i18n.ts`, `LanguageContext`, and the `t()` translation function.
- **Translation_Map**: The per-language key-value object inside `getTranslation()` that maps string keys to localized text.
- **Analytics_Dashboard**: The admin-facing and seller-facing pages that display bidding trends, user behavior, and platform performance data.
- **Chart_Component**: A React component that renders a visual chart (bar, line, pie, or area) using a charting library.
- **Encryption_Service**: The backend service responsible for encrypting bid amounts and bidder identities before storage and decrypting them after auction conclusion.
- **Sealed_Bid**: A bid whose amount and bidder identity are encrypted at rest and not revealed to other participants until the auction ends.
- **Auction_End**: The moment when `auctions.end_time` is reached and the auction status transitions to `ended`.
- **Bid**: A record in the `bids` table representing a user's offer on an auction item.
- **Bidder**: A verified user who places bids on auctions.
- **Seller**: A verified user who creates and manages auction listings.
- **Admin**: A platform administrator with elevated privileges.
- **ETB**: Ethiopian Birr, the currency used on the platform.
- **ML_Fraud_Service**: `backend/src/services/ml-fraud-detection.service.js` — the UCI Shill Bidding Dataset-based fraud scoring engine.
- **Escrow_Service**: `backend/src/services/blockchain-escrow.service.js` — the simulated blockchain escrow lifecycle manager.
- **Recommendation_Service**: `backend/src/services/recommendation.service.js` — the AI bid and auction creation advisor.
- **Notification_Service**: `backend/src/utils/notification.util.js` combined with Socket.io — the real-time notification system.
- **Assistant_Service**: `backend/src/services/ai-assistant.service.js` — the keyword-based virtual auctioneer assistant.
- **Fayda_Service**: `backend/src/services/fayda.service.js` — the Ethiopian National ID (eSignet OIDC) verification integration.
- **Payment_Service**: `backend/src/services/payment.service.js` — the unified Chapa/Telebirr/CBE Birr payment integration.

---

## Part 1: Feature Audit

This section documents the verified implementation status of all 11 required features.

### Audit Finding 1: AI-Based Fraud Detection

**Status: FULLY IMPLEMENTED ✅**

The ML_Fraud_Service implements all 10 features from the UCI Shill Bidding Dataset (bidder tendency,
bidding ratio, successive outbidding, last bidding, auction bids, starting price average, early bidding,
winning ratio, auction duration, platform-specific checks). A rule-based layer in
`fraud-detection.service.js` adds checks for multiple accounts, rapid actions, bid sniping, failed
logins, and location hopping. The admin dashboard exposes fraud logs, statistics, ML accuracy metrics,
threshold tuning, and auto-tune. Accounts with a fraud score ≥ 0.70 are automatically locked for 24 hours.

### Audit Finding 2: Smart Contract / Blockchain-Enabled Escrow

**Status: FULLY IMPLEMENTED ✅ (blockchain layer simulated)**

The Escrow_Service implements the full escrow lifecycle: createEscrow, fundEscrow, markShipped,
confirmDelivery, releaseFunds, refundBuyer, and getEscrowStatus. Blockchain transaction hashes are
generated and stored; the real ethers.js/web3 integration layer is present but commented out pending
production smart contract deployment. The frontend auction page includes a full escrow payment modal.

### Audit Finding 3: AI-Powered Recommendation System

**Status: FULLY IMPLEMENTED ✅**

The Recommendation_Service provides `getBidRecommendation()` (minimum/smart/strong bid suggestions,
urgency analysis, competition level, price-vs-market comparison, wallet balance check) and
`getCreateAuctionRecommendation()` (starting price range, duration, market data, top examples).
A `BidRecommendation` React component is integrated into the auction detail page.

### Audit Finding 4: Local Language Support

**Status: PARTIALLY IMPLEMENTED ⚠️ (~20% coverage)**

The I18n_System infrastructure exists: `frontend/lib/i18n.ts` contains Translation_Maps for English,
Amharic (አማርኛ), and Afan Oromo (Afaan Oromoo); `LanguageContext` is used in Navbar, dashboard,
auction page, and notifications page; a language switcher is present in the Navbar. However, only
~45 translation keys exist, covering basic navigation labels. The majority of UI text — including
admin dashboard, create-auction page, seller dashboard, disputes, checkout, settings, become-seller
pages, error messages, notification content, and email templates — is hardcoded in English only.
When a key is missing, `t()` returns the raw key string.

**Completion requirements are defined in Part 2, Requirement 1.**

### Audit Finding 5: Data Analytics Dashboards

**Status: PARTIALLY IMPLEMENTED ⚠️ (data collected, no visual charts)**

The admin dashboard displays raw numeric stats (total revenue, active users, total auctions, pending
disputes), an activity log, fraud detection statistics, and ML model accuracy metrics. No charting
library (recharts, Chart.js, D3, or equivalent) is installed. There are no time-series visualizations,
no user behavior analytics charts, no seller performance analytics, and no dedicated analytics page
for sellers.

**Completion requirements are defined in Part 2, Requirement 2.**

### Audit Finding 6: Real-Time Notifications

**Status: FULLY IMPLEMENTED ✅**

The Notification_Service creates and delivers notifications via both database persistence and Socket.io
WebSocket events. The frontend `notifications/page.tsx` supports read/unread state, mark-all-read,
delete, and filter. The `NotificationBell` component is integrated into the dashboard.

### Audit Finding 7: Virtual Assistant Auctioneer

**Status: FULLY IMPLEMENTED ✅**

The Assistant_Service handles 12 knowledge categories (bidding, wallet, escrow, winning, seller,
disputes, account, notifications, shipping, fees, security, general) via keyword matching. Conversations
are logged to the database. The service exposes conversation history, popular questions, and suggested
questions via dedicated routes.

### Audit Finding 8: Seller and Buyer Verification

**Status: FULLY IMPLEMENTED ✅ (Fayda in mock mode)**

Email OTP verification is enforced on registration. The Fayda_Service implements the full Ethiopian
National ID eSignet OIDC flow with a mock mode for development and a real mode ready for production
credentials from id.gov.et. The `is_verified` and `fayda_verified` fields gate bid placement. Admins
can verify or unverify users via the admin dashboard.

### Audit Finding 9: Blacklisting of Fraudulent Users

**Status: FULLY IMPLEMENTED ✅**

The `is_blacklisted` field on users is set by admin block/unblock actions, report review warn/ban
actions, and automatically by the ML_Fraud_Service when fraud score ≥ 0.80. Admin dashboard provides
per-user block/unblock controls.

### Audit Finding 10: Payment Integration

**Status: FULLY IMPLEMENTED ✅ (production credentials required)**

The Payment_Service integrates Chapa, Telebirr, and CBE Birr with initialize and verify methods,
proper HMAC/SHA-256 signature generation, and a unified `initializePayment` / `verifyPayment`
interface. A wallet system with add-funds and transaction history is implemented.

### Audit Finding 11: Bidder Information Encryption

**Status: NOT IMPLEMENTED ❌**

Bid amounts are stored in plaintext in the `bids` table. Bid history is publicly visible on auction
pages, showing bidder names and amounts in real time. No AES/RSA encryption of bid data exists
anywhere in the codebase. No sealed-bid or blind-bid mechanism is present.

**Completion requirements are defined in Part 2, Requirement 3.**

---

## Part 2: Completion Requirements

The following requirements define what must be built to bring the three incomplete features to full
implementation.

---

### Requirement 1: Local Language Support — Full UI Coverage

**User Story:** As an Ethiopian user who prefers Amharic or Afan Oromo, I want every piece of text
on the platform to appear in my chosen language, so that I can use the platform without needing to
read English.

#### Acceptance Criteria

1. THE I18n_System SHALL provide Translation_Maps for English, Amharic, and Afan Oromo that contain
   identical sets of keys, such that no key present in the English map is absent from the Amharic
   or Afan Oromo maps.

2. WHEN a user selects Amharic or Afan Oromo from the language switcher, THE Platform SHALL render
   all visible UI text — including navigation labels, page headings, form labels, button text, table
   headers, and status messages — using the selected language's Translation_Map.

3. WHEN a user selects Amharic or Afan Oromo, THE Platform SHALL render all visible UI text on the
   admin dashboard, create-auction page, seller dashboard, disputes page, checkout page, settings
   page, and become-seller page using the selected language's Translation_Map.

4. WHEN the backend returns an error response, THE Platform SHALL display the error message in the
   user's currently selected language by mapping backend error codes to localized strings in the
   I18n_System.

5. WHEN a notification is created for a user whose preferred language is Amharic or Afan Oromo,
   THE Notification_Service SHALL store the notification title and message in the user's preferred
   language.

6. IF a translation key is requested that does not exist in the selected language's Translation_Map,
   THEN THE I18n_System SHALL return the English fallback string for that key rather than the raw
   key identifier.

7. THE I18n_System SHALL expose a type-safe TypeScript interface such that adding a new UI string
   requires the developer to provide translations for all three languages before the code compiles.

#### Correctness Properties

- **Property 1.A — Key Set Symmetry (Invariant):**
  For all language codes `L` in `{am, or}`, the set of keys in `Translation_Map[L]` must equal
  the set of keys in `Translation_Map[en]`. No key may be present in English but absent in another
  language.
  `keys(Translation_Map['am']) === keys(Translation_Map['en'])` and
  `keys(Translation_Map['or']) === keys(Translation_Map['en'])`

- **Property 1.B — No Raw-Key Leakage (Invariant):**
  For any key `k` and any language `L`, `t(L, k)` must never return a camelCase string that matches
  the pattern `/^[a-z][a-zA-Z]+$/` when `L` is `am` or `or`, because that would indicate a missing
  translation falling back to the key name rather than the English string.

- **Property 1.C — Fallback Round-Trip (Round-Trip):**
  For any key `k` that exists in the English Translation_Map, `t('en', k)` must equal the English
  string, and `t('am', k)` must not equal `t('en', k)` (i.e., the Amharic translation is distinct
  from English), confirming actual translation rather than passthrough.

---

### Requirement 2: Data Analytics Dashboards

**User Story:** As an admin, I want to see visual charts of bidding trends, user behavior, and
platform performance over time, so that I can make informed decisions about platform management.
As a seller, I want to see analytics about my own auctions, so that I can optimize my listings.

#### Acceptance Criteria

1. THE Analytics_Dashboard SHALL display a line chart showing the total number of bids placed per
   day for a user-selectable time range of 7 days, 30 days, or 90 days.

2. THE Analytics_Dashboard SHALL display a bar chart showing total revenue (sum of winning bid
   amounts) per day for the same user-selectable time range.

3. THE Analytics_Dashboard SHALL display a pie or donut chart showing the distribution of active
   auctions across all item categories.

4. THE Analytics_Dashboard SHALL display a line chart showing the count of new user registrations
   per day for the selected time range.

5. WHEN the admin selects a time range, THE Analytics_Dashboard SHALL re-fetch and re-render all
   charts to reflect data within that range within 2 seconds.

6. WHEN no bid, revenue, or registration data exists for a selected time range, THE Analytics_Dashboard
   SHALL render an empty-state message ("No data available for this period") instead of a blank or
   broken chart.

7. THE Platform SHALL provide a seller-facing analytics page at `/seller/analytics` that displays:
   a bar chart of bids received per auction, a line chart of the seller's auction revenue over time,
   and a summary card showing total auctions created, total revenue earned, and average bids per auction.

8. WHEN a Chart_Component receives an empty data array, THE Chart_Component SHALL render an
   accessible empty-state element with the text "No data available" rather than throwing a runtime error.

9. THE Analytics_Dashboard SHALL expose a backend API endpoint `GET /api/admin/analytics` that
   returns pre-aggregated time-series data for bids, revenue, registrations, and category distribution,
   so that the frontend does not perform aggregation logic.

10. WHERE the platform is accessed by an Admin, THE Analytics_Dashboard SHALL be accessible from
    the existing admin panel as a dedicated "Analytics" tab without requiring a separate login.

#### Correctness Properties

- **Property 2.A — Aggregation Invariant (Invariant):**
  The sum of all daily bid counts returned by `GET /api/admin/analytics?range=30` must equal the
  total number of bids in the `bids` table created within the last 30 days.
  `SUM(daily_counts[i] for i in range) === COUNT(*) FROM bids WHERE bid_time >= NOW() - 30 days`

- **Property 2.B — Empty State Safety (Edge Case):**
  When the analytics API is called for a date range that contains zero records, the response must
  return an array of zero-value data points (one per day in the range) rather than an empty array
  or an error, so that Chart_Components always receive a well-formed dataset.

- **Property 2.C — Time Range Monotonicity (Invariant):**
  For any two time ranges where range A is a subset of range B, the total bid count for range A
  must be less than or equal to the total bid count for range B.
  `analytics(7 days).total_bids <= analytics(30 days).total_bids`

---

### Requirement 3: Bidder Information Encryption

**User Story:** As a bidder, I want my bid amount and identity to be kept confidential from other
participants during an active auction, so that I cannot be strategically outbid based on knowledge
of my exact offer. As a seller, I want bid amounts revealed only after the auction ends, so that
the auction process is fair and tamper-resistant.

#### Acceptance Criteria

1. WHEN a Bidder places a bid, THE Encryption_Service SHALL encrypt the bid amount using AES-256-GCM
   before the bid record is written to the `bids` table, storing the ciphertext in place of the
   plaintext amount.

2. WHEN a Bidder places a bid, THE Encryption_Service SHALL encrypt the bidder's user ID using
   AES-256-GCM before the bid record is written to the `bids` table, storing the ciphertext in
   place of the plaintext user ID.

3. WHILE an auction status is `active`, THE Platform SHALL return masked bid data from the bid
   history endpoint (`GET /api/auctions/:id/bids`), replacing the exact bid amount with a display
   string of "***" and the bidder name with "Anonymous Bidder".

4. WHEN an auction transitions to status `ended`, THE Encryption_Service SHALL decrypt all bid
   records for that auction and store the plaintext amounts and bidder IDs in a separate
   `revealed_bids` table, preserving the encrypted originals in the `bids` table for audit purposes.

5. AFTER an auction has ended, THE Platform SHALL return the full decrypted bid history — including
   exact amounts and bidder names — from the bid history endpoint (`GET /api/auctions/:id/bids`).

6. THE Encryption_Service SHALL use a per-auction encryption key derived from a master key stored
   in an environment variable (`BID_ENCRYPTION_MASTER_KEY`), such that the compromise of one
   auction's key does not expose bids from other auctions.

7. IF the `BID_ENCRYPTION_MASTER_KEY` environment variable is absent or empty at server startup,
   THEN THE Platform SHALL refuse to start and SHALL log the error
   "FATAL: BID_ENCRYPTION_MASTER_KEY is not set. Server cannot start."

8. THE Encryption_Service SHALL expose a `revealBids(auctionId)` function that is idempotent:
   calling it multiple times on the same ended auction SHALL produce the same decrypted result
   each time without creating duplicate records in `revealed_bids`.

9. WHERE the admin dashboard displays bid details for an ended auction, THE Platform SHALL show
   the decrypted bid amounts and bidder names retrieved from the `revealed_bids` table.

10. THE Platform SHALL maintain a current-bid tracker that stores only the encrypted highest bid
    amount, so that the auction detail page can display "Current Bid: ETB X,XXX" using the
    decrypted value of the leading bid only, without exposing all bids.

#### Correctness Properties

- **Property 3.A — Encrypt/Decrypt Round-Trip (Round-Trip):**
  For any bid amount `a` (a positive integer in ETB), encrypting then decrypting must recover the
  original value exactly.
  `decrypt(encrypt(a, key), key) === a` for all valid `a` and `key`.

- **Property 3.B — Ciphertext Differs from Plaintext (Invariant):**
  For any bid amount `a`, the encrypted ciphertext stored in the database must not equal the
  string representation of `a`. This verifies that encryption is actually applied.
  `stored_value !== String(a)` for all bids in the `bids` table while auction is active.

- **Property 3.C — Reveal Idempotence (Idempotence):**
  Calling `revealBids(auctionId)` once and calling it twice must produce identical rows in
  `revealed_bids`. The second call must not insert duplicate records or alter existing ones.
  `revealBids(id); count1 = COUNT(*) FROM revealed_bids WHERE auction_id = id;`
  `revealBids(id); count2 = COUNT(*) FROM revealed_bids WHERE auction_id = id;`
  `count1 === count2`

- **Property 3.D — Masking During Active Auction (Example):**
  Given an active auction with at least one bid, a GET request to `/api/auctions/:id/bids` by any
  user other than the Admin must return bid records where `amount === "***"` and
  `bidder_name === "Anonymous Bidder"`.

- **Property 3.E — Full Reveal After Auction End (Round-Trip):**
  Given a bid with original amount `a` placed before auction end, after the auction transitions to
  `ended` and `revealBids()` is called, a GET request to `/api/auctions/:id/bids` must return a
  record where the numeric amount equals `a`.
  `original_amount === revealed_amount` for all bids in an ended auction.

---

## Part 3: Parser and Serializer Requirements

### Requirement 4: Translation Map Serialization

**User Story:** As a developer, I want to export and import translation maps as JSON files, so that
translators can work on them offline and the results can be loaded back into the platform without
data loss.

#### Acceptance Criteria

1. THE I18n_System SHALL serialize any Translation_Map to a valid JSON string via a `serializeMap()`
   function.

2. THE I18n_System SHALL deserialize a JSON string back into a Translation_Map via a
   `deserializeMap()` function, validating that all required keys are present.

3. IF a JSON string passed to `deserializeMap()` is malformed or missing required keys, THEN THE
   I18n_System SHALL return a descriptive error identifying the first missing key.

4. FOR ALL valid Translation_Map objects `M`, parsing the serialized form then re-serializing SHALL
   produce an equivalent object (round-trip property):
   `deserializeMap(serializeMap(M))` must deeply equal `M`.
