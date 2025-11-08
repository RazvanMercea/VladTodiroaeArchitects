import emailjs from "@emailjs/browser";

export const sendContactEmail = async ({ name, email, message }) => {
  try {
    const result = await emailjs.send(
      process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
      { name, email, message },
      process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
    );
    return result;
  } catch (error) {
    console.error("EmailJS send error:", error);
    throw error;
  }
};