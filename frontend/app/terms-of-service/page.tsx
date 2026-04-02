'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-600 mb-8">Last Updated: March 5, 2026</p>

          <div className="space-y-8 text-gray-700">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="leading-relaxed">
                By accessing and using the Ethiopian Auction Platform ("Platform," "we," "our," or "us"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Platform. These Terms constitute a legally binding agreement between you and Ethiopian Auction Platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Eligibility</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must be at least 18 years old to use this Platform</li>
                <li>You must be a resident of Ethiopia or have a valid Ethiopian address</li>
                <li>You must provide accurate and complete registration information</li>
                <li>You must have the legal capacity to enter into binding contracts</li>
                <li>You must not be prohibited from using the Platform under Ethiopian law</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Account</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.1 Account Registration</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must create an account to use our auction services</li>
                <li>You are limited to one account per person</li>
                <li>You must provide accurate, current, and complete information</li>
                <li>You must verify your email address and phone number</li>
                <li>Sellers must complete additional verification for identity confirmation</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.2 Account Security</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>You are responsible for maintaining the confidentiality of your password</li>
                <li>You must not share your account credentials with others</li>
                <li>You must notify us immediately of any unauthorized access</li>
                <li>You are responsible for all activities under your account</li>
                <li>We reserve the right to suspend accounts showing suspicious activity</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.3 Account Termination</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>You may close your account at any time</li>
                <li>We may suspend or terminate your account for violations of these Terms</li>
                <li>We may terminate accounts that remain inactive for 12 months</li>
                <li>Upon termination, you remain liable for outstanding obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Subscription Plans and Payments</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.1 Subscription Tiers</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Free Plan:</strong> Basic buyer access with no monthly fee</li>
                <li><strong>Seller Plan:</strong> 5-10% commission on sold items only</li>
                <li><strong>Premium Plan:</strong> 999 ETB/month with reduced 3% commission</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.2 Payment Terms</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>All payments are processed in Ethiopian Birr (ETB)</li>
                <li>We accept Telebirr, Chapa, and CBE Birr payment methods</li>
                <li>Premium subscriptions are billed monthly in advance</li>
                <li>Seller commissions are deducted automatically from sale proceeds</li>
                <li>All fees are non-refundable unless otherwise stated</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.3 Refund Policy</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Premium subscription fees are non-refundable</li>
                <li>Seller commissions are non-refundable once a sale is completed</li>
                <li>Refunds for won auctions are subject to our dispute resolution process</li>
                <li>Payment processing fees are non-refundable</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Auction Rules</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">5.1 Creating Auctions (Sellers)</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Only Seller and Premium plan users can create auctions</li>
                <li>You must provide accurate item descriptions and images</li>
                <li>You must set a reasonable starting price and reserve price</li>
                <li>Auction duration can be 1-14 days</li>
                <li>You must honor all bids and complete sales to winning bidders</li>
                <li>You cannot bid on your own auctions</li>
                <li>You must ship items within 3 business days of payment</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">5.2 Placing Bids (Buyers)</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>All bids are binding and cannot be retracted except in exceptional circumstances</li>
                <li>You must have sufficient funds to complete the purchase</li>
                <li>Each bid must exceed the current highest bid by the minimum increment</li>
                <li>Auto-bid feature allows automatic bidding up to your maximum amount</li>
                <li>You cannot place bids on your own auctions</li>
                <li>Shill bidding (fake bids to inflate prices) is strictly prohibited</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">5.3 Bid Retraction</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Bids can only be retracted in the following cases:</li>
                <li className="ml-6">- You entered the wrong bid amount (must retract within 1 hour)</li>
                <li className="ml-6">- The item description changed significantly after your bid</li>
                <li className="ml-6">- You cannot contact the seller</li>
                <li>Frequent bid retractions may result in account suspension</li>
                <li>Contact support immediately if you need to retract a bid</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">5.4 Winning an Auction</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>The highest bidder when the auction ends is the winner</li>
                <li>Winners must complete payment within 48 hours</li>
                <li>Failure to pay may result in negative feedback and account suspension</li>
                <li>Winners will receive email and SMS notifications</li>
                <li>Shipping costs are the responsibility of the buyer unless stated otherwise</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">5.5 Reserve Price</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Sellers can set a reserve price (minimum acceptable price)</li>
                <li>If the reserve is not met, the seller is not obligated to sell</li>
                <li>Reserve prices are not visible to bidders</li>
                <li>Bidders will be notified if the reserve has been met</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Prohibited Activities</h2>
              <p className="mb-3">The following activities are strictly prohibited:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Fraud:</strong> Fake bids, shill bidding, bid manipulation, false listings</li>
                <li><strong>Illegal Items:</strong> Stolen goods, counterfeit items, prohibited substances, weapons</li>
                <li><strong>Harassment:</strong> Threatening, abusive, or discriminatory behavior</li>
                <li><strong>Multiple Accounts:</strong> Creating multiple accounts to circumvent rules</li>
                <li><strong>Price Manipulation:</strong> Artificially inflating or deflating prices</li>
                <li><strong>Non-Payment:</strong> Winning auctions without intent to pay</li>
                <li><strong>Non-Delivery:</strong> Accepting payment without delivering items</li>
                <li><strong>Spam:</strong> Unsolicited messages or advertisements</li>
                <li><strong>System Abuse:</strong> Hacking, scraping, or automated bidding bots</li>
                <li><strong>Misrepresentation:</strong> False descriptions, fake images, misleading information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Seller Fees and Commissions</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Seller Plan:</strong> 5-10% commission on final sale price</li>
                <li><strong>Premium Plan:</strong> 3% commission on final sale price</li>
                <li>Commissions are automatically deducted from sale proceeds</li>
                <li>No listing fees or upfront costs</li>
                <li>Commissions apply only to completed sales</li>
                <li>Shipping costs are not included in commission calculations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Dispute Resolution</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">8.1 Buyer-Seller Disputes</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Buyers and sellers should first attempt to resolve disputes directly</li>
                <li>If resolution fails, contact our support team within 7 days</li>
                <li>Provide evidence (photos, messages, tracking numbers)</li>
                <li>We will mediate and make a final decision within 14 days</li>
                <li>Our decision is final and binding</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">8.2 Refund Disputes</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Item not as described: Full refund if seller misrepresented the item</li>
                <li>Item not received: Full refund if item was not delivered</li>
                <li>Damaged items: Partial or full refund depending on damage</li>
                <li>Buyer's remorse: No refund (all sales are final)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Intellectual Property</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>All Platform content (logo, design, code) is owned by Ethiopian Auction Platform</li>
                <li>You retain ownership of content you upload (listings, images, descriptions)</li>
                <li>By uploading content, you grant us a license to display and promote it</li>
                <li>You must not infringe on others' intellectual property rights</li>
                <li>We will remove infringing content upon notification</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Limitation of Liability</h2>
              <p className="mb-3">To the maximum extent permitted by Ethiopian law:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>We are not responsible for losses resulting from platform use</li>
                <li>We do not guarantee the accuracy of user-generated content</li>
                <li>We are not liable for disputes between buyers and sellers</li>
                <li>We are not responsible for payment processing failures</li>
                <li>We are not liable for item quality, authenticity, or legality</li>
                <li>Our total liability is limited to the fees you paid in the last 12 months</li>
                <li>We are not liable for indirect, consequential, or punitive damages</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Indemnification</h2>
              <p className="leading-relaxed">
                You agree to indemnify and hold harmless Ethiopian Auction Platform, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Your violation of these Terms</li>
                <li>Your violation of any law or third-party rights</li>
                <li>Your use of the Platform</li>
                <li>Your auction listings or transactions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Termination Rights</h2>
              <p className="mb-3">We reserve the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Suspend or terminate accounts that violate these Terms</li>
                <li>Remove listings that violate our policies</li>
                <li>Cancel auctions in cases of fraud or abuse</li>
                <li>Ban users permanently for serious violations</li>
                <li>Refuse service to anyone at our discretion</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Governing Law</h2>
              <p className="leading-relaxed">
                These Terms are governed by the laws of the Federal Democratic Republic of Ethiopia. Any disputes arising from these Terms or your use of the Platform shall be resolved in the courts of Addis Ababa, Ethiopia.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Changes to Terms</h2>
              <p className="leading-relaxed">
                We may modify these Terms at any time. We will notify you of significant changes via email or platform notification. Your continued use of the Platform after changes constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Contact Information</h2>
              <p className="mb-3">For questions about these Terms, contact us:</p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>Ethiopian Auction Platform</strong></p>
                <p>Email: <a href="mailto:support@auctionet.com" className="text-blue-600 hover:underline">support@auctionet.com</a></p>
                <p>Phone: +251 911 234 567</p>
                <p>Address: Bole Road, Addis Ababa, Ethiopia</p>
              </div>
            </section>

            <section className="bg-blue-50 p-6 rounded-lg mt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Acknowledgment</h2>
              <p className="leading-relaxed">
                By using the Ethiopian Auction Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
