'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';
import FaydaVerify from '@/components/FaydaVerify';

export default function BecomeSellerPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [kycVerified, setKycVerified] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'individual',
    businessRegistrationNumber: '',
    taxId: '',
    phone: '',
    email: user?.email || '',
    address: '',
  });
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // Check if user already has an application
    fetchExistingApplication();
  }, [isAuthenticated, router]);

  const fetchExistingApplication = async () => {
    try {
      const api = (await import('@/lib/api')).default;
      const response = await api.get('/seller/my-application');

      if (response.success) {
        setExistingApplication(response.data);
        // Populate form with existing data
        setFormData({
          businessName: response.data.business_name || '',
          businessType: response.data.business_type || 'individual',
          businessRegistrationNumber: response.data.business_registration_number || '',
          taxId: response.data.tax_id || '',
          phone: response.data.phone || '',
          email: response.data.email || user?.email || '',
          address: response.data.address || '',
        });
        if (response.data.documents) {
          setDocuments(JSON.parse(response.data.documents));
        }
      }
    } catch (error) {
      // No existing application, that's fine
      console.log('No existing application');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newDoc = {
          type: e.target.name,
          name: file.name,
          url: reader.result as string,
          uploadedAt: new Date().toISOString()
        };
        setDocuments(prev => [...prev, newDoc]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const api = (await import('@/lib/api')).default;

      // Submit application
      const response = await api.post('/seller/apply', {
        ...formData,
        documents: documents
      });

      if (response.success) {
        alert('✅ Application submitted successfully!\n\nYour application is now under review. You will be notified once an admin reviews your application.');
        router.push('/dashboard');
      } else {
        alert(`❌ Error: ${response.message}`);
      }
    } catch (error: any) {
      console.error('Submit application error:', error);
      alert(`❌ Failed to submit application: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResubmit = async () => {
    if (!existingApplication) return;

    setLoading(true);
    try {
      const api = (await import('@/lib/api')).default;

      const response = await api.put(`/seller/application/${existingApplication.id}`, {
        ...formData,
        documents: documents
      });

      if (response.success) {
        alert('✅ Application resubmitted successfully!\n\nYour updated application is now under review.');
        fetchExistingApplication();
      } else {
        alert(`❌ Error: ${response.message}`);
      }
    } catch (error: any) {
      console.error('Resubmit application error:', error);
      alert(`❌ Failed to resubmit application: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  // Show status if application exists and is not rejected
  if (existingApplication && existingApplication.status !== 'rejected') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">
              {existingApplication.status === 'approved' ? '✅' :
                existingApplication.status === 'under_review' ? '🔍' : '⏳'}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {existingApplication.status === 'approved' ? 'Application Approved!' :
                existingApplication.status === 'under_review' ? 'Application Under Review' :
                  'Application Pending'}
            </h1>
            <p className="text-gray-600 mb-6">
              {existingApplication.status === 'approved'
                ? 'Congratulations! Your seller application has been approved. You can now create auctions.'
                : 'Your seller application is currently being reviewed by our admin team. You will be notified once a decision is made.'}
            </p>

            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
              <h3 className="font-bold text-gray-900 mb-4">Application Details</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Business Name:</span> {existingApplication.business_name}</p>
                <p><span className="font-medium">Business Type:</span> {existingApplication.business_type}</p>
                <p><span className="font-medium">Email:</span> {existingApplication.email}</p>
                <p><span className="font-medium">Phone:</span> {existingApplication.phone}</p>
                <p><span className="font-medium">Status:</span>
                  <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${existingApplication.status === 'approved' ? 'bg-green-100 text-green-700' :
                    existingApplication.status === 'under_review' ? 'bg-blue-100 text-blue-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                    {existingApplication.status}
                  </span>
                </p>
                <p><span className="font-medium">Submitted:</span> {new Date(existingApplication.submitted_at).toLocaleDateString()}</p>
              </div>
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-blue-600 transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {existingApplication?.status === 'rejected' ? t('becomeSeller') : t('becomeSeller')}
            </h1>
            <p className="text-gray-600">
              {existingApplication?.status === 'rejected'
                ? 'Your previous application was rejected. Please update your information and resubmit.'
                : 'Fill out the form below to apply to become a seller on our platform'}
            </p>

            {existingApplication?.status === 'rejected' && existingApplication.rejection_reason && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                <p className="text-sm font-medium text-red-900 mb-1">Rejection Reason:</p>
                <p className="text-sm text-red-700">{existingApplication.rejection_reason}</p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Information */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Business Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    placeholder="Your business name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                  >
                    <option value="individual">Individual</option>
                    <option value="sole_proprietorship">Sole Proprietorship</option>
                    <option value="partnership">Partnership</option>
                    <option value="corporation">Corporation</option>
                    <option value="llc">LLC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Registration Number
                  </label>
                  <input
                    type="text"
                    name="businessRegistrationNumber"
                    value={formData.businessRegistrationNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax ID / TIN
                  </label>
                  <input
                    type="text"
                    name="taxId"
                    value={formData.taxId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    placeholder="+251 XXX XXX XXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    placeholder="business@example.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    placeholder="Full business address"
                  />
                </div>
              </div>
            </div>

            {/* Document Upload */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{t('uploadImages')}</h2>
              <p className="text-sm text-gray-600 mb-4">
                Upload relevant business documents to speed up the approval process
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business License
                  </label>
                  <input
                    type="file"
                    name="business_license"
                    onChange={handleFileUpload}
                    accept="image/*,.pdf"
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Certificate
                  </label>
                  <input
                    type="file"
                    name="tax_certificate"
                    onChange={handleFileUpload}
                    accept="image/*,.pdf"
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID Card
                  </label>
                  <input
                    type="file"
                    name="id_card"
                    onChange={handleFileUpload}
                    accept="image/*,.pdf"
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
                  />
                </div>
              </div>

              {documents.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Uploaded Documents:</p>
                  <div className="space-y-2">
                    {documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📄</span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                            <p className="text-xs text-gray-500">{doc.type}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDocuments(documents.filter((_, i) => i !== index))}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Fayda Identity Verification */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Identity Verification</h2>
              <p className="text-sm text-gray-600 mb-4">
                Verify your identity using your Ethiopian National ID (Fayda) to speed up approval and build buyer trust.
              </p>
              <FaydaVerify onVerified={() => setKycVerified(true)} />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                {t('cancel')}
              </button>

              {existingApplication?.status === 'rejected' ? (
                <button
                  type="button"
                  onClick={handleResubmit}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Resubmitting...' : 'Resubmit Application'}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
