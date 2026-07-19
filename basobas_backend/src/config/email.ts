import nodemailer from 'nodemailer';
const EMAIL_PASS = process.env.EMAIL_PASSWORD as string;
const EMAIL_USER = process.env.EMAIL_USER as string;

console.log('Email Config - USER:', EMAIL_USER);
console.log('Email Config - PASS exists:', !!EMAIL_PASS);

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
    },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
    console.log('Attempting to send email to:', to);
    console.log('From:', EMAIL_USER);
    const mailOptions = {
        from:`Rentora <${EMAIL_USER}>`,
        to,
        subject,
        html,
    };
    try {
        const result = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', result);
        return result;
    } catch (error) {
        console.error('Email sending failed:', error);
        throw error;
    }
}