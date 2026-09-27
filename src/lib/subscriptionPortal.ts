// Stripe's no-code Customer Portal login link supports prefilled_email to
// skip the customer having to retype an email it already knows -- Stripe
// still emails a real one-time login link to that address, so this is a
// convenience, not an auth bypass. See docs.stripe.com/no-code/customer-portal.
// Verified live 2026-09-27: the field pre-fills correctly; the follow-up
// email click-through is Stripe's own security step, not something this
// parameter was ever meant to skip.
export const MANAGE_SUBSCRIPTION_URL = "https://buyer.americaspay.com/p/login/bJe4gz9tjbuTfSa1zL3cc00";

export const manageSubscriptionUrl = (email?: string | null) =>
  email
    ? `${MANAGE_SUBSCRIPTION_URL}?prefilled_email=${encodeURIComponent(email)}`
    : MANAGE_SUBSCRIPTION_URL;
