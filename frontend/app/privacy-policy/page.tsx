'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Last Updated: March 5, 2026</p>

          <div className="space-y-8 text-gray-700">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="leading-relaxed">
                Welcome to Ethiopian Auction Platform ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our online auction platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">2.1 Personal Information</h3>
              <p className="mb-3">We collect the following personal information when you register or use our services:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Information:</strong> Name, email address, phone number, password</li>
                <li><strong>Profile Information:</strong> Profile picture, bio, location (city/region)</li>
                <li><strong>Payment Information:</strong> Payment method details (Telebirr, Chapa, CBE Birr account information)</li>
                <li><strong>Identity Verification:</strong> Government-issued ID for seller verification</li>
                <li><strong>Transaction Data:</strong> Bid history, purchase history, auction listings</li>
                <li><strong>Communication Data:</strong> Messages between buyers and sellers, support tickets</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">2.2 Automatically Collected Information</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
                <li><strong>Usage Data:</strong> Pages visited, time spent, clicks, search queries</li>
                <li><strong>Location Data:</strong> Approximate location based on IP address</li>
                <li><strong>Cookies and Tracking:</strong> Session cookies, preference cookies, analytics cookies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Collect Information</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Registration Forms:</strong> When you create an account</li>
                <li><strong>Auction Activities:</strong> When you place bids, create listings, or make purchases</li>
                <li><strong>Payment Processing:</strong> When you complete transactions</li>
                <li><strong>Cookies and Analytics:</strong> Through automated tracking technologies</li>
                <li><strong>Communications:</strong> When you contact customer support or communicate with other users</li>
                <li><strong>Third-Party Sources:</strong> Payment gateway providers, fraud detection services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. How We Use Your Information</h2>
              <p className="mb-3">We use your personal information for the following purposes:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Management:</strong> Create and manage your account, verify your identity</li>
                <li><strong>Auction Services:</strong> Process bids, manage auctions, facilitate transactions</li>
                <li><strong>Payment Processing:</strong> Process payments, issue refunds, calculate commissions</li>
                <li><strong>Communication:</strong> Send notifications, updates, promotional offers, support responses</li>
                <li><strong>Security:</strong> Detect and prevent fraud, abuse, and illegal activities</li>
                <li><strong>Analytics:</strong> Improve our services, understand user behavior, optimize platform performance</li>
                <li><strong>Legal Compliance:</strong> Comply with Ethiopian laws and regulations</li>
                <li><strong>Customer Support:</strong> Respond to inquiries and resolve disputes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Information Sharing and Disclosure</h2>
              <p className="mb-3">We may share your information with:</p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">5.1 Service Providers</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Payment Processors:</strong> Telebirr, Chapa, CBE Birr for payment processing</li>
                <li><strong>Cloud Hosting:</strong> Secure servers for data storage</li>
                <li><strong>Analytics Services:</strong> Google Analytics for usage statistics</li>
                <li><strong>Email Services:</strong> For sending notifications and communications</li>
                <li><strong>SMS Services:</strong> For OTP verification and alerts</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">5.2 Other Users</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your public profile information (name, rating, verification status)</li>
                <li>Your auction listings and bid history (anonymized for privacy)</li>
                <li>Communication between buyers and sellers</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">5.3 Legal Authorities</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>When required by Ethiopian law or legal process</li>
                <li>To protect our rights, property, or safety</li>
                <li>To investigate fraud or security issues</li>
                <li>In response to court orders or government requests</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">5.4 Business Transfers</h3>
              <p>In the event of a merger, acquisition, or sale of assets, your information may be transferred to the new entity.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Security</h2>
              <p className="mb-3">We implement industry-standard security measures to protect your information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Encryption:</strong> SSL/TLS encryption for data transmission</li>
                <li><strong>Secure Storage:</strong> Encrypted databases and secure servers</li>
                <li><strong>Access Controls:</strong> Limited access to personal data by authorized personnel only</li>
                <li><strong>Password Protection:</strong> Hashed and salted password storage</li>
                <li><strong>Regular Audits:</strong> Security assessments and vulnerability testing</li>
                <li><strong>Fraud Detection:</strong> Automated systems to detect suspicious activities</li>
              </ul>
              <p className="mt-3 text-sm text-gray-600">
                Note: While we strive to protect your information, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Privacy Rights</h2>
              <p className="mb-3">You have the following rights regarding your personal information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data (subject to legal requirements)</li>
                <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Data Portability:</strong> Request your data in a portable format</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing (where applicable)</li>
                <li><strong>Object:</strong> Object to certain types of data processing</li>
              </ul>
              <p className="mt-3">
                To exercise these rights, please contact us at <a href="mailto:privacy@auctionet.com" className="text-blue-600 hover:underline">privacy@auctionet.com</a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Data Retention</h2>
              <p className="leading-relaxed">
                We retain your personal information for as long as necessary to provide our services and comply with legal obligations. Specifically:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li><strong>Account Data:</strong> Retained while your account is active</li>
                <li><strong>Transaction Records:</strong> Retained for 7 years for tax and legal compliance</li>
                <li><strong>Communication Logs:</strong> Retained for 2 years for dispute resolution</li>
                <li><strong>Analytics Data:</strong> Anonymized and retained indefinitely</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Children's Privacy</h2>
              <p className="leading-relaxed">
                Our platform is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. International Data Transfers</h2>
              <p className="leading-relaxed">
                Your information may be transferred to and processed in countries outside Ethiopia. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to This Privacy Policy</h2>
              <p className="leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of significant changes by email or through a prominent notice on our platform. Your continued use of our services after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
              <p className="mb-3">If you have questions or concerns about this Privacy Policy, please contact us:</p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>Ethiopian Auction Platform</strong></p>
                <p>Email: <a href="mailto:privacy@auctionet.com" className="text-blue-600 hover:underline">privacy@auctionet.com</a></p>
                <p>Phone: +251 911 234 567</p>
                <p>Address: Bole Road, Addis Ababa, Ethiopia</p>
              </div>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
