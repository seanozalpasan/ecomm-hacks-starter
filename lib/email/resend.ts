import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
	throw new Error("RESEND_API_KEY is not set");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

interface SendInviteEmailParams {
	to: string;
	inviteId: string;
	gameName: string;
	hostName: string;
	deadline: Date;
	priceLimit: string | null;
}

export async function sendInviteEmail({
	to,
	inviteId,
	gameName,
	hostName,
	deadline,
	priceLimit,
}: SendInviteEmailParams) {
	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
	const inviteUrl = `${baseUrl}/invite/${inviteId}`;

	const deadlineFormatted = deadline.toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	const priceLimitText = priceLimit
		? `with a price limit of $${priceLimit}`
		: "";

	const html = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
	<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; border-radius: 8px 8px 0 0; text-align: center;">
		<h1 style="color: white; margin: 0; font-size: 28px;">🎁 Secret Santa Invitation</h1>
	</div>

	<div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
		<p style="font-size: 18px; margin-top: 0;">Hi there!</p>

		<p style="font-size: 16px; line-height: 1.8;">
			<strong>${hostName}</strong> has invited you to join their Secret Santa gift exchange ${priceLimitText}!
		</p>

		<div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 4px;">
			<p style="margin: 0 0 10px 0; font-size: 14px; color: #666; font-weight: 600;">GIFT EXCHANGE DEADLINE</p>
			<p style="margin: 0; font-size: 18px; font-weight: bold; color: #333;">${deadlineFormatted}</p>
		</div>

		<p style="font-size: 16px; line-height: 1.8;">
			Click the button below to view the details and respond to the invitation:
		</p>

		<div style="text-align: center; margin: 40px 0;">
			<a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 48px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
				View Invitation
			</a>
		</div>

		<p style="font-size: 14px; color: #666; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
			Or copy and paste this link into your browser:<br>
			<a href="${inviteUrl}" style="color: #667eea; word-break: break-all;">${inviteUrl}</a>
		</p>
	</div>

	<div style="text-align: center; margin-top: 30px; font-size: 12px; color: #999;">
		<p>This invitation was sent by ${hostName}. If you didn't expect this, you can safely ignore this email.</p>
	</div>
</body>
</html>
	`;

	const text = `
Secret Santa Invitation

Hi there!

${hostName} has invited you to join their Secret Santa gift exchange ${priceLimitText}!

Gift Exchange Deadline: ${deadlineFormatted}

To view the details and respond to the invitation, visit:
${inviteUrl}

If you didn't expect this invitation, you can safely ignore this email.
	`;

	await resend.emails.send({
		from: "Secret Santa <onboarding@resend.dev>",
		to,
		subject: `🎁 You're invited to a Secret Santa gift exchange!`,
		html,
		text,
	});
}
