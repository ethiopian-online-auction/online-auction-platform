const { query } = require('./src/config/database');

async function makeUserAdmin() {
  try {
    const email = process.argv[2];
    
    if (!email) {
      console.log('❌ Please provide an email address');
      console.log('\nUsage:');
      console.log('  node make-user-admin.js user@example.com');
      console.log('\nOr run this first to see all users:');
      console.log('  node list-all-users.js');
      process.exit(1);
    }
    
    console.log(`🔍 Looking for user: ${email}\n`);
    
    // Check if user exists
    const userCheck = await query(
      'SELECT id, name, email, role FROM users WHERE email = $1',
      [email]
    );
    
    if (userCheck.rows.length === 0) {
      console.log(`❌ User not found: ${email}`);
      console.log('\nAvailable users:');
      
      const allUsers = await query('SELECT email, name FROM users ORDER BY created_at DESC');
      allUsers.rows.forEach((u, i) => {
        console.log(`  ${i + 1}. ${u.email} (${u.name})`);
      });
      
      process.exit(1);
    }
    
    const user = userCheck.rows[0];
    console.log(`✅ Found user: ${user.name}`);
    console.log(`   Current role: ${user.role}\n`);
    
    if (user.role === 'admin') {
      console.log('ℹ️  User is already an admin!');
      process.exit(0);
    }
    
    // Update to admin
    await query(
      `UPDATE users 
       SET role = 'admin', 
           is_verified = true,
           subscription_status = 'active'
       WHERE email = $1`,
      [email]
    );
    
    console.log('✅ User updated successfully!');
    console.log(`   New role: admin`);
    console.log(`   Verified: true`);
    console.log(`   Status: active\n`);
    
    console.log('🎉 You can now login as admin with:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: (your existing password)\n`);
    
    console.log('📍 Go to: http://localhost:3000/auth/login');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

makeUserAdmin();
