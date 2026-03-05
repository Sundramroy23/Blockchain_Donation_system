// ===============================
// Image Generator (Centered Text)
// ===============================

// const Jimp = require("jimp");
// const QRCode = require("qrcode");
// const fs = require("fs");
// const path = require("path");
// const { uploadToPinata } = require("./uploadBadgeToIPFS.js");

// // ===============================
// // Badge Generator Function
// // ===============================
// async function generateBadge({
//   name,
//   role,
//   amount,
//   message,
//   qrData,
//   timestamp = new Date().toLocaleString(),
// }) {
//   try {
//     // --- Step 1: Prepare template ---
//     const templatePath = `./templates/${role.toLowerCase()}_template.png`;
//     const background = await Jimp.read(
//       fs.existsSync(templatePath)
//         ? templatePath
//         : "./templates/default_template.png"
//     );

//     // --- Step 2: Load font ---
//     const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);

//     let lines = [];

//     // --- Step 3: Prepare text block ---
//     if(amount === undefined || amount === 0 || amount === null) {
//      lines = [
//       `Name: ${name}`,
//       `Role: ${role}`,
//       `Message: ${message}`,
//       `Date: ${timestamp}`,
//     ];
//     } else {
//      lines = [
//       `Name: ${name}`,
//       `Role: ${role}`,
//       `Donated Amount: $${amount}`,
//       `Message: ${message}`,
//       `Date: ${timestamp}`,
//     ];
//     }

//     const lineHeight = 38; // vertical space between lines
//     const textBlockHeight = lines.length * lineHeight;

//     // --- Step 4: Calculate vertical center ---
//     const startY = background.bitmap.height / 2 - textBlockHeight / 2;

//     // --- Step 5: Draw text lines centered horizontally ---
//     lines.forEach((line, i) => {
//       const textWidth = Jimp.measureText(font, line);
//       const x = background.bitmap.width / 2 - textWidth / 2;
//       const y = startY + i * lineHeight;
//       background.print(font, x, y, line);
//     });

//     // --- Step 6: Generate QR Code (bottom-right corner) ---
//     const qrBuffer = await QRCode.toBuffer(qrData, { width: 100 });
//     const qrImage = await Jimp.read(qrBuffer);
//     background.composite(
//       qrImage,
//       background.bitmap.width - 120,
//       background.bitmap.height - 120
//     );

//     // --- Step 7: Save final badge ---
//     const outputDir = "./badges";
//     if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

//     const safeRole = role.replace(/\s+/g, '_');
//     const safeName = name.replace(/\s+/g, '_');
//     const badgeFileName = `badge_${safeRole}_${safeName}_${Date.now()}.png`;
//     const outputPath = path.join(outputDir, badgeFileName);
//     await background.writeAsync(outputPath);

//     console.log(` Badge created: ${outputPath}`);
    
//     // upload badge to IPFS
    
//     const result = await uploadToPinata(outputPath);

//     // https://ipfs.io/ipfs/QmeiVYv7JPiBeTCgFDHNkSSVsAWCAtzGLi3M6NMoEgiqio

//     // ---- DELETE FILE AFTER UPLOAD ----
//     try {
//       await fs.promises.unlink(outputPath);
//       console.log(`🗑️ Deleted local file: ${outputPath}`);
//     } catch (unlinkErr) {
//       console.error("⚠️ Could not delete file:", unlinkErr);
//     }

//     return {
//       name,
//       role,
//       amount,
//       qrData,
//       timestamp,
//       ipfsLink: `https://ipfs.io/ipfs/${result.data.IpfsHash}`,
//       filePath: outputPath,
//     };
//   } catch (error) {
//     console.error("❌ Error generating badge:", error);
//   }
// }


// exports.generateBadge = generateBadge; 




// // ...existing code...
const Jimp = require("jimp");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");
const { uploadToPinata } = require("./uploadBadgeToIPFS.js");

// ===============================
// Badge Generator Function
// ===============================
async function generateBadge({
  name = 'Unknown',
  role = 'default',
  amount = null,
  message = '',
  qrData = '',
  timestamp,
} = {}) {
  try {
    // sanitize inputs
    name = String(name || 'Unknown');
    role = String(role || 'default');
    message = String(message || '');
    // compute IST timestamp string
    const inputDate = timestamp ? new Date(timestamp) : new Date();

    function formatToIST(date) {
      try {
        const parts = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit',
          hour12: false
        }).formatToParts(date);
        const m = {};
        parts.forEach(p => { if (p.type) m[p.type] = p.value; });
        return `${m.year}-${m.month}-${m.day} ${m.hour}:${m.minute}:${m.second} IST`;
      } catch (e) {
        // fallback: add +5:30 offset to UTC
        const utcMillis = date.getTime() + (date.getTimezoneOffset() * 60000);
        const istMillis = utcMillis + (5.5 * 60 * 60 * 1000);
        const ist = new Date(istMillis);
        const pad = n => String(n).padStart(2, '0');
        return `${ist.getFullYear()}-${pad(ist.getMonth() + 1)}-${pad(ist.getDate())} ${pad(ist.getHours())}:${pad(ist.getMinutes())}:${pad(ist.getSeconds())} IST`;
      }
    }

    const timestampIST = formatToIST(inputDate);
    if (!qrData) qrData = `${name}-${Date.now()}`;

    // --- Step 1: Prepare template ---
    const roleLower = role.toLowerCase();
    const templatePath = `./templates/${roleLower}_template.png`;
    const background = await Jimp.read(
      fs.existsSync(templatePath) ? templatePath : "./templates/default_template.png"
    );

    // --- Step 2: Load font ---
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);

    let lines = [];

    // --- Step 3: Prepare text block ---
    if (amount === undefined || amount === 0 || amount === null) {
      lines = [
        `Name: ${name}`,
        `Role: ${role}`,
        `Message: ${message}`,
        `Date: ${timestampIST}`,
      ];
    } else {
      lines = [
        `Name: ${name}`,
        `Role: ${role}`,
        `Donated Amount: $${amount}`,
        `Message: ${message}`,
        `Date: ${timestampIST}`,
      ];
    }

    const lineHeight = 38; // vertical space between lines
    const textBlockHeight = lines.length * lineHeight;

    // --- Step 4: Calculate vertical center ---
    const startY = background.bitmap.height / 2 - textBlockHeight / 2;

    // --- Step 5: Draw text lines centered horizontally ---
    lines.forEach((line, i) => {
      const textWidth = Jimp.measureText(font, line);
      const x = background.bitmap.width / 2 - textWidth / 2;
      const y = startY + i * lineHeight;
      background.print(font, x, y, line);
    });

    // --- Step 6: Generate QR Code (bottom-right corner) ---
    const qrBuffer = await QRCode.toBuffer(qrData, { width: 100 });
    const qrImage = await Jimp.read(qrBuffer);
    background.composite(
      qrImage,
      background.bitmap.width - 120,
      background.bitmap.height - 120
    );

    // --- Step 7: Save final badge ---
    const outputDir = "./badges";
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    const safeRole = role.replace(/\s+/g, '_');
    const safeName = name.replace(/\s+/g, '_');
    const badgeFileName = `badge_${safeRole}_${safeName}_${Date.now()}.png`;
    const outputPath = path.join(outputDir, badgeFileName);
    await background.writeAsync(outputPath);

    console.log(` Badge created: ${outputPath}`);

    // upload badge to IPFS
    const result = await uploadToPinata(outputPath);

    // ---- DELETE FILE AFTER UPLOAD ----
    try {
      await fs.promises.unlink(outputPath);
      console.log(` Deleted local file: ${outputPath}`);
    } catch (unlinkErr) {
      console.error("Could not delete file:", unlinkErr);
    }

    return {
      name,
      role,
      amount,
      qrData,
      timestamp: timestampIST,
      ipfsLink: result && result.data && result.data.IpfsHash ? `https://ipfs.io/ipfs/${result.data.IpfsHash}` : null,
      filePath: outputPath,
    };
  } catch (error) {
    console.error("❌ Error generating badge:", error);
    throw error;
  }
}

exports.generateBadge = generateBadge;