/** Escapes user-supplied text before it is placed into email HTML. */
const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const e = escapeHtml;

/**
 * Where emails load the logo from. Mail apps only show ordinary image files served from a
 * public address, so the logo is a PNG in /public (see scripts/generate_email_logo.mjs).
 */
const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://develop.pair-form.com").replace(/\/$/, "");

/** The logo block at the top of every email. */
const LOGO_HEADER = `<div style="text-align: center; margin-bottom: 30px;">
          <img src="${SITE_URL}/logo.png" alt="PairForm" width="150" style="width: 150px; max-width: 150px; height: auto; border: 0;" />
        </div>`;

export const EMAIL_SENDERS = {
  WELCOME: "Welcome <welcome@service.pair-form.com>",
  NOTIFY: "PairForm <notify@service.pair-form.com>",
  SUPPORT: "PairForm Support <support@service.pair-form.com>",
};

/** The name that signs the welcome email. Change it here to sign as a person, e.g. "Mariam". */
const WELCOME_SENDER_NAME = "The PairForm Team";

const WELCOME_STEPS: [string, string][] = [
  ["Create an event.", "Name it and pick what you're organizing: teams, pairs, a Secret Santa, or numbered positions for a workshop."],
  ["Set your slots and rules.", "Define roles, limits, and balance so no group overfills or ends up lopsided."],
  ["Share the link.", "Send it by WhatsApp, email, or Slack."],
  ["Go live.", "People choose their spots and you watch the groups fill in real time."],
];

const WELCOME_USE_CASES = [
  "Team and cohort formation",
  "One-on-one pairing (mentoring, peer review)",
  "Secret Santa and gift exchanges",
  "Workshop and classroom group assignment",
  "Game teams and number/position allocation",
];

export const getWelcomeEmail = (firstName: string) => {
  const preview = "Create an event, share a link, and let people place themselves.";
  const steps = WELCOME_STEPS.map(
    ([title, text], i) => `
          <tr>
            <td valign="top" style="padding: 0 12px 14px 0; width: 28px;">
              <div style="width: 28px; height: 28px; line-height: 28px; border-radius: 14px; background-color: #eef4ff; color: #0c3886; font-size: 14px; font-weight: 700; text-align: center;">${i + 1}</div>
            </td>
            <td valign="top" style="padding: 0 0 14px 0; font-size: 16px; color: #333;"><strong>${title}</strong> ${text}</td>
          </tr>`
  ).join("");
  const useCases = WELCOME_USE_CASES.map((item) => `<li style="margin-bottom: 6px;">${item}</li>`).join("");

  return {
    from: EMAIL_SENDERS.WELCOME,
    subject: "Welcome to PairForm",
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <!-- Preview text shown next to the subject in the inbox; hidden in the email itself. -->
        <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent; mso-hide: all;">${preview}</div>

        ${LOGO_HEADER}

        <p style="font-size: 16px;">Hi ${e(firstName)},</p>

        <p style="font-size: 16px;">Welcome to PairForm.</p>

        <p style="font-size: 16px;">Forming groups usually means spreadsheets, endless messages, and someone always ending up in the wrong place. PairForm replaces that. You set the rules, share one link, and participants place themselves in the spots that fit, within the limits you set.</p>

        <h2 style="font-size: 18px; font-weight: 700; color: #111; margin: 30px 0 16px;">Get your first group live in 4 steps:</h2>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">${steps}
        </table>

        <div style="margin: 28px 0; text-align: center;">
          <a href="${SITE_URL}/create-event" style="background-color: #1449b2; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 999px; font-weight: 700; font-size: 16px; display: inline-block;">Create your first event &rarr;</a>
        </div>

        <h2 style="font-size: 18px; font-weight: 700; color: #111; margin: 30px 0 12px;">Popular ways to use PairForm:</h2>

        <ul style="font-size: 16px; padding-left: 22px; margin: 0 0 20px;">${useCases}</ul>

        <p style="font-size: 16px;">Not sure how to set up your use case? <a href="${SITE_URL}/#use-cases" style="color: #1449b2; font-weight: 700; text-decoration: none;">Check the guide &rarr;</a> for guides and examples.</p>

        <p style="font-size: 16px;">Thanks for choosing PairForm.</p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 20px;" />

        <p style="font-size: 14px; color: #666; margin: 0;">
          ${e(WELCOME_SENDER_NAME)}<br/>
          <strong>PairForm</strong><br/>
          <span style="font-style: italic; color: #888;">Smart automated balancing. Fair groups. Zero chaos.</span>
        </p>
      </div>
    `,
  };
};

export const getPairingEmail = (
  eventName: string,
  participantName: string,
  matchName: string,
  isSecretSanta: boolean,
  matchDetails?: string,
  link: string = "https://pair-form.com"
) => {
  const typeText = isSecretSanta ? "Secret Santa Match" : "Pairing Result";
  const actionText = isSecretSanta ? "gifting to" : "paired with";

  return {
    from: EMAIL_SENDERS.NOTIFY,
    subject: `${typeText}: ${eventName}`,
    html: `
      <div style="font-family: sans-serif; color: #333;">
        ${LOGO_HEADER}
        <h1>${e(eventName)} Results</h1>
        <p>Hi ${e(participantName)},</p>
        <p>The pairings have been generated!</p>
        <div style="padding: 20px; background-color: #f5f5f5; border-radius: 5px; margin: 20px 0;">
          <p style="font-size: 18px; margin: 0;">You are ${actionText}: <strong>${e(matchName)}</strong></p>
          ${
            matchDetails
              ? `<p style="margin-top: 10px; color: #666;">Details: ${e(matchDetails)}</p>`
              : ""
          }
        </div>
        <p><a href="${e(link)}">View your pairing online</a></p>
        <p style="color: #666; font-size: 13px;">This link is private to you. Please do not share it.</p>
        <br/>
        <p>Best,<br/>The Pair Form Team</p>
      </div>
    `,
  };
};

export const getRoleAssignedEmail = (
  eventName: string,
  participantName: string,
  groupNumber: number | string,
  role?: string,
  privateLink?: string
) => {
  const groupLabel =
    typeof groupNumber === "string" &&
    (groupNumber.toLowerCase().startsWith("group") ||
      groupNumber.toLowerCase().startsWith("pair") ||
      groupNumber.toLowerCase().startsWith("table") ||
      groupNumber.toLowerCase().startsWith("position") ||
      groupNumber.toLowerCase().includes("pool"))
      ? groupNumber
      : `Group ${groupNumber}`;

  return {
    from: EMAIL_SENDERS.NOTIFY,
    subject: `You're in! Group Assignment for ${eventName}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        ${LOGO_HEADER}

        <h1 style="color: #111; font-size: 24px; font-weight: 700;">Hi ${e(participantName)},</h1>
        
        <p style="font-size: 16px;">Thanks for completing the form, you’ve been successfully added to the group on <strong>PairForm</strong></p>
        
        <p style="font-size: 16px;">Your information has been received and saved, and you’re now part of the <strong>${e(eventName)}</strong> grouping process.</p>
        
        <div style="padding: 20px; background-color: #e6f7ff; border: 1px solid #91d5ff; border-radius: 6px; margin: 25px 0; text-align: center;">
          <p style="font-size: 18px; margin: 0; color: #0050b3;"><strong>${e(groupLabel)}</strong></p>
          ${
            role
              ? `<p style="font-size: 16px; margin-top: 5px; color: #333;">Role: <strong>${e(role)}</strong></p>`
              : ""
          }
        </div>
        
        ${
          privateLink
            ? `<p style="font-size: 16px; text-align: center;"><a href="${e(privateLink)}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View your assignment</a></p><p style="font-size: 13px; color: #666; text-align: center;">This link is private to you. Please do not share it.</p>`
            : ""
        }

        <h3 style="font-size: 18px; font-weight: 600; margin-top: 30px;">What happens next?</h3>
        
        <ul style="list-style: none; padding: 0;">
          <li style="margin-bottom: 12px; display: flex; align-items: flex-start;">
            <span style="color: #3b82f6; font-size: 20px; margin-right: 12px; line-height: 1;">&bull;</span>
            <span style="padding-top: 2px;">The organizer will complete participant collection</span>
          </li>
          <li style="margin-bottom: 12px; display: flex; align-items: flex-start;">
            <span style="color: #3b82f6; font-size: 20px; margin-right: 12px; line-height: 1;">&bull;</span>
            <span style="padding-top: 2px;">Groups will be finalized automatically</span>
          </li>
          <li style="margin-bottom: 12px; display: flex; align-items: flex-start;">
            <span style="color: #3b82f6; font-size: 20px; margin-right: 12px; line-height: 1;">&bull;</span>
            <span style="padding-top: 2px;">You’ll receive an update or shared link once everything is ready</span>
          </li>
        </ul>

        <p style="font-size: 16px; margin-top: 30px;">If you need to update your details or have questions, please reach out to the organizer directly.</p>
        
        <p style="font-size: 16px;">Thanks for taking part — we’re excited to have you involved!</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;" />
        
        <p style="font-size: 14px; color: #666;">
          Best,<br/>
          <strong>The PairForm Team</strong><br/>
          <span style="font-style: italic; color: #888;">Simple. Fair. Stress-free grouping.</span>
        </p>
      </div>
    `,
  };
};

export const getGroupCompleteEmail = (
  shareLink: string,
  groupName: string,
  participants: { name?: string; role?: string; track?: string }[]
) => {
  const membersList = participants
    .map(
      (p) =>
        `<li style="margin-bottom: 8px; color: #333;"><strong>${e(p.name)}</strong>${
          p.role || p.track
            ? `  <span style="color: #666;">(${e(p.role || p.track)})</span>`
            : ""
        }</li>`
    )
    .join("");

  return {
    from: EMAIL_SENDERS.NOTIFY,
    subject: `Your group is complete: ${groupName}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        ${LOGO_HEADER}

        <h1 style="color: #111; font-size: 24px; font-weight: 700;">Great news 👏</h1>
        
        <p style="font-size: 16px;">All participants have successfully joined <strong>${e(groupName)}</strong> your group is now complete!</p>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
          <h3 style="margin-top: 0; font-size: 18px; color: #111;">Group Members:</h3>
          <ul style="padding-left: 20px; margin-bottom: 0;">
            ${membersList}
          </ul>
        </div>
        
        <p style="font-size: 16px;">Everything is locked in and ready to go. You can view the full dashboard using the link below:</p>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${e(shareLink)}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">🔗 View & share your group</a>
        </div>
        
        <p style="font-size: 16px;">Best of luck — and have a great session!</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;" />
        
        <p style="font-size: 14px; color: #666;">
          —<br/>
          <strong>The PairForm Team</strong><br/>
          <span style="font-style: italic; color: #888;">Fair groups. Zero stress.</span>
        </p>
      </div>
    `,
  };
};

export const getRoundNotificationEmail = (
  eventName: string,
  participantName: string,
  roundNumber: number,
  tableNumber: number,
  partnerNames: string,
  groupLink: string = "https://pair-form.com"
) => {
  const tableDisplay = tableNumber === 0 ? "Solo / Floating Facilitator" : `Table ${tableNumber}`;

  return {
    from: EMAIL_SENDERS.NOTIFY,
    subject: `Round ${roundNumber} Assignment: ${eventName}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        ${LOGO_HEADER}

        <h1 style="color: #111; font-size: 24px; font-weight: 700;">Hi ${e(participantName)},</h1>
        
        <p style="font-size: 16px;">Round <strong>${e(roundNumber)}</strong> for <strong>${e(eventName)}</strong> has started!</p>
        
        <div style="padding: 20px; background-color: #e6f7ff; border: 1px solid #91d5ff; border-radius: 8px; margin: 25px 0; text-align: center;">
          <p style="font-size: 20px; margin: 0; color: #0050b3;"><strong>${e(tableDisplay)}</strong></p>
          ${partnerNames ? `<p style="font-size: 16px; margin-top: 8px; color: #333;">Partner(s): <strong>${e(partnerNames)}</strong></p>` : ""}
        </div>
        
        <p style="font-size: 15px;">Please head over to your assigned table for this round. You can view your new grouping & live schedule below:</p>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${e(groupLink)}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
            🔗 View Your New Grouping & Table
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;" />
        
        <p style="font-size: 14px; color: #666;">
          Best,<br/>
          <strong>The PairForm Team</strong><br/>
          <span style="font-style: italic; color: #888;">Simple. Fair. Stress-free networking.</span>
        </p>
      </div>
    `,
  };
};

export const getPrivateLinkEmail = (eventName: string, participantName: string, link: string) => {
  return {
    from: EMAIL_SENDERS.NOTIFY,
    subject: `Your private link for ${eventName}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        ${LOGO_HEADER}
        <h1 style="color: #111; font-size: 22px; font-weight: 700;">Hi ${e(participantName)},</h1>
        <p style="font-size: 16px;">Here is your private link for <strong>${e(eventName)}</strong>. Use it to view your assignment at any time.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${e(link)}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">View my assignment</a>
        </div>
        <p style="font-size: 13px; color: #666;">This link is private to you. Please do not share it. If you did not request it, you can ignore this email.</p>
        <p style="font-size: 14px; color: #666;">Best,<br/><strong>The PairForm Team</strong></p>
      </div>
    `,
  };
};

export const getOrgInviteEmail = (orgName: string, role: string, inviteLink: string) => {
  return {
    from: EMAIL_SENDERS.NOTIFY,
    subject: `You've been invited to join ${orgName} on PairForm`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        ${LOGO_HEADER}
        <h2 style="color: #1e293b;">Organization Invitation</h2>
        <p>You have been invited to join <strong>${e(orgName)}</strong> on PairForm as a <strong>${e(role)}</strong>.</p>
        <p style="margin: 24px 0;">
          <a href="${e(inviteLink)}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Accept Invitation</a>
        </p>
        <p style="color: #64748b; font-size: 14px;">If you do not have an account, clicking the link will let you sign up with this email.</p>
      </div>
    `,
  };
};

export const getPasswordResetCodeEmail = (code: string, name: string, minutes: number) => {
  return {
    from: EMAIL_SENDERS.SUPPORT,
    subject: `${code} is your PairForm password reset code`,
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        ${LOGO_HEADER}

        <h1 style="color: #111; font-size: 22px; font-weight: 700;">Hi${name ? ` ${e(name)}` : ""},</h1>
        <p style="font-size: 16px;">We received a request to reset the password for your PairForm account. Enter this code on the reset screen:</p>

        <div style="margin: 28px 0; text-align: center;">
          <span style="display: inline-block; font-size: 34px; font-weight: 700; letter-spacing: 10px; color: #0c3886; background-color: #eef4ff; border: 1px solid #c7d9ff; border-radius: 12px; padding: 16px 28px;">${e(code)}</span>
        </div>

        <p style="font-size: 15px;">The code works for ${minutes} minutes and can be used once.</p>
        <p style="font-size: 14px; color: #666;">If you did not ask to reset your password, you can ignore this email. Your password will not change.</p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 36px 0;" />
        <p style="font-size: 14px; color: #666;">
          Best,<br/>
          <strong>The PairForm Team</strong>
        </p>
      </div>
    `,
  };
};
