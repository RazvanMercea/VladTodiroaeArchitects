import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ message: "Please fill all fields" });
  }

  try {
    await sgMail.send({
      to: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
      from: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
      replyTo: email,
      subject: `Mesaj de la ${name}`,
      text: message,
      html: `<p>${message}</p><p>De la: ${name} (${email})</p>`,
    });

    return res.status(200).json({ message: "Email trimis cu succes" });
  } catch (error) {
    console.error("SendGrid error:", error);
    return res.status(500).json({ message: "Eroare la trimiterea emailului" });
  }
}
