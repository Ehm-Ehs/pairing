import {
  COMPANY,
  EVENT_RETENTION_MONTHS,
  MINIMUM_AGE,
  ORG_DELETION_WORKING_DAYS,
  type LegalDocumentContent,
} from "./index";

export const PRIVACY_POLICY: LegalDocumentContent = {
  title: "Privacy Policy",
  intro:
    "PairForm helps people run events that need pairing or grouping: Secret Santa draws, team and group allocation, and speed networking rounds. This policy explains what personal information we collect, why we collect it, and the choices you have.",
  sections: [
    {
      title: "1. Who we are",
      blocks: [
        `PairForm is run by ${COMPANY.name}, based in ${COMPANY.location}. In this policy "PairForm", "we" and "us" mean ${COMPANY.name}.`,
        `You can reach us about anything in this policy at ${COMPANY.email}.`,
      ],
    },
    {
      title: "2. Who this policy covers",
      blocks: [
        {
          list: [
            "**Organizers.** People who create an account to set up and run events.",
            "**Organization members.** People invited to a team account so they can create events for that organization.",
            "**Participants.** People who join an event through a link an organizer shared. Participants do not need an account.",
          ],
        },
        "When an organizer runs an event, the organizer decides who is invited and what details the join form asks for. We hold participant details on the organizer's behalf. If you are a participant and have a question about why you were added to an event, the organizer is the best first contact. You can also write to us.",
      ],
    },
    {
      title: "3. What we collect",
      blocks: [
        { label: "From organizers and organization members" },
        {
          list: [
            "Your name and email address.",
            "Your password, if you sign up with email. It is stored in scrambled form and we cannot read it.",
            "Your Google name, email address and profile picture, if you sign in with Google.",
            "Your phone number, if you add one.",
            "The events you create, including titles, descriptions, images, dates, groups and settings.",
            "Your organization's name, logo, colours and member list, if you set up an organization.",
            "Your token balance and a record of tokens granted, bought and spent.",
          ],
        },
        { label: "From participants" },
        {
          list: [
            "Your name.",
            "Your email address or phone number, depending on how the organizer chose to deliver results.",
            "Any other details the organizer's join form asks for, such as a group, team or preference.",
            "Your result, meaning who or which group you were matched with.",
          ],
        },
        { label: "About payments" },
        {
          list: [
            "Payments are handled by Paystack. We never see or store your card number.",
            "We keep the payment reference, the amount, the token pack bought, the date and whether the payment succeeded.",
          ],
        },
        { label: "Collected automatically" },
        {
          list: [
            "Your IP address, used to stop abuse such as repeated sign-up or join attempts.",
            "Basic device and browser information.",
            "How you use the site, such as pages visited, clicks and scrolling. This is collected through Microsoft Clarity and helps us find and fix problems.",
            "Whether an email or WhatsApp message we sent was delivered.",
          ],
        },
      ],
    },
    {
      title: "4. How we use your information",
      blocks: [
        {
          list: [
            "To create and secure your account, and to sign you in.",
            "To run events: collecting sign-ups, making the draw or allocation, and showing results.",
            "To send messages that are part of the service. These include welcome emails, password reset codes, organization invitations, and each participant's result or private link by email or WhatsApp.",
            "To take payments and add the tokens you bought to your balance.",
            "To keep the service safe, including limiting repeated attempts and investigating misuse.",
            "To understand how the site is used so we can fix problems and improve it.",
            "To meet legal obligations, such as keeping payment records.",
          ],
        },
        "We do not sell personal information. We do not use participant details for advertising, and we do not send participants marketing messages.",
        { label: "Our legal reasons for using your information" },
        {
          list: [
            "**To provide the service you asked for.** This covers accounts, events, messages and payments.",
            "**Our legitimate interests.** This covers security, preventing abuse and improving the product.",
            "**Your consent.** This applies where we ask for it. You can withdraw consent at any time.",
            "**Legal obligations.** This covers financial and tax records.",
          ],
        },
      ],
    },
    {
      title: "5. Who we share it with",
      blocks: [
        "We share information only with the companies that help us run PairForm, and only what each one needs.",
        {
          list: [
            "**Google Firebase.** Stores accounts and event data, and handles sign-in.",
            '**Google.** Handles sign-in if you choose "Continue with Google".',
            "**Paystack.** Processes payments.",
            "**Resend.** Sends our emails.",
            "**Meta (WhatsApp).** Sends WhatsApp messages when an organizer chooses WhatsApp delivery.",
            "**Microsoft Clarity.** Shows us how the site is used.",
            "**Netlify.** Hosts the website.",
          ],
        },
        "We may also share information if the law requires it, or to protect the rights and safety of our users or of PairForm. If PairForm is ever sold or merged, your information may move to the new owner under the same protections.",
      ],
    },
    {
      title: "6. What other people can see",
      blocks: [
        {
          list: [
            "**Organizers see their participants.** The organizer of an event can see the name, contact details and result of everyone who joined it.",
            "**Organization admins see their organization's events.** Admins can see every event created inside their organization, including participant lists.",
            "**Results pages.** For group and speed networking events, anyone with the event's results link can see participant names and their groups or pairings. They do not see email addresses or phone numbers.",
            "**Secret Santa stays private.** Each participant gets a private link that shows only their own match. Only the participant and the organizer's event tools can reach it.",
          ],
        },
        "Anyone who has an event link can open it, so share links only with the people who should see them.",
      ],
    },
    {
      title: "7. How long we keep it",
      blocks: [
        {
          list: [
            "**Account details.** Kept for as long as your account exists.",
            `**Events and participant details.** Kept until the organizer deletes the event or their account. Events that have had no activity for ${EVENT_RETENTION_MONTHS} months are deleted automatically.`,
            "**Token and payment records.** Kept after an account or organization is deleted, because we need them for accounting, tax and resolving payment disputes.",
            "**Password reset codes.** Expire after 15 minutes.",
            "**Security records.** Records used to limit repeated attempts are short-lived and removed once they are no longer needed.",
          ],
        },
      ],
    },
    {
      title: "8. Deleting your account or organization",
      blocks: [
        { label: "If you have a personal account" },
        "You can delete your account in Settings. Your profile, your events and the participant details in those events are permanently deleted. Your token and payment records are kept, as explained in section 7.",
        { label: "If you belong to an organization" },
        "Your own profile is deleted. Events you created inside the organization belong to the organization, so they stay there and pass to its admins. They are removed only when the organization deletes them or is itself deleted.",
        { label: "If you delete an organization" },
        `An admin can ask for the organization to be deleted. Its events, participant details, branding and member list are permanently deleted ${ORG_DELETION_WORKING_DAYS} working days after the request. This waiting period gives the organization time to change its mind or export what it needs. The organization's token and payment records are kept.`,
        { label: "If you are a participant" },
        `Ask the organizer to remove you from the event, or write to us at ${COMPANY.email} and we will do it.`,
      ],
    },
    {
      title: "9. Your rights",
      blocks: [
        "Under the Nigeria Data Protection Act 2023 you have the right to:",
        {
          list: [
            "Ask what personal information we hold about you and receive a copy.",
            "Ask us to correct information that is wrong or incomplete.",
            "Ask us to delete your information.",
            "Object to how we use your information, or ask us to limit it.",
            "Receive your information in a form you can take to another service.",
            "Withdraw consent you previously gave.",
            "Complain to the Nigeria Data Protection Commission if you believe we have mishandled your information.",
          ],
        },
        `To use any of these rights, write to ${COMPANY.email}. We reply within 30 days. We may ask you to confirm your identity first.`,
      ],
    },
    {
      title: "10. How we protect your information",
      blocks: [
        {
          list: [
            "All traffic between your device and PairForm is encrypted.",
            "Passwords and password reset codes are stored in scrambled form.",
            "Sensitive actions, such as payments, draws and changes to token balances, run on our servers and not in your browser.",
            "Each person can reach only the data their role allows.",
            "Repeated attempts to sign in, join or reset a password are limited.",
          ],
        },
        "No online service can promise perfect security. If a breach affects your information, we will tell you and the regulator as the law requires.",
      ],
    },
    {
      title: "11. Children",
      blocks: [
        `Organizers must be at least ${MINIMUM_AGE} years old. Organizers aged ${MINIMUM_AGE} to 17 need permission from a parent or guardian to use PairForm.`,
        "Organizers who add participants under 18, for example for a school event, are responsible for getting permission from a parent, guardian or the school first.",
        "If you believe a child has given us information without that permission, write to us and we will delete it.",
      ],
    },
    {
      title: "12. Where your information is stored",
      blocks: [
        "The companies in section 5 may store and process information on servers outside Nigeria, including in the United States and Europe. We use providers that apply recognised security and data protection standards.",
      ],
    },
    {
      title: "13. Cookies, changes and contact",
      blocks: [
        "**Cookies and similar storage.** We use them to keep you signed in, to remember an event you were setting up before signing in, and to understand how the site is used through Microsoft Clarity. We do not use advertising cookies.",
        "**Changes to this policy.** If we make an important change, we will update the effective date and tell account holders by email or with a notice in the app before the change takes effect.",
        `**Contact.** ${COMPANY.name}, ${COMPANY.location}. Email: ${COMPANY.email}.`,
      ],
    },
  ],
};
