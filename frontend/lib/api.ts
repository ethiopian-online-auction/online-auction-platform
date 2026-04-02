// API Client for Backend Communication
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getAuthToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const url = `${this.baseURL}${endpoint}`;
      
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Request failed');
      }

      return data;
    } catch (error: any) {
      console.error('API Error:', error);
      
      // Provide more helpful error messages
      if (error.message === 'Failed to fetch') {
        throw new Error(
          'Cannot connect to backend server. Please ensure the backend is running on http://localhost:5000'
        );
      }
      
      throw error;
    }
  }

  // Auth endpoints
  async register(userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: string;
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: { email: string; password: string }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async verifyEmail(token: string) {
    return this.request(`/auth/verify-email/${token}`, {
      method: 'GET',
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // User endpoints
  async getProfile() {
    return this.request('/users/profile', {
      method: 'GET',
    });
  }

  async updateProfile(data: any) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Auction endpoints
  async getAuctions(params?: {
    status?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request(`/auctions${queryString}`, {
      method: 'GET',
    });
  }

  async getAuction(id: string) {
    return this.request(`/auctions/${id}`, {
      method: 'GET',
    });
  }

  async createAuction(auctionData: any) {
    return this.request('/auctions', {
      method: 'POST',
      body: JSON.stringify(auctionData),
    });
  }

  async updateAuction(id: string, auctionData: any) {
    return this.request(`/auctions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(auctionData),
    });
  }

  async deleteAuction(id: string) {
    return this.request(`/auctions/${id}`, {
      method: 'DELETE',
    });
  }

  // Bid endpoints
  async placeBid(auctionId: string, amount: number) {
    return this.request('/bids/place', {
      method: 'POST',
      body: JSON.stringify({ auctionId, amount }),
    });
  }

  async getAuctionBids(auctionId: string) {
    return this.request(`/bids/auction/${auctionId}`, {
      method: 'GET',
    });
  }

  async getUserBids() {
    return this.request('/bids/my-bids', {
      method: 'GET',
    });
  }

  // Generic GET method for custom endpoints
  async get(endpoint: string) {
    return this.request(endpoint, {
      method: 'GET',
    });
  }

  // Generic POST method
  async post(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Generic PUT method
  async put(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Generic DELETE method
  async delete(endpoint: string) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  // Admin endpoints
  async getAllUsers() {
    return this.request('/admin/users', {
      method: 'GET',
    });
  }

  async getAllAuctions() {
    return this.request('/admin/auctions', {
      method: 'GET',
    });
  }

  async updateUserRole(userId: string, role: string) {
    return this.request(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async deleteUser(userId: string) {
    return this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async getStatistics() {
    return this.request('/admin/statistics', {
      method: 'GET',
    });
  }

  // Notification endpoints
  async getNotifications() {
    return this.request('/notifications', {
      method: 'GET',
    });
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/read-all', {
      method: 'PUT',
    });
  }

  // Payment endpoints
  async initiatePayment(data: {
    provider: string;
    amount: number;
  }) {
    return this.request('/payments/initialize', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyPayment(paymentId: string) {
    return this.request(`/payments/verify/${paymentId}`, {
      method: 'GET',
    });
  }

  // Escrow endpoints
  async createEscrow(data: {
    auctionId: string;
    amount: number;
  }) {
    return this.request('/escrow/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async releaseEscrow(escrowId: string) {
    return this.request(`/escrow/${escrowId}/release`, {
      method: 'POST',
    });
  }

  async getEscrowStatus(escrowId: string) {
    return this.request(`/escrow/${escrowId}`, {
      method: 'GET',
    });
  }

  // Report submission
  async submitReport(data: {
    reportedUserId?: number;
    reportedAuctionId?: number;
    reason: string;
    description?: string;
  }) {
    return this.request('/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Dispute management
  async createDispute(data: {
    auctionId: number;
    sellerId: number;
    reason: string;
    description?: string;
  }) {
    return this.request('/disputes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserDisputes() {
    return this.request('/disputes/my-disputes', {
      method: 'GET',
    });
  }

  async getDisputeById(disputeId: number) {
    return this.request(`/disputes/${disputeId}`, {
      method: 'GET',
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;
