import { COMPANY, MINIMUM_AGE, ORG_DELETION_WORKING_DAYS, type LegalDocumentContent } from "./index";

export const TERMS_OF_SERVICE: LegalDocumentContent = {
  title: "Terms of Service",
  sections: [
    {
      title: "1. Agreeing to these terms",
      blocks: [
        `These terms are an agreement between you and ${COMPANY.name}, which runs PairForm. By creating an account, joining an organization or running an event, you agree to them. If you do not agree, please do not use PairForm.`,
        "If you use PairForm for a company, school or other organization, you confirm that you are allowed to agree to these terms for it.",
      ],
    },
    {
      title: "2. What PairForm does",
      blocks: [
        "PairForm lets organizers collect sign-ups through a shareable link and then pair or group the people who joined. It supports Secret Santa draws, group and team allocation, and speed networking rounds. It can deliver each person's result by email or WhatsApp.",
      ],
    },
    {
      title: "3. Who can use PairForm",
      blocks: [
        {
          list: [
            `You must be at least ${MINIMUM_AGE} years old to create an account.`,
            `If you are ${MINIMUM_AGE} to 17, you need permission from a parent or guardian.`,
            "Participants can join an event without an account.",
          ],
        },
      ],
    },
    {
      title: "4. Your account",
      blocks: [
        {
          list: [
            "Give accurate information when you sign up.",
            "Keep your password private. You are responsible for what happens in your account.",
            `Tell us straight away at ${COMPANY.email} if you think someone else has used your account.`,
            "One person or organization may not create several accounts to collect free tokens more than once.",
          ],
        },
      ],
    },
    {
      title: "5. Organizations",
      blocks: [
        {
          list: [
            "An organization is a shared team account with admins and members.",
            "Members can create events for the organization. Admins can see and manage every event in it.",
            "Events created inside an organization belong to the organization, not to the member who created them. They stay with the organization if that member leaves or deletes their account.",
            "The organization's tokens are shared by its members and are separate from each member's personal tokens.",
            "Admins are responsible for who they invite and for removing people who should no longer have access.",
          ],
        },
      ],
    },
    {
      title: "6. Your responsibilities as an organizer",
      blocks: [
        "When you run an event you bring other people's details into PairForm. You agree that:",
        {
          list: [
            "You have the right to collect and use the details of the people you invite or add.",
            "You have told them their details will be used to run the event and to send them their result.",
            "You will only choose email or WhatsApp delivery for people who expect to hear from you that way.",
            "You have permission from a parent, guardian or school before adding anyone under 18.",
            "You will share event links only with people who should have them, because anyone with a link can open it.",
            "You will remove a participant's details when they ask you to.",
          ],
        },
      ],
    },
    {
      title: "7. Tokens",
      blocks: [
        {
          list: [
            "PairForm uses tokens. Actions such as running a draw or sending results use tokens. The current cost of each action and the price of each pack are shown on the pricing page and before you confirm an action.",
            "New accounts and new organizations receive free tokens to get started.",
            "You can buy more tokens in packs.",
            "Tokens do not expire. Unused tokens stay on your account until you use them.",
            "Tokens have no cash value. They cannot be exchanged for money, sold or transferred to another account.",
            "We may change token costs and pack prices. A change never reduces tokens you already hold.",
          ],
        },
        "**Negative balance.** In some cases PairForm lets an action finish even when you are slightly short of tokens, so an event is not interrupted. Your balance then goes below zero. The amount owed is deducted automatically from the next tokens you buy. For example, if your balance is minus 10 and you buy 100 tokens, your new balance is 90.",
      ],
    },
    {
      title: "8. Payments and refunds",
      blocks: [
        {
          list: [
            "Payments are processed by Paystack. Prices are shown before you pay.",
            "Tokens are added to your balance once Paystack confirms the payment.",
            "**Token packs are not refundable.** Once a pack is bought, the tokens stay on your account for you to use whenever you like. They are not exchanged back for money, whether or not you have used any.",
            `**Duplicate charges are always refunded.** If you are charged twice for the same purchase, write to ${COMPANY.email} with the payment reference and we will refund the extra charge.`,
            "If a payment succeeds but your tokens do not appear, write to us with the payment reference and we will add them.",
            "If a payment is reversed by your bank or card provider, we may remove the tokens that came from it.",
            "Nothing in this section removes rights you have under Nigerian consumer law that cannot be waived.",
          ],
        },
      ],
    },
    {
      title: "9. What you must not do",
      blocks: [
        {
          list: [
            "Send spam or messages people have not agreed to receive.",
            "Add people to an event without a real reason to contact them.",
            "Upload anything illegal, hateful, harassing, sexually explicit or that infringes someone else's rights.",
            "Pretend to be another person or organization.",
            "Try to break into PairForm, get around its limits, overload it or copy its data in bulk.",
            "Try to see a result that is not yours, such as another person's Secret Santa match.",
            "Use PairForm for gambling, lotteries or any draw where people pay for a chance to win.",
          ],
        },
      ],
    },
    {
      title: "10. Messages sent through PairForm",
      blocks: [
        {
          list: [
            "PairForm sends emails and WhatsApp messages for you when you ask it to deliver results or invitations.",
            "You are responsible for the people you choose to message and for what your event title and description say.",
            "Delivery depends on other companies and on the details participants gave. We cannot promise every message arrives. Results are always available through the event's links as well.",
            "We may limit or stop sending for an account that causes complaints or looks like spam.",
          ],
        },
      ],
    },
    {
      title: "11. Your content",
      blocks: [
        {
          list: [
            "You keep ownership of everything you add to PairForm, including event details, images and participant lists.",
            "You give us permission to store, display and send that content only as needed to run the service for you.",
            "You confirm you have the right to use any image or logo you upload.",
            "We may remove content that breaks these terms.",
          ],
        },
      ],
    },
    {
      title: "12. Our content",
      blocks: [
        `The PairForm name, logo, design and software belong to ${COMPANY.name}. You may use PairForm for your events. You may not copy, resell or build a competing product from it.`,
      ],
    },
    {
      title: "13. Availability and changes to the service",
      blocks: [
        "We work to keep PairForm running, but we do not promise it will always be available or free of errors. We may add, change or remove features. If we remove something you paid for, the tokens you hold stay on your account.",
      ],
    },
    {
      title: "14. Ending your use of PairForm",
      blocks: [
        {
          list: [
            "You can stop at any time and delete your account in Settings. The Privacy Policy explains what is deleted and what is kept.",
            `An organization is deleted ${ORG_DELETION_WORKING_DAYS} working days after an admin asks.`,
            "We may suspend or close an account that breaks these terms, puts other users at risk or is used for fraud. Where we reasonably can, we will warn you first and give you a chance to put things right.",
            "Unused tokens are not refunded when an account is closed, whether by you or for breaking these terms.",
          ],
        },
      ],
    },
    {
      title: "15. No guarantees",
      blocks: [
        'PairForm is provided "as is". Draws and allocations are made automatically from the settings and details the organizer provides. We do not guarantee that a result will suit every participant, and we are not responsible for the events themselves, for gifts, or for anything agreed between organizers and participants.',
      ],
    },
    {
      title: "16. Limit on our liability",
      blocks: [
        "To the extent the law allows:",
        {
          list: [
            "We are not liable for indirect losses, such as lost profit, lost data or a spoiled event.",
            "Our total liability to you for any claim is limited to the amount you paid us in the 12 months before the claim.",
          ],
        },
        "Nothing in these terms limits liability that cannot be limited by law, such as liability for fraud.",
      ],
    },
    {
      title: "17. Governing law and disputes",
      blocks: [
        `These terms are governed by the laws of the Federal Republic of Nigeria. If there is a problem, please write to ${COMPANY.email} first so we can try to resolve it. If we cannot, the courts of Nigeria will decide the dispute.`,
      ],
    },
    {
      title: "18. Changes to these terms and contact",
      blocks: [
        "We may update these terms. If a change is important, we will tell account holders by email or with a notice in the app before it takes effect. Continuing to use PairForm after that date means you accept the new terms.",
        `${COMPANY.name}, ${COMPANY.location}. Email: ${COMPANY.email}.`,
      ],
    },
  ],
};
