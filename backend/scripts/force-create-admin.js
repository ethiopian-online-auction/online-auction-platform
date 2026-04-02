const bcrypt = require('bcryptjs');
const { query } = require('./src/config/database');

async function forceCreateAdmin() {
  try {
    const email = 'admin@auction.com';
    const password = 'admin123';
    const name = 'Admin User';
    const phone = '0911111111';
    
    console.log('🔧 Force creating admin user...\n');
    
    // Check if user already exists
    const existing = await query(
      'SELECT id, email, role FROM users WHERE email = $1',
      [email]
    );
    
    if (existing.rows.length > 0) {
      console.log('⚠️  User already exists!');
      console.log(`   Email: ${existing.rows[0].email}`);
      console.log(`   Current role: ${existing.rows[0].role}\n`);
      
      // Update existing user
      console.log('🔄 Updating existing user to admin...');
      
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      
      await query(
        `UPDATE users 
         SET role = 'admin',
             password_hash = $1,
             is_verified = true,
             subscription_status = 'active',
             subscription_plan = 'premium'
         WHERE email = $2`,
        [passwordHash, email]
      );
      
      console.log('✅ User updated successfully!\n');
    } else {
      // Create new admin user
      console.log('➕ Creating new admin user...');
      
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      
      await query(
        `INSERT INTO users (
          name, email, phone, password_hash, role,
          is_verified, subscription_status, subscription_plan,
          wallet_balance
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [name, email, phone, passwordHash, 'admin', true, 'active', 'premium', 0]
      );
      
      console.log('✅ Admin user created successfully!\n');
    }
    
    console.log('═'.repeat(60));
    console.log('🎉 Admin account ready!');
    console.log('═'.repeat(60));
    console.log('');
    console.log('Login credentials:');
    console.log(`  Email:    ${email}`);
    console.log(`  Password: ${password}`);
    console.log('');
    console.log('Go to: http://localhost:3000/auth/login');
    console.log('');
    console.log('After login, click the "🔐 Admin" button in the navbar');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

forceCreateAdmin();
