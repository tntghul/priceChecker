const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
});

const sendPriceAlert = async ({ to, productName, targetPrice, currentPrice, site, url }) => {
  const mailOptions = {
    from: `"Best Deal Finder" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Price Drop Alert: ${productName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #22a06b;">Price Drop Detected!</h2>
        <p>Good news! <strong>${productName}</strong> is now available at your target price.</p>
        <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px; color: #888;">Current Price</td>
            <td style="padding: 8px; font-weight: bold; font-size: 20px;">&#8377;${Number(currentPrice).toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td style="padding: 8px; color: #888;">Your Target</td>
            <td style="padding: 8px;">&#8377;${Number(targetPrice).toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td style="padding: 8px; color: #888;">Available on</td>
            <td style="padding: 8px;">${site}</td>
          </tr>
        </table>
        ${url ? `<a href="${url}" style="display:inline-block; padding:10px 20px; background:#111; color:#fff; border-radius:8px; text-decoration:none;">View Product &rarr;</a>` : ""}
        <p style="color:#bbb; font-size:12px; margin-top:24px;">
          This alert has been marked as triggered. Set a new alert anytime on Best Deal Finder.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`EMAIL SENT to ${to} for: ${productName}`);
};

module.exports = { sendPriceAlert };
