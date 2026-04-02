// Add funds to a specific user's wallet

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'auction_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function addFunds() {
  try {
    console.log('========================================');
    console.log('ADD FUNDS TO USER WALLET');
    console.log('========================================\n');

    // Get user email from command line or use default
    const userEmail = process.argv[2] || 'test@example.com';
    const amount = parseFloat(process.argv[3]) || 100000;

    console.log(`Adding ${amount} ETB to ${userEmail}...\n`);

    // Check if user exists
    const userResult = await pool.query(
      'SELECT id, name, email, wallet_balance FROM users WHERE email = $1',
      [userEmail]
    );

    if (userResult.rows.length === 0) {
      console.log('❌ User not found!');
      console.log('\nAvailable users:');
      const allUsers = await pool.query(
        'SELECT email, name, wallet_balance FROM users ORDER BY created_at DESC'
      );
      allUsers.rows.forEach(user => {
        console.log(`  - ${user.email} (${user.name}) - Balance: ${user.wallet_balance} ETB`);
      });
      process.exit(1);
    }

    const user = userResult.rows[0];
    console.log(`Found user: ${user.name}`);
    console.log(`Current balance: ${user.wallet_balance} ETB`);

    // Add funds
    const updateResult = await pool.query(
      'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE email = $2 RETURNING wallet_balance',
      [amount, userEmail]
    );

    const newBalance = updateResult.rows[0].wallet_balance;
    console.log(`\n✅ Funds added successfully!`);
    console.log(`New balance: ${newBalance} ETB`);

    console.log('\n========================================');
    console.log('DONE');
    console.log('========================================');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

addFunds();
