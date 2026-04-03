/**
 * OrganizO Icon Resizer
 * Resizes the generated app icon to 192x192 and 512x512 for PWA/Play Store
 * Run: node resize-icons.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Install sharp if not present
try {
    require.resolve('sharp');
} catch(e) {
    console.log('Installing sharp...');
    execSync('npm install sharp --save-dev', { stdio: 'inherit', cwd: __dirname });
}

const sharp = require('sharp');

const srcIcon = path.join(
    'C:\\Users\\admini\\.gemini\\antigravity\\brain\\01da180d-a570-449a-8909-c40aeb27d889',
    'organizo_app_icon_1774857554105.png'
);

const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir);

async function resizeIcons() {
    console.log('🌿 OrganizO Icon Resizer\n');

    if (!fs.existsSync(srcIcon)) {
        console.error('❌ Source icon not found at:', srcIcon);
        process.exit(1);
    }

    const sizes = [
        { size: 192, name: 'icon-192.png' },
        { size: 512, name: 'icon-512.png' },
    ];

    for (const { size, name } of sizes) {
        const outPath = path.join(imagesDir, name);
        await sharp(srcIcon)
            .resize(size, size, { fit: 'cover', position: 'center' })
            .png({ quality: 95 })
            .toFile(outPath);
        console.log(`✅ Created images/${name} (${size}x${size})`);
    }

    console.log('\n🎉 Icons ready! Commit and push to deploy.');
}

resizeIcons().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
