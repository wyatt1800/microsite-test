import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { env } from '@/lib/env';

const leadSchema = z.object({
  firstName: z.string().max(80).optional().default(''),
  lastName: z.string().max(80).optional().default(''),
  email: z.string().email(),
  persona: z.string().max(60).optional().default(''),
});

export const server = {
  captureW9Lead: defineAction({
    input: leadSchema,
    handler: async ({ firstName, lastName, email, persona }) => {
      if (!env.SENDGRID_API_KEY) {
        return { ok: true };
      }

      const sgMail = await import('@sendgrid/mail');
      sgMail.default.setApiKey(env.SENDGRID_API_KEY);

      await sgMail.default.send({
        to: email,
        from: 'hello@w9helper.com',
        subject: 'Your W-9, plus what freelancers need to know about taxes',
        text: buildEmailText(firstName, lastName, persona),
        html: buildEmailHtml(firstName, lastName, persona),
      });

      return { ok: true };
    },
  }),
};

function buildEmailText(firstName: string, lastName: string, persona: string): string {
  const name = [firstName, lastName].filter(Boolean).join(' ') || 'there';
  return [
    `Hi ${name},`,
    '',
    "You just downloaded your W-9 from W9 Helper. Here's a quick summary of what freelancers and contractors need to know about taxes:",
    '',
    '1. A W-9 is not filed with the IRS. You give it to the business or person paying you.',
    "2. If you're paid $600 or more by a client in a year, they'll send you a 1099-NEC at year-end.",
    '3. As a freelancer or contractor, you may owe quarterly estimated taxes. The IRS due dates are April 15, June 15, September 15, and January 15.',
    '4. You can generally deduct legitimate business expenses from your self-employment income.',
    '',
    persona === 'freelancer' || persona === 'gig-worker'
      ? 'Since you identified as a freelancer or gig worker, you might also want to set aside roughly 25-30% of your income for taxes as a rule of thumb.'
      : '',
    '',
    'Have questions? A free consultation with a tax professional can save you stress and possibly money.',
    '',
    'W9 Helper is a free, independent tool. It is not affiliated with, endorsed by, or connected to the IRS or any government agency. This is not tax advice.',
  ].join('\n');
}

function buildEmailHtml(firstName: string, lastName: string, persona: string): string {
  const name = [firstName, lastName].filter(Boolean).join(' ') || 'there';
  const freelancerNote =
    persona === 'freelancer' || persona === 'gig-worker'
      ? `<p>Since you identified as a freelancer or gig worker, you might want to set aside roughly 25–30% of your income for taxes as a rule of thumb.</p>`
      : '';

  return `<!doctype html>
<html>
<head><meta charset="UTF-8" /></head>
<body style="font-family: 'DM Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #0f172a; line-height: 1.7; padding: 24px;">
  <div style="background: #0f1c2e; border-radius: 12px; padding: 24px; margin-bottom: 28px;">
    <span style="font-size: 22px; font-weight: 600; color: #fff;">W9 <span style="color: #93c5fd;">Helper</span></span>
  </div>

  <p>Hi ${name},</p>
  <p>You just downloaded your W-9 from W9 Helper. Here's a quick summary of what freelancers and contractors need to know about taxes:</p>

  <ol style="padding-left: 20px;">
    <li><strong>A W-9 is not filed with the IRS.</strong> You give it to the business or person paying you.</li>
    <li>If you're paid <strong>$600 or more</strong> by a client in a year, they'll send you a 1099-NEC at year-end.</li>
    <li>As a freelancer or contractor, you may owe <strong>quarterly estimated taxes</strong>. Due dates: April 15, June 15, September 15, January 15.</li>
    <li>You can generally deduct <strong>legitimate business expenses</strong> from your self-employment income.</li>
  </ol>

  ${freelancerNote}

  <p>Have questions? A free consultation with a tax professional can save you stress and possibly money.</p>

  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0;" />
  <p style="font-size: 11px; color: #94a3b8;">
    W9 Helper is a free, independent tool. It is not affiliated with, endorsed by, or connected to the IRS or any government agency.
    This is not tax advice. <a href="https://w9helper.com/privacy" style="color: #2563eb;">Privacy policy</a>.
  </p>
</body>
</html>`;
}
