// Create Admin User Script
const bcrypt = require('bcryptjs');
const { query } = require('./src/config/database');

async function createAdmin() {
  try {
    console.log('Creating admin user...\n');

    // Admin credentials
    const adminData = {
      name: 'Admin User',
      email: 'admin@auction.et',
      phone: '+251911000000',
      password: 'admin123',
      role: 'admin'
    };

    // Check if admin already exists
    const existingAdmin = await query(
      'SELECT id, email, role FROM users WHERE email = $1',
      [adminData.email]
    );

    if (existingAdmin.rows.length > 0) {
      console.log('✓ Admin user already exists!');
      console.log('\nAdmin Login Credentials:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Email:    admin@auction.et');
      console.log('Password: admin123');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\nAccess admin dashboard at: http://localhost:3000/admin');
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminData.password, salt);

    // Create admin user
    const result = await query(
      `INSERT INTO users (name, email, phone, password_hash, role, is_verified, subscription_plan, subscription_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, email, role`,
      [
        adminData.name,
        adminData.email,
        adminData.phone,
        passwordHash,
        adminData.role,
        true,
        'premium',
        'active'
      ]
    );

    const admin = result.rows[0];

    console.log('✓ Admin user created successfully!\n');
    console.log('Admin Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ID:       ' + admin.id);
    console.log('Name:     ' + admin.name);
    console.log('Email:    ' + admin.email);
    console.log('Role:     ' + admin.role);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nAdmin Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:    admin@auction.et');
    console.log('Password: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nAccess admin dashboard at: http://localhost:3000/admin');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!\n');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();
