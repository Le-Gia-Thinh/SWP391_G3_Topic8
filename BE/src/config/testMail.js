import { sendMail } from "../services/mailService.js";

async function main() {
    try {
        console.log("Testing email sending...");
        await sendMail({
            to: "alice@email.com",
            subject: "Test Email from Smart Parking Dev",
            html: "<h3>Hello! This is a test email redirect check.</h3>"
        });
        console.log("Email sent successfully! Please check legiathinh0508@gmail.com");
        process.exit(0);
    } catch (err) {
        console.error("Failed to send email:", err);
        process.exit(1);
    }
}

main();
