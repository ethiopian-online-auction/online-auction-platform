import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl w-full text-center">
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-blue-600 mb-4">404</h1>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Page Not Found</h2>
            <p className="text-gray-600 text-lg">
              Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
            </p>
          </div>

          <div className="mb-8">
            <svg className="w-64 h-64 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <div className="space-y-4">
            <Link
              href="/"
              className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              🏠 Go to Homepage
            </Link>
            <div className="flex justify-center gap-4 flex-wrap">
              <Link href="/auctions" className="text-blue-600 hover:text-blue-700 font-medium">
                Browse Auctions
              </Link>
              <span className="text-gray-400">•</span>
              <Link href="/about" className="text-blue-600 hover:text-blue-700 font-medium">
                About Us
              </Link>
              <span className="text-gray-400">•</span>
              <Link href="/faq" className="text-blue-600 hover:text-blue-700 font-medium">
                Help Center
              </Link>
            </div>
          </div>

          <div className="mt-12 p-6 bg-white rounded-xl shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Popular Searches</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {['Electronics', 'Vehicles', 'Real Estate', 'Jewelry', 'Furniture'].map((category) => (
                <Link
                  key={category}
                  href={`/auctions?category=${category.toLowerCase()}`}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 text-sm transition"
                >
                  {category}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
