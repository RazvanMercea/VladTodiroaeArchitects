import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: "Please fill all fields" });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.mail.yahoo.com",
      port: 465,
      secure: true, // SSL
      auth: {
        user: process.env.YAHOO_EMAIL,
        pass: process.env.YAHOO_APP_PASSWORD
      },
    });

    await transporter.sendMail({
    from: process.env.YAHOO_EMAIL,
    replyTo: email,
    to: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
    subject: `Mesaj de la ${name}`,
    text: message,
    html: `<p>${message}</p><p>De la: ${name} (${email})</p>`,
    });

    return res.status(200).json({ message: "Email trimis cu succes" });
  } catch (error) {
    console.error("Nodemailer error:", error);
    return res.status(500).json({ message: "Eroare la trimiterea emailului" });
  }
}
