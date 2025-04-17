import createMailTransporter from "./Email.config.js"

const sendEmail = async (options) => {
    const transporter = createMailTransporter();
    
    const mailOptions = {
        from: process.env.SMTP_FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully:", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
}

export default sendEmail;