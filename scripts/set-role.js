// This script grants a specific role (admin, moderator, support) to a user.
// Usage: node scripts/set-role.js <user-email> <role>
// Example: node scripts/set-role.js user@example.com moderator

const admin = require('firebase-admin');
const path = require('path');

// --- IMPORTANT ---
// 1. Download your service account key JSON file from the Firebase console.
//    (Project Settings > Service accounts > Generate new private key)
// 2. Rename it to `serviceAccountKey.json` and place it in the root of this project.
// 3. This file is already in .gitignore to prevent it from being committed.
const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
let serviceAccount;

try {
  serviceAccount = require(serviceAccountPath);
} catch (e) {
  console.error('\x1b[31m%s\x1b[0m', 'ERROR: `serviceAccountKey.json` not found in the project root.');
  console.error('Please download it from your Firebase project settings (Service Accounts tab) and place it in the root directory.');
  process.exit(1);
}

// Get arguments from the command line
const email = process.argv[2];
const role = process.argv[3];
const validRoles = ['admin', 'moderator', 'support', 'user'];

if (!email || !role) {
  console.error('\x1b[31m%s\x1b[0m', 'ERROR: Please provide both user email and role as arguments.');
  console.log('Usage: node scripts/set-role.js <user-email> <role>');
  process.exit(1);
}

if (!validRoles.includes(role)) {
    console.error('\x1b[31m%s\x1b[0m', `ERROR: Invalid role "${role}". Valid roles are: ${validRoles.join(', ')}.`);
    process.exit(1);
}


// Initialize the Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Set the custom claim
(async () => {
  try {
    const user = await admin.auth().getUserByEmail(email);
    const newClaims = { role: role === 'user' ? null : role }; // Set role to null to remove admin-like privileges
    
    await admin.auth().setCustomUserClaims(user.uid, newClaims);

    if (role === 'user') {
        console.log('\x1b[32m%s\x1b[0m', `✅ Success! All special roles removed from ${email} (UID: ${user.uid}).`);
    } else {
        console.log('\x1b[32m%s\x1b[0m', `✅ Success! Role "${role}" granted to ${email} (UID: ${user.uid}).`);
    }
    
    console.log('It may take a few minutes for the claim to propagate. The user might need to log out and log back in for changes to take effect.');
    process.exit(0);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
        console.error('\x1b[31m%s\x1b[0m', `ERROR: User with email "${email}" not found.`);
    } else {
        console.error('\x1b[31m%s\x1b[0m', 'An unexpected error occurred:');
        console.error(error);
    }
    process.exit(1);
  }
})();
