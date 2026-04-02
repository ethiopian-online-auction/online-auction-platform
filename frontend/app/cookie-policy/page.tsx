'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
          <p className="text-gray-600 mb-8">Last Updated: March 5, 2026</p>

          <div className="space-y-8 text-gray-700">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. What Are Cookies?</h2>
              <p className="leading-relaxed">
                Cookies are small text files that are placed on your device (computer, smartphone, or tablet) when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners. Cookies help us remember your preferences, understand how you use our platform, and improve your overall experience.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Cookies</h2>
              <p className="mb-3">Ethiopian Auction Platform uses cookies for the following purposes:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Authentication:</strong> Keep you logged in to your account</li>
                <li><strong>Security:</strong> Protect your account from unauthorized access</li>
                <li><strong>Preferences:</strong> Remember your language and display settings</li>
                <li><strong>Analytics:</strong> Understand how visitors use our platform</li>
                <li><strong>Performance:</strong> Improve platform speed and functionality</li>
                <li><strong>Advertising:</strong> Show relevant ads and measure their effectiveness</li>
                <li><strong>Session Management:</strong> Maintain your browsing session</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Types of Cookies We Use</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.1 Essential Cookies (Strictly Necessary)</h3>
              <p className="mb-3">These cookies are required for the platform to function properly. They cannot be disabled.</p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <ul className="space-y-2">
                  <li><strong>Session Cookies:</strong> Maintain your login session</li>
                  <li><strong>Security Cookies:</strong> Detect and prevent fraud</li>
                  <li><strong>Load Balancing:</strong> Distribute traffic across servers</li>
                  <li><strong>CSRF Protection:</strong> Prevent cross-site request forgery attacks</li>
                </ul>
                <p className="text-sm text-gray-600 mt-3">Duration: Session (deleted when you close your browser)</p>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.2 Functional Cookies</h3>
              <p className="mb-3">These cookies enable enhanced functionality and personalization.</p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <ul className="space-y-2">
                  <li><strong>Language Preference:</strong> Remember your selected language (English, Amharic, Oromo)</li>
                  <li><strong>Currency Display:</strong> Remember your preferred currency format</li>
                  <li><strong>Theme Settings:</strong> Remember your display preferences</li>
                  <li><strong>Watchlist:</strong> Save items you're watching</li>
                  <li><strong>Search History:</strong> Remember your recent searches</li>
                </ul>
                <p className="text-sm text-gray-600 mt-3">Duration: Up to 1 year</p>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.3 Analytics Cookies</h3>
              <p className="mb-3">These cookies help us understand how visitors interact with our platform.</p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <ul className="space-y-2">
                  <li><strong>Google Analytics:</strong> Track page views, user behavior, and traffic sources</li>
                  <li><strong>Performance Monitoring:</strong> Measure page load times and errors</li>
                  <li><strong>User Journey:</strong> Understand how users navigate the platform</li>
                  <li><strong>Conversion Tracking:</strong> Measure auction completions and registrations</li>
                </ul>
                <p className="text-sm text-gray-600 mt-3">Duration: Up to 2 years</p>
                <p className="text-sm text-gray-600 mt-2">
                  Third-party: Google Analytics (
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </a>
                  )
                </p>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.4 Advertising Cookies</h3>
              <p className="mb-3">These cookies are used to show relevant advertisements and measure campaign effectiveness.</p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <ul className="space-y-2">
                  <li><strong>Targeted Ads:</strong> Show ads based on your interests</li>
                  <li><strong>Retargeting:</strong> Show ads for items you viewed</li>
                  <li><strong>Ad Performance:</strong> Measure ad clicks and conversions</li>
                  <li><strong>Social Media:</strong> Enable sharing and social features</li>
                </ul>
                <p className="text-sm text-gray-600 mt-3">Duration: Up to 1 year</p>
                <p className="text-sm text-gray-600 mt-2">
                  Third-party: Google Ads, Facebook Pixel, Twitter Ads
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Third-Party Cookies</h2>
              <p className="mb-3">We use services from third-party companies that may set their own cookies:</p>
              
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-bold text-gray-900">Google Analytics</h4>
                  <p className="text-sm text-gray-600">Tracks website usage and performance</p>
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                    Privacy Policy →
                  </a>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-bold text-gray-900">Payment Processors</h4>
                  <p className="text-sm text-gray-600">Telebirr, Chapa, CBE Birr for secure payments</p>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-bold text-gray-900">Social Media Platforms</h4>
                  <p className="text-sm text-gray-600">Facebook, Twitter, Instagram for sharing features</p>
                </div>

                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-bold text-gray-900">Advertising Networks</h4>
                  <p className="text-sm text-gray-600">Google Ads, Facebook Ads for targeted advertising</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. How to Control Cookies</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">5.1 Browser Settings</h3>
              <p className="mb-3">You can control and delete cookies through your browser settings:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Google Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
                <li><strong>Mozilla Firefox:</strong> Options → Privacy & Security → Cookies and Site Data</li>
                <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
                <li><strong>Microsoft Edge:</strong> Settings → Privacy, search, and services → Cookies</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">5.2 Cookie Preferences</h3>
              <p className="mb-3">You can manage your cookie preferences on our platform:</p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition">
                  Manage Cookie Preferences
                </button>
                <p className="text-sm text-gray-600 mt-3">
                  Note: Disabling essential cookies may affect platform functionality
                </p>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">5.3 Opt-Out Links</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Google Analytics:</strong>{' '}
                  <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Opt-out browser add-on
                  </a>
                </li>
                <li>
                  <strong>Google Ads:</strong>{' '}
                  <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Ad Settings
                  </a>
                </li>
                <li>
                  <strong>Facebook Ads:</strong>{' '}
                  <a href="https://www.facebook.com/ads/preferences" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Ad Preferences
                  </a>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Do Not Track (DNT)</h2>
              <p className="leading-relaxed">
                Some browsers have a "Do Not Track" (DNT) feature that signals to websites that you do not want to be tracked. Currently, there is no industry standard for how to respond to DNT signals. We do not currently respond to DNT signals, but we respect your privacy choices and provide cookie management options.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Mobile Devices</h2>
              <p className="mb-3">Mobile devices may use different technologies for tracking:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Device IDs:</strong> Unique identifiers for your mobile device</li>
                <li><strong>App Permissions:</strong> Location, camera, storage access</li>
                <li><strong>Push Notifications:</strong> Alerts for auction updates</li>
              </ul>
              <p className="mt-3 text-sm text-gray-600">
                You can manage these settings in your device's privacy settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Cookie Consent</h2>
              <p className="leading-relaxed mb-3">
                By using our platform, you consent to the use of cookies as described in this policy. When you first visit our platform, you will see a cookie banner asking for your consent. You can:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Accept all cookies</li>
                <li>Reject non-essential cookies</li>
                <li>Customize your cookie preferences</li>
              </ul>
              <p className="mt-3 text-sm text-gray-600">
                You can change your preferences at any time through the cookie settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Impact of Disabling Cookies</h2>
              <p className="mb-3">If you disable cookies, some features may not work properly:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You may need to log in every time you visit</li>
                <li>Your language preference may not be saved</li>
                <li>Your watchlist may not persist</li>
                <li>Some pages may load slower</li>
                <li>Personalized recommendations may not work</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Updates to This Policy</h2>
              <p className="leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our practices. We will notify you of significant changes by posting a notice on our platform or sending you an email.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Us</h2>
              <p className="mb-3">If you have questions about our use of cookies, please contact us:</p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>Ethiopian Auction Platform</strong></p>
                <p>Email: <a href="mailto:privacy@auctionet.com" className="text-blue-600 hover:underline">privacy@auctionet.com</a></p>
                <p>Phone: +251 911 234 567</p>
                <p>Address: Bole Road, Addis Ababa, Ethiopia</p>
              </div>
            </section>

            <section className="bg-green-50 p-6 rounded-lg mt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Quick Summary</h2>
              <ul className="space-y-2">
                <li>✅ We use cookies to improve your experience</li>
                <li>✅ Essential cookies are required for the platform to work</li>
                <li>✅ You can control non-essential cookies in your browser</li>
                <li>✅ Third-party services may set their own cookies</li>
                <li>✅ Disabling cookies may affect functionality</li>
              </ul>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
