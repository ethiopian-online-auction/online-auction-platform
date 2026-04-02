'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: 'How do I place a bid?',
      answer: 'To place a bid, first create an account and log in. Browse the auctions and click on an item you are interested in. Enter your bid amount (must be higher than the current bid) and click Place Bid. You will receive a confirmation and notifications if you are outbid.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept various payment methods including bank transfers, mobile money (M-Pesa, Telebirr), credit/debit cards, and cash on delivery for certain items. Payment details will be provided after you win an auction.'
    },
    {
      question: 'How does shipping work?',
      answer: 'Shipping options vary by seller and item. Some sellers offer free shipping, while others charge based on location and item size. Delivery times typically range from 2-7 business days within Ethiopia. You can track your shipment through your dashboard.'
    },
    {
      question: 'What if I win an auction?',
      answer: 'Congratulations! You will receive an email and notification confirming your win. You will have 48 hours to complete payment. Once payment is confirmed, the seller will ship the item to your provided address. You can track everything through your dashboard.'
    },
    {
      question: 'Can I cancel a bid?',
      answer: 'Bids are binding commitments. However, you can contact our support team within 1 hour of placing a bid if there was a genuine error. After this period, bids cannot be cancelled. Please bid responsibly.'
    },
    {
      question: 'How do I become a seller?',
      answer: 'To become a seller, go to your dashboard and click Create Auction. You will need to verify your identity by providing a valid ID and phone number. Once verified, you can list items, set starting prices, and manage your auctions.'
    },
    {
      question: 'Are there any fees?',
      answer: 'For buyers, there are no fees to bid or purchase items. Sellers pay a small commission (5-10%) only when an item sells successfully. Listing items is free, and there are no upfront costs.'
    },
    {
      question: 'How do I know if a seller is trustworthy?',
      answer: 'All sellers are verified with ID and phone number. Check the seller rating, reviews from previous buyers, and verification badge. We also offer buyer protection - if an item does not match the description, you can request a refund.'
    },
    {
      question: 'What happens if an item is not as described?',
      answer: 'We have a buyer protection policy. If the item you receive does not match the description, contact us within 48 hours of delivery with photos. We will investigate and facilitate a return or refund if the claim is valid.'
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-600">
            Find answers to common questions about using Ethiopian Auction
          </p>
        </div>

        <div className="space-y-4 mb-16">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 flex justify-between items-center text-left focus:outline-none"
              >
                <span className="text-lg font-semibold text-gray-900">
                  {faq.question}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${
                    openIndex === index ? 'transform rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              
              {openIndex === index && (
                <div className="px-6 pb-5">
                  <p className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Still have questions?
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            Our support team is here to help you with any questions or concerns
          </p>
          <button className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition">
            Contact Support
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
