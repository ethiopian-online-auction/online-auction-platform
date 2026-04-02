// Payment Service - Integrates with Telebirr, Chapa, and CBE Birr

const axios = require('axios');
const crypto = require('crypto');

class PaymentService {
  constructor() {
    // Chapa Configuration
    this.chapaSecretKey = process.env.CHAPA_SECRET_KEY || 'CHASECK_TEST-your-secret-key';
    this.chapaBaseUrl = 'https://api.chapa.co/v1';
    
    // Telebirr Configuration
    this.telebirrAppId = process.env.TELEBIRR_APP_ID || 'your-app-id';
    this.telebirrAppKey = process.env.TELEBIRR_APP_KEY || 'your-app-key';
    this.telebirrPublicKey = process.env.TELEBIRR_PUBLIC_KEY || 'your-public-key';
    this.telebirrBaseUrl = 'https://app.ethiotelebirr.et:9443/ammapi';
    
    // CBE Birr Configuration
    this.cbeBirrMerchantId = process.env.CBE_BIRR_MERCHANT_ID || 'your-merchant-id';
    this.cbeBirrApiKey = process.env.CBE_BIRR_API_KEY || 'your-api-key';
    this.cbeBirrBaseUrl = 'https://api.cbebirr.et/v1';
  }

  // ==================== CHAPA INTEGRATION ====================
  
  async initializeChapaPayment(data) {
    try {
      const {
        amount,
        currency = 'ETB',
        email,
        firstName,
        lastName,
        phoneNumber,
        txRef,
        callbackUrl,
        returnUrl,
        customization = {}
      } = data;

      const payload = {
        amount: amount.toString(),
        currency,
        email,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        tx_ref: txRef,
        callback_url: callbackUrl,
        return_url: returnUrl,
        customization: {
          title: customization.title || 'AuctionET - Add Funds',
          description: customization.description || 'Add funds to wallet',
          logo: customization.logo || 'https://your-logo-url.com/logo.png'
        }
      };

      const response = await axios.post(
        `${this.chapaBaseUrl}/transaction/initialize`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.chapaSecretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: {
          checkoutUrl: response.data.data.checkout_url,
          txRef: txRef,
          provider: 'chapa'
        }
      };
    } catch (error) {
      console.error('Chapa initialization error:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to initialize Chapa payment'
      };
    }
  }

  async verifyChapaPayment(txRef) {
    try {
      const response = await axios.get(
        `${this.chapaBaseUrl}/transaction/verify/${txRef}`,
        {
          headers: {
            'Authorization': `Bearer ${this.chapaSecretKey}`
          }
        }
      );

      const status = response.data.status;
      const data = response.data.data;

      return {
        success: status === 'success',
        status: data.status,
        amount: parseFloat(data.amount),
        currency: data.currency,
        txRef: data.tx_ref,
        provider: 'chapa'
      };
    } catch (error) {
      console.error('Chapa verification error:', error.response?.data || error.message);
      return {
        success: false,
        message: 'Failed to verify Chapa payment'
      };
    }
  }

  // ==================== TELEBIRR INTEGRATION ====================
  
  async initializeTelebirrPayment(data) {
    try {
      const {
        amount,
        userId,
        userName,
        phoneNumber,
        orderId,
        notifyUrl,
        returnUrl
      } = data;

      const timestamp = Date.now().toString();
      const nonce = crypto.randomBytes(16).toString('hex');

      // Create sign string
      const signString = this.createTelebirrSignature({
        appId: this.telebirrAppId,
        timestamp,
        nonce,
        notifyUrl,
        orderId,
        amount: amount.toString(),
        subject: 'Wallet Top-up',
        outTradeNo: orderId
      });

      const payload = {
        appId: this.telebirrAppId,
        timestamp,
        nonce,
        notifyUrl,
        returnUrl,
        outTradeNo: orderId,
        subject: 'AuctionET - Add Funds',
        totalAmount: amount.toString(),
        timeout: '30',
        sign: signString
      };

      const response = await axios.post(
        `${this.telebirrBaseUrl}/payment/v1/merchant/preOrder`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-APP-Key': this.telebirrAppKey
          }
        }
      );

      if (response.data.code === 0) {
        return {
          success: true,
          data: {
            checkoutUrl: response.data.data.toPayUrl,
            prepayId: response.data.data.prepayId,
            orderId: orderId,
            provider: 'telebirr'
          }
        };
      } else {
        return {
          success: false,
          message: response.data.msg || 'Failed to initialize Telebirr payment'
        };
      }
    } catch (error) {
      console.error('Telebirr initialization error:', error.response?.data || error.message);
      return {
        success: false,
        message: 'Failed to initialize Telebirr payment'
      };
    }
  }

  createTelebirrSignature(params) {
    // Sort parameters alphabetically
    const sortedKeys = Object.keys(params).sort();
    const signString = sortedKeys
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    // Create signature using app key
    const signature = crypto
      .createHmac('sha256', this.telebirrAppKey)
      .update(signString)
      .digest('hex')
      .toUpperCase();
    
    return signature;
  }

  async verifyTelebirrPayment(orderId) {
    try {
      const timestamp = Date.now().toString();
      const nonce = crypto.randomBytes(16).toString('hex');

      const signString = this.createTelebirrSignature({
        appId: this.telebirrAppId,
        timestamp,
        nonce,
        outTradeNo: orderId
      });

      const payload = {
        appId: this.telebirrAppId,
        timestamp,
        nonce,
        outTradeNo: orderId,
        sign: signString
      };

      const response = await axios.post(
        `${this.telebirrBaseUrl}/payment/v1/merchant/query`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-APP-Key': this.telebirrAppKey
          }
        }
      );

      if (response.data.code === 0) {
        const data = response.data.data;
        return {
          success: data.tradeStatus === 'TRADE_SUCCESS',
          status: data.tradeStatus,
          amount: parseFloat(data.totalAmount),
          orderId: data.outTradeNo,
          provider: 'telebirr'
        };
      } else {
        return {
          success: false,
          message: response.data.msg || 'Failed to verify Telebirr payment'
        };
      }
    } catch (error) {
      console.error('Telebirr verification error:', error.response?.data || error.message);
      return {
        success: false,
        message: 'Failed to verify Telebirr payment'
      };
    }
  }

  // ==================== CBE BIRR INTEGRATION ====================
  
  async initializeCBEBirrPayment(data) {
    try {
      const {
        amount,
        orderId,
        customerName,
        customerPhone,
        description,
        callbackUrl,
        returnUrl
      } = data;

      const payload = {
        merchant_id: this.cbeBirrMerchantId,
        order_id: orderId,
        amount: amount.toString(),
        currency: 'ETB',
        customer_name: customerName,
        customer_phone: customerPhone,
        description: description || 'Wallet Top-up',
        callback_url: callbackUrl,
        return_url: returnUrl,
        timestamp: Date.now()
      };

      // Create signature
      const signature = this.createCBEBirrSignature(payload);
      payload.signature = signature;

      const response = await axios.post(
        `${this.cbeBirrBaseUrl}/payment/initialize`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.cbeBirrApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        return {
          success: true,
          data: {
            checkoutUrl: response.data.data.payment_url,
            transactionId: response.data.data.transaction_id,
            orderId: orderId,
            provider: 'cbe_birr'
          }
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to initialize CBE Birr payment'
        };
      }
    } catch (error) {
      console.error('CBE Birr initialization error:', error.response?.data || error.message);
      return {
        success: false,
        message: 'Failed to initialize CBE Birr payment'
      };
    }
  }

  createCBEBirrSignature(params) {
    // Sort parameters and create signature
    const sortedKeys = Object.keys(params)
      .filter(key => key !== 'signature')
      .sort();
    
    const signString = sortedKeys
      .map(key => `${key}=${params[key]}`)
      .join('&') + `&key=${this.cbeBirrApiKey}`;
    
    return crypto
      .createHash('sha256')
      .update(signString)
      .digest('hex')
      .toUpperCase();
  }

  async verifyCBEBirrPayment(transactionId) {
    try {
      const response = await axios.get(
        `${this.cbeBirrBaseUrl}/payment/verify/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.cbeBirrApiKey}`
          }
        }
      );

      if (response.data.success) {
        const data = response.data.data;
        return {
          success: data.status === 'completed',
          status: data.status,
          amount: parseFloat(data.amount),
          transactionId: data.transaction_id,
          provider: 'cbe_birr'
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to verify CBE Birr payment'
        };
      }
    } catch (error) {
      console.error('CBE Birr verification error:', error.response?.data || error.message);
      return {
        success: false,
        message: 'Failed to verify CBE Birr payment'
      };
    }
  }

  // ==================== UNIFIED PAYMENT INTERFACE ====================
  
  async initializePayment(provider, data) {
    switch (provider.toLowerCase()) {
      case 'chapa':
        return await this.initializeChapaPayment(data);
      case 'telebirr':
        return await this.initializeTelebirrPayment(data);
      case 'cbe_birr':
        return await this.initializeCBEBirrPayment(data);
      default:
        return {
          success: false,
          message: 'Invalid payment provider'
        };
    }
  }

  async verifyPayment(provider, reference) {
    switch (provider.toLowerCase()) {
      case 'chapa':
        return await this.verifyChapaPayment(reference);
      case 'telebirr':
        return await this.verifyTelebirrPayment(reference);
      case 'cbe_birr':
        return await this.verifyCBEBirrPayment(reference);
      default:
        return {
          success: false,
          message: 'Invalid payment provider'
        };
    }
  }
}

module.exports = new PaymentService();
