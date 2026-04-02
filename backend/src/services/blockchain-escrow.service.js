const { query, getClient } = require('../config/database');

/**
 * Blockchain-based Escrow Service
 * Integrates with Ethereum/Polygon for secure smart contract escrow
 * 
 * Note: This is a simulation layer. For production:
 * - Install: npm install ethers web3 @openzeppelin/contracts
 * - Deploy smart contracts to Ethereum/Polygon
 * - Use Web3.js or Ethers.js for blockchain interaction
 * - Implement proper key management (HSM, KMS)
 */

class BlockchainEscrowService {
  constructor() {
    // Blockchain configuration
    this.config = {
      network: process.env.BLOCKCHAIN_NETWORK || 'polygon-mumbai', // testnet
      rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'https://rpc-mumbai.maticvigil.com',
      contractAddress: process.env.ESCROW_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
      gasLimit: 300000,
      confirmations: 2 // Wait for 2 block confirmations
    };

    // Escrow states
    this.states = {
      CREATED: 'created',
      FUNDED: 'funded',
      SHIPPED: 'shipped',
      DELIVERED: 'delivered',
      RELEASED: 'released',
      DISPUTED: 'disputed',
      REFUNDED: 'refunded'
    };
  }

  /**
   * Create escrow smart contract
   */
  async createEscrow(transactionId, buyerId, sellerId, amount, auctionId) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      // Generate unique escrow ID
      const escrowId = this.generateEscrowId(transactionId);

      // In production, deploy smart contract to blockchain
      const blockchainTxHash = await this.deployEscrowContract({
        escrowId,
        buyer: buyerId,
        seller: sellerId,
        amount,
        auctionId
      });

      // Store escrow record in database
      const result = await client.query(
        `INSERT INTO blockchain_escrows 
         (escrow_id, transaction_id, buyer_id, seller_id, amount, auction_id, 
          state, blockchain_tx_hash, network, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
         RETURNING *`,
        [escrowId, transactionId, buyerId, sellerId, amount, auctionId, 
         this.states.CREATED, blockchainTxHash, this.config.network]
      );

      await client.query('COMMIT');

      return {
        success: true,
        data: {
          escrowId,
          blockchainTxHash,
          state: this.states.CREATED,
          explorerUrl: this.getExplorerUrl(blockchainTxHash)
        }
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Create escrow error:', error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      client.release();
    }
  }

  /**
   * Fund escrow (buyer deposits funds)
   */
  async fundEscrow(escrowId, amount) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      // Get escrow details
      const escrowResult = await client.query(
        'SELECT * FROM blockchain_escrows WHERE escrow_id = $1',
        [escrowId]
      );

      if (escrowResult.rows.length === 0) {
        throw new Error('Escrow not found');
      }

      const escrow = escrowResult.rows[0];

      if (escrow.state !== this.states.CREATED) {
        throw new Error(`Invalid escrow state: ${escrow.state}`);
      }

      // In production, call smart contract to deposit funds
      const blockchainTxHash = await this.depositToContract(escrowId, amount);

      // Update escrow state
      await client.query(
        `UPDATE blockchain_escrows 
         SET state = $1, funded_at = NOW(), funding_tx_hash = $2
         WHERE escrow_id = $3`,
        [this.states.FUNDED, blockchainTxHash, escrowId]
      );

      // Lock funds in user's wallet
      await client.query(
        'UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2',
        [amount, escrow.buyer_id]
      );

      await client.query('COMMIT');

      return {
        success: true,
        data: {
          escrowId,
          state: this.states.FUNDED,
          blockchainTxHash,
          explorerUrl: this.getExplorerUrl(blockchainTxHash)
        }
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Fund escrow error:', error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      client.release();
    }
  }

  /**
   * Mark item as shipped
   */
  async markShipped(escrowId, trackingNumber) {
    try {
      // In production, update smart contract state
      const blockchainTxHash = await this.updateContractState(escrowId, this.states.SHIPPED);

      await query(
        `UPDATE blockchain_escrows 
         SET state = $1, shipped_at = NOW(), tracking_number = $2, shipping_tx_hash = $3
         WHERE escrow_id = $4`,
        [this.states.SHIPPED, trackingNumber, blockchainTxHash, escrowId]
      );

      return {
        success: true,
        data: {
          escrowId,
          state: this.states.SHIPPED,
          trackingNumber,
          blockchainTxHash
        }
      };
    } catch (error) {
      console.error('Mark shipped error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Confirm delivery (buyer confirms receipt)
   */
  async confirmDelivery(escrowId, buyerId) {
    try {
      // Verify buyer
      const escrowResult = await query(
        'SELECT * FROM blockchain_escrows WHERE escrow_id = $1',
        [escrowId]
      );

      if (escrowResult.rows.length === 0) {
        throw new Error('Escrow not found');
      }

      const escrow = escrowResult.rows[0];

      if (escrow.buyer_id !== buyerId) {
        throw new Error('Only buyer can confirm delivery');
      }

      // In production, update smart contract
      const blockchainTxHash = await this.updateContractState(escrowId, this.states.DELIVERED);

      await query(
        `UPDATE blockchain_escrows 
         SET state = $1, delivered_at = NOW(), delivery_tx_hash = $2
         WHERE escrow_id = $3`,
        [this.states.DELIVERED, blockchainTxHash, escrowId]
      );

      return {
        success: true,
        data: {
          escrowId,
          state: this.states.DELIVERED,
          blockchainTxHash
        }
      };
    } catch (error) {
      console.error('Confirm delivery error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Release funds to seller (after delivery confirmation)
   */
  async releaseFunds(escrowId, adminId) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      // Get escrow details
      const escrowResult = await client.query(
        'SELECT * FROM blockchain_escrows WHERE escrow_id = $1',
        [escrowId]
      );

      if (escrowResult.rows.length === 0) {
        throw new Error('Escrow not found');
      }

      const escrow = escrowResult.rows[0];

      if (escrow.state !== this.states.DELIVERED) {
        throw new Error(`Cannot release funds in state: ${escrow.state}`);
      }

      // In production, call smart contract to release funds
      const blockchainTxHash = await this.releaseFromContract(escrowId, escrow.seller_id);

      // Update escrow state
      await client.query(
        `UPDATE blockchain_escrows 
         SET state = $1, released_at = NOW(), release_tx_hash = $2, released_by = $3
         WHERE escrow_id = $4`,
        [this.states.RELEASED, blockchainTxHash, adminId, escrowId]
      );

      // Add funds to seller's wallet
      await client.query(
        'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2',
        [escrow.amount, escrow.seller_id]
      );

      // Record wallet transaction
      await client.query(
        `INSERT INTO wallet_transactions 
         (user_id, type, amount, description, status, reference_id)
         VALUES ($1, 'escrow_release', $2, 'Escrow funds released', 'completed', $3)`,
        [escrow.seller_id, escrow.amount, escrow.transaction_id]
      );

      await client.query('COMMIT');

      return {
        success: true,
        data: {
          escrowId,
          state: this.states.RELEASED,
          amount: escrow.amount,
          blockchainTxHash,
          explorerUrl: this.getExplorerUrl(blockchainTxHash)
        }
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Release funds error:', error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      client.release();
    }
  }

  /**
   * Refund to buyer (in case of dispute or cancellation)
   */
  async refundBuyer(escrowId, reason, adminId) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      // Get escrow details
      const escrowResult = await client.query(
        'SELECT * FROM blockchain_escrows WHERE escrow_id = $1',
        [escrowId]
      );

      if (escrowResult.rows.length === 0) {
        throw new Error('Escrow not found');
      }

      const escrow = escrowResult.rows[0];

      // In production, call smart contract to refund
      const blockchainTxHash = await this.refundFromContract(escrowId, escrow.buyer_id);

      // Update escrow state
      await client.query(
        `UPDATE blockchain_escrows 
         SET state = $1, refunded_at = NOW(), refund_tx_hash = $2, 
             refund_reason = $3, refunded_by = $4
         WHERE escrow_id = $5`,
        [this.states.REFUNDED, blockchainTxHash, reason, adminId, escrowId]
      );

      // Return funds to buyer's wallet
      await client.query(
        'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2',
        [escrow.amount, escrow.buyer_id]
      );

      // Record wallet transaction
      await client.query(
        `INSERT INTO wallet_transactions 
         (user_id, type, amount, description, status, reference_id)
         VALUES ($1, 'escrow_refund', $2, $3, 'completed', $4)`,
        [escrow.buyer_id, escrow.amount, `Escrow refund: ${reason}`, escrow.transaction_id]
      );

      await client.query('COMMIT');

      return {
        success: true,
        data: {
          escrowId,
          state: this.states.REFUNDED,
          amount: escrow.amount,
          blockchainTxHash,
          explorerUrl: this.getExplorerUrl(blockchainTxHash)
        }
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Refund buyer error:', error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get escrow status
   */
  async getEscrowStatus(escrowId) {
    try {
      const result = await query(
        `SELECT 
          e.*,
          u_buyer.name as buyer_name,
          u_seller.name as seller_name,
          a.title as auction_title
         FROM blockchain_escrows e
         LEFT JOIN users u_buyer ON e.buyer_id = u_buyer.id
         LEFT JOIN users u_seller ON e.seller_id = u_seller.id
         LEFT JOIN auctions a ON e.auction_id = a.id
         WHERE e.escrow_id = $1`,
        [escrowId]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Escrow not found'
        };
      }

      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      console.error('Get escrow status error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ============ Blockchain Integration Methods ============
  // These are simulation methods. Replace with actual blockchain calls in production.

  /**
   * Deploy escrow smart contract (SIMULATION)
   */
  async deployEscrowContract(params) {
    // In production, use Web3.js or Ethers.js:
    // const contract = new ethers.ContractFactory(abi, bytecode, wallet);
    // const instance = await contract.deploy(params.buyer, params.seller, params.amount);
    // await instance.deployed();
    // return instance.deployTransaction.hash;

    // Simulation: Generate fake transaction hash
    return this.generateTxHash();
  }

  /**
   * Deposit funds to contract (SIMULATION)
   */
  async depositToContract(escrowId, amount) {
    // In production:
    // const contract = new ethers.Contract(address, abi, wallet);
    // const tx = await contract.deposit({ value: ethers.utils.parseEther(amount.toString()) });
    // await tx.wait(this.config.confirmations);
    // return tx.hash;

    return this.generateTxHash();
  }

  /**
   * Update contract state (SIMULATION)
   */
  async updateContractState(escrowId, newState) {
    // In production:
    // const contract = new ethers.Contract(address, abi, wallet);
    // const tx = await contract.updateState(escrowId, newState);
    // await tx.wait(this.config.confirmations);
    // return tx.hash;

    return this.generateTxHash();
  }

  /**
   * Release funds from contract (SIMULATION)
   */
  async releaseFromContract(escrowId, sellerId) {
    // In production:
    // const contract = new ethers.Contract(address, abi, wallet);
    // const tx = await contract.release(escrowId, sellerId);
    // await tx.wait(this.config.confirmations);
    // return tx.hash;

    return this.generateTxHash();
  }

  /**
   * Refund from contract (SIMULATION)
   */
  async refundFromContract(escrowId, buyerId) {
    // In production:
    // const contract = new ethers.Contract(address, abi, wallet);
    // const tx = await contract.refund(escrowId, buyerId);
    // await tx.wait(this.config.confirmations);
    // return tx.hash;

    return this.generateTxHash();
  }

  // ============ Helper Methods ============

  generateEscrowId(transactionId) {
    return `ESC-${transactionId}-${Date.now()}`;
  }

  generateTxHash() {
    // Generate fake blockchain transaction hash for simulation
    return '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  getExplorerUrl(txHash) {
    const explorers = {
      'polygon-mumbai':
 'https://mumbai.polygonscan.com/tx/',
      'polygon-mainnet': 'https://polygonscan.com/tx/',
      'ethereum-goerli': 'https://goerli.etherscan.io/tx/',
      'ethereum-mainnet': 'https://etherscan.io/tx/'
    };

    const baseUrl = explorers[this.config.network] || explorers['polygon-mumbai'];
    return `${baseUrl}${txHash}`;
  }
}

module.exports = new BlockchainEscrowService();
