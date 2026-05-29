// One-shot blog seeder.
//
// Inserts 4 categories, 9 tags and 5 published posts directly via Sequelize.
// Idempotent — re-running skips any record whose slug already exists.
//
// Usage (from backend/):  node src/scripts/seedBlog.js

require('dotenv').config();

const { BlogCategory, BlogTag, BlogPost, sequelize } = require('../models');

const slugify = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const readingMinutes = (html) => {
  const text = String(html || '').replace(/<[^>]+>/g, ' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
};

// --- Categories -----------------------------------------------------------
const CATEGORIES = [
  {
    name: 'Income Tax',
    slug: 'income-tax',
    description: 'Personal and corporate income-tax updates, notices and planning.',
    sortOrder: 10,
  },
  {
    name: 'GST',
    slug: 'gst',
    description: 'Goods and Services Tax rates, returns, Council decisions and audits.',
    sortOrder: 20,
  },
  {
    name: 'Compliance & Data',
    slug: 'compliance',
    description: 'DPDP, secretarial filings, ROC, FEMA and other compliance lanes.',
    sortOrder: 30,
  },
  {
    name: 'Litigation & Procedure',
    slug: 'litigation',
    description: 'High Court, Supreme Court, ITAT and tribunal procedure notes.',
    sortOrder: 40,
  },
];

// --- Tags -----------------------------------------------------------------
const TAGS = [
  'Income Tax Act 2025',
  'Budget 2026',
  'GST Council',
  'MSME',
  'DPDP Act',
  'Faceless assessment',
  'Section 43B(h)',
  'TDS',
  'Supreme Court',
];

// --- Posts ----------------------------------------------------------------
// Authors are placeholder names — adjust when real authors join.

const POSTS = [
  {
    title:
      'The Income-tax Act, 2025 is finally live. Here is what salaried taxpayers should actually do this June.',
    slug: 'income-tax-act-2025-salaried-checklist-june-2026',
    categorySlug: 'income-tax',
    tagNames: ['Income Tax Act 2025', 'Budget 2026', 'TDS'],
    authorName: 'CA Rohit Bhardwaj',
    excerpt:
      'The new Act took effect on 1 April 2026 and tax-year filings begin this June. Most of the simplification is real, but a few sections quietly changed how Form 16 lines map back to your return.',
    seoTitle:
      'Income-tax Act 2025: Salaried filing checklist for June 2026 | Profirmo',
    seoDescription:
      'A practical walkthrough of the Income-tax Act 2025 for salaried taxpayers — new section numbers, the tax-year shift, and what changes in your June 2026 return.',
    ogTitle: 'New Income-tax Act 2025: a June filing checklist for the salaried',
    ogDescription:
      'The new Act took effect on 1 April 2026. Here is what changes in your Form 16, your deductions and your filing this assessment.',
    content: `
<p class="lead">The Income-tax Act, 1961 served us — and frustrated us — for 65 years. From 1 April 2026, it is gone. The Income-tax Act, 2025 replaced it on schedule, and the first round of returns under the new framework opens this June.</p>

<p>For most salaried taxpayers the bottom-line number will not change. What changes is the language around it, a handful of section numbers your CA will start quoting, and how the department now talks to you.</p>

<h2>The headline change is the &ldquo;tax year&rdquo;</h2>

<p>The old Act ran on two parallel clocks &mdash; the previous year (when you earned) and the assessment year (when you filed). The 2025 Act collapses both into a single concept: <strong>the tax year</strong>. Income earned between 1 April 2026 and 31 March 2027 is the tax year 2026&ndash;27, and you file for it the same year, the way most other countries already do.</p>

<p>This is not a cosmetic change. It will affect:</p>

<ul>
  <li>How you read your Form 26AS, AIS and the new <em>Annual Tax Statement</em> &mdash; the period header now matches your salary slip year.</li>
  <li>How challans for self-assessment tax are tagged. If your accountant is still writing &ldquo;AY 2026-27&rdquo; on a June challan, that is a CY mismatch and the credit will not reflect cleanly.</li>
  <li>How long the department has to reopen your case. The reassessment window in the 2025 Act is shorter and ties to the tax year, not the assessment year.</li>
</ul>

<h2>Form 16, Part B has a new layout</h2>

<p>If you have already received your Form 16 for FY 2025&ndash;26 (the last year under the old Act), ignore the rest of this section &mdash; you file that one the old way. For salaries paid <em>from</em> 1 April 2026, Part B has been re-arranged to match the new sections:</p>

<ul>
  <li><strong>Standard deduction</strong> sits under <strong>Section 19</strong> of the new Act (was Section 16(ia)).</li>
  <li><strong>HRA exemption</strong> is now under <strong>Section 14</strong> &mdash; the wording is tighter and removes two of the older provisos that nobody could ever parse.</li>
  <li><strong>Professional tax</strong> stays where it always was, conceptually, but the line item is renamed.</li>
</ul>

<p>If you are a payroll head, your TDS software vendor should have pushed the updated mapping by now. If your June payslip still shows the old section labels, that is a flag to raise &mdash; not an end-of-the-world flag, but worth a quick email.</p>

<h2>Section 80C is dead. Long live Schedule VI.</h2>

<p>The hated &ldquo;80C, 80CCC, 80CCD(1), 80CCD(1B), 80D, 80G, 80TTA&rdquo; alphabet soup has been re-organised into a clean <strong>Schedule VI</strong> attached to the new Act. Total deduction limits do not change. What changes is that the schedule is referred to by line number, not section number, in the new ITR forms.</p>

<p>The first time I filed a draft return under the new format, I genuinely missed the muscle memory of typing &ldquo;80C 1,50,000&rdquo;. After three returns I stopped noticing. Your mileage will be the same.</p>

<h2>The new vs old regime question still exists</h2>

<p>This is the part the headlines got wrong in February. The new Act did <em>not</em> abolish the two-regime choice. The default is still the simplified slabs (what we have been calling the &ldquo;new regime&rdquo; since FY 2023&ndash;24), and the old regime survives as an opt-in. The mechanics of opting in have moved to <strong>Section 115BAC</strong>'s successor &mdash; the marginal rate maths is unchanged.</p>

<blockquote>
  If your house-loan interest plus 80C plus a few smaller deductions add up to more than ₹4 lakh in a year, the opt-in regime is probably still better for you. If they do not, default is fine. There is no clever new trick hiding in the 2025 Act.
</blockquote>

<h2>What I would actually do this June</h2>

<ol>
  <li>Wait for your employer's <strong>final Form 16 for FY 2025&ndash;26</strong>. That return is filed under the old Act &mdash; do not let anyone rush you into a &ldquo;new Act&rdquo; ITR for last year's income.</li>
  <li>Reconcile your AIS line-by-line. The first year of any new tax regime always throws a few system mismatches.</li>
  <li>Update your salary-software section references if you run payroll. Do this in June, not September, when half the staff is on leave.</li>
  <li>Re-read your home-loan interest certificate &mdash; the section reference for self-occupied property interest has changed and a couple of banks I have seen are still printing the 1961 section.</li>
</ol>

<p>The 2025 Act is not the end of complexity. It is, mostly, the end of provisos. That alone makes it worth the effort to relearn the section numbers.</p>
`.trim(),
  },

  {
    title:
      'Eight months in, what GST 2.0 actually did to small-business pricing',
    slug: 'gst-2-rate-rationalisation-msme-pricing',
    categorySlug: 'gst',
    tagNames: ['GST Council', 'MSME', 'Budget 2026'],
    authorName: 'CA Pratiksha Iyer',
    excerpt:
      'The 22 September 2025 rate restructuring promised a clean 5 / 18 / 40 slab world. The reality on the GST portal is messier — and most MSME billing software is still mid-migration.',
    seoTitle: 'GST 2.0 rate rationalisation: MSME impact eight months in',
    seoDescription:
      'A practical review of how the 5/18/40 GST slab structure has played out for MSMEs since 22 September 2025 — input-credit mismatches, invoicing fixes and lessons from the field.',
    ogTitle: 'GST 2.0: what eight months of the new slab structure taught MSMEs',
    ogDescription:
      'Eight months after the 22 September 2025 rate cut, here is what actually changed for small-business invoicing, ITC and pricing.',
    content: `
<p class="lead">When the GST Council announced the move to a three-slab structure last September &mdash; 5%, 18% and a 40% &ldquo;sin and luxury&rdquo; band &mdash; most of the WhatsApp commentary was about how clean it would be. Eight months in, the cleanness is real for the consumer. For the MSME owner sending out 200 invoices a month, the picture is more mixed.</p>

<h2>What the rate move actually did</h2>

<p>The 22 September 2025 notification collapsed the old 12% slab into either 5% or 18% depending on the item, and moved a small luxury basket to the new 40% band. The much-feared end-consumer price shock did not materialise, mostly because the items that moved <em>down</em> were the everyday ones (packaged staples, school supplies, generic medicines) and the items that moved <em>up</em> were the ones people buy occasionally.</p>

<p>That much was predicted. What was not predicted, at least not in the news cycle, was the input-credit cliff for businesses that sit at the boundary.</p>

<h2>The boundary problem nobody warned about</h2>

<p>If you sell a product that moved from 12% to 5%, your output liability halved overnight. Wonderful. But the raw materials you used to make that product? Some of those stayed at 18%. Now your accumulated input tax credit grows faster than you can absorb it.</p>

<p>For larger units this is a refund claim. For an MSME with patchy filing history, it is a refund claim that takes months and ties up working capital while it waits.</p>

<p>The three sectors I have seen this hit hardest:</p>

<ul>
  <li><strong>Local FMCG packers</strong> &mdash; output at 5%, packaging material at 18%, freight at 5%. The maths only works at scale.</li>
  <li><strong>Education-content publishers</strong> &mdash; printed material moved to 5% but the digital licensing layer stayed at 18%. Mixed-supply invoices are now a minefield.</li>
  <li><strong>Restaurants that took the composition route</strong> &mdash; nothing changed for them on output, but their suppliers' rate changes are now flowing through.</li>
</ul>

<h2>The billing software is the slow part</h2>

<p>Every accounting platform I work with rolled out an &ldquo;auto-remap&rdquo; tool by October. They all do roughly the same thing &mdash; scan your item master, suggest the new HSN-to-rate mapping, ask you to confirm. The trouble is what they cannot do automatically:</p>

<blockquote>
  Old purchase invoices, already booked at the old rate, that come back as credit notes after 22 September. Your software does not know whether to honour them at the old rate or the new one. The answer is the old rate &mdash; the rate is fixed as of the date of the original supply &mdash; but most platforms will let you cheerfully book it wrong.
</blockquote>

<p>I have had to manually adjust credit-note rates in three client files this quarter. None of the clients had done anything wrong; their software just defaulted to today's rate.</p>

<h2>What to actually check on your June books</h2>

<ol>
  <li><strong>Reconcile your output rate against GSTR-1 line by line for September and October 2025.</strong> The cut-over month is where mismatches hide.</li>
  <li><strong>Check GSTR-2B against your purchase register for the same months.</strong> Vendor side errors are common.</li>
  <li><strong>If you have accumulated ITC, file the refund claim now.</strong> The eight-month window from the date of accumulation is shorter than it sounds.</li>
  <li><strong>Update your e-invoice item master.</strong> Several clients still have a few legacy SKUs sitting on the old 12% rate, which is a cancellation-and-reissue waiting to happen.</li>
</ol>

<h2>Was the rationalisation worth it?</h2>

<p>For the end consumer, yes. The 5% slab is closer to a real consumption tax now, and the everyday basket is genuinely cheaper. For the MSME middle &mdash; the businesses that file every quarter, that do not have a CFO, that learned the old rate table by heart &mdash; this is still a tax compliance year. The pricing benefit will come. The bookkeeping cost is now.</p>

<p>The Council's job was structural. The work of moving the structure through 80 lakh MSME books falls on us. Eight months in, we are perhaps halfway there.</p>
`.trim(),
  },

  {
    title:
      'DPDP rules are notified. What an Indian SaaS founder should fix this quarter.',
    slug: 'dpdp-act-rules-saas-compliance-checklist-2026',
    categorySlug: 'compliance',
    tagNames: ['DPDP Act', 'MSME'],
    authorName: 'Adv. Nikhita Rao',
    excerpt:
      'The Digital Personal Data Protection Act rules are live. For a 20-person SaaS company in Bengaluru, half the compliance is policy work. The other half is plumbing — and that is the part founders are getting wrong.',
    seoTitle: 'DPDP Act rules: practical compliance checklist for SaaS founders',
    seoDescription:
      'A grounded walkthrough of what the notified DPDP rules actually require from a small Indian SaaS company — consent flows, data principal rights, breach reporting and the plumbing nobody mentions.',
    ogTitle: 'DPDP rules are live. A practical checklist for Indian SaaS founders.',
    ogDescription:
      'Consent flows, breach reporting, data principal requests — what a 20-person SaaS team actually has to build this quarter.',
    content: `
<p class="lead">The Digital Personal Data Protection Act was passed in August 2023. The rules that make it operable were notified in stages through late 2025 and early 2026. As of this quarter, every Indian business that processes personal data &mdash; which is to say, every Indian business that has a website &mdash; is on the clock.</p>

<p>I have spent the last four months helping mid-stage SaaS companies get to a sane compliance posture. The pattern is consistent. Founders read the Act, write a privacy policy, and assume they are done. The Act is mostly about the <em>plumbing</em> beneath the policy &mdash; how data flows, who can see it, and how fast you can find it when somebody asks.</p>

<h2>The four things the rules actually require</h2>

<p>Strip out the schedules and the proviso language, and the operative requirements are:</p>

<ol>
  <li><strong>A consent flow that is granular, specific and easy to withdraw.</strong> One checkbox at the bottom of the signup form does not pass.</li>
  <li><strong>A way for a data principal (your user) to ask for their data, ask for correction, and ask for deletion &mdash; and a way for you to respond inside the prescribed window.</strong></li>
  <li><strong>A breach-notification process.</strong> A 72-hour window in most cases &mdash; shorter if you are classified as a Significant Data Fiduciary.</li>
  <li><strong>A retention schedule.</strong> If you do not need the data, you cannot keep it. &ldquo;In case we need it later&rdquo; is no longer a defence.</li>
</ol>

<p>The first two are where the engineering work hides.</p>

<h2>Consent: the &ldquo;just-in-time&rdquo; standard</h2>

<p>The rules do not literally use the phrase &ldquo;just-in-time consent&rdquo;, but the language is functionally identical: consent must be specific to a purpose, taken at the point at which the purpose arises, and presented in clear, plain language.</p>

<p>What this means for a SaaS signup flow:</p>

<ul>
  <li>The signup checkbox can no longer bundle &ldquo;I agree to the terms <em>and</em> agree to marketing emails <em>and</em> agree to product analytics&rdquo;. Those are three purposes; they need three flags, two of which must default to off.</li>
  <li>If you add a new processing purpose six months in &mdash; say, you start using customer data to train a model &mdash; you need a fresh, specific consent for that purpose. You do not get to retro-fit the original signup checkbox.</li>
  <li>The withdrawal mechanism must be as easy as the original consent. A buried &ldquo;email us to opt out&rdquo; link does not pass.</li>
</ul>

<h2>Data-principal requests: the part everyone underestimates</h2>

<p>A user emails you and asks for a copy of all data you hold about them. You have a defined window to respond. How long would it take your team to answer that today, honestly?</p>

<p>For most small SaaS companies, the answer is &ldquo;we would have to ask engineering, and engineering would have to write a script&rdquo;. That is fine the first time. It is not fine the tenth time, and the rules do not give you the option of saying no.</p>

<p>The work to do here is unglamorous: build an internal admin tool that, given a user ID, exports their record from every system that holds it &mdash; the primary database, the analytics warehouse, the support tool, the email platform, the backups. Do it once, properly, and the next 50 requests take 10 minutes each.</p>

<h2>Breach reporting: practise it before you need it</h2>

<p>The 72-hour window assumes you can <em>detect</em> the breach. Most small companies cannot. A leaked S3 bucket goes undetected for weeks not because anyone is incompetent but because no alarm was wired.</p>

<p>The practical first step is the boring one: turn on the cloud-provider breach detection (CloudTrail, GuardDuty, equivalent), point the alerts at a channel a human reads, and write a one-page incident-response runbook. The first time you actually need it should not be the first time you have read it.</p>

<h2>Retention: the cheapest win</h2>

<p>For a small SaaS company, the fastest compliance win is to write down a retention schedule and act on it. Old support tickets, old session logs, old failed-signup records &mdash; if you do not have a reason to keep them, the rules say you should not. Deleting them is a one-day engineering project and it shrinks the surface area of every other obligation in the Act.</p>

<h2>What I would do this quarter</h2>

<p>If I were running a 20-person SaaS company, my next 90 days would look like:</p>

<ul>
  <li><strong>Month 1:</strong> map every system that touches personal data. Publish an internal data-flow diagram. Identify which systems hold what.</li>
  <li><strong>Month 2:</strong> rebuild the consent flow at signup. Build the internal admin tool for data-principal requests. Write the retention schedule.</li>
  <li><strong>Month 3:</strong> table-top the breach-response runbook. Audit one month of consent records to confirm the new flow is producing clean data. Have your privacy notice reviewed by a lawyer who has actually read the rules.</li>
</ul>

<p>None of this is glamorous. All of it is cheaper than the first time you need it and do not have it.</p>
`.trim(),
  },

  {
    title:
      'Faceless assessment in 2026: three procedural gaps that are still tripping taxpayers',
    slug: 'faceless-assessment-procedural-gaps-2026',
    categorySlug: 'litigation',
    tagNames: ['Faceless assessment', 'Income Tax Act 2025'],
    authorName: 'Adv. Saurabh Menon',
    excerpt:
      'Six years after the faceless scheme rolled out, the courts have settled most of the big questions. The three live issues are smaller, more procedural, and easier to lose if you are not paying attention.',
    seoTitle:
      'Faceless assessment 2026: three procedural traps for taxpayers and CAs',
    seoDescription:
      'A practical note on three procedural issues under the faceless assessment scheme — show-cause notices, video-conferencing rights and limitation maths — that taxpayers continue to lose unnecessarily.',
    ogTitle: 'Three procedural gaps in faceless assessment that taxpayers still lose',
    ogDescription:
      'A practical note on the smaller, procedural fights under the faceless scheme — and how to actually win them.',
    content: `
<p class="lead">The faceless assessment scheme has settled into something close to a steady state. The Bombay and Delhi High Courts have answered most of the foundational questions &mdash; about jurisdiction, about the role of the Faceless Assessment Centre, about how natural-justice principles apply to a no-officer process. The big constitutional fights are largely over.</p>

<p>What is left is smaller, more granular, and arguably more important for the taxpayer in front of you. These are the three procedural issues I keep seeing in 2026, and each one of them is winnable if you flag it on time.</p>

<h2>1. The vanishing show-cause notice</h2>

<p>Under the scheme, before a variation can be made to the returned income, a show-cause notice with a draft order must be served. The Act&rsquo;s language is unambiguous: <em>before</em> the variation, not contemporaneously with it.</p>

<p>What we still see is final assessment orders that bake in variations the assessee was never asked to respond to. The departmental defence, when challenged, is usually that the variation was &ldquo;a logical extension&rdquo; of the issue already raised in the section 142(1) notice.</p>

<p>That defence is weaker than it looks. The High Courts have repeatedly held that a logical extension is not a substitute for a specific show-cause. If you have an order in front of you with a head of variation you were never specifically asked about, that head is a clean ground of appeal.</p>

<blockquote>
  Practical tip: when you draft the appeal, do not bury the procedural ground under the substantive ones. The procedural ground is the one most likely to get you a remand at the first hearing, which often resolves the substantive issue in your favour anyway.
</blockquote>

<h2>2. The video-conferencing &ldquo;option&rdquo; that is being treated as a favour</h2>

<p>The scheme provides that an assessee may request a personal hearing, and that the hearing shall be conducted by video conference. It is a right, not a request that the department may consider and decline.</p>

<p>In practice, VC requests are being declined &mdash; sometimes with a one-line order, sometimes silently &mdash; on grounds like &ldquo;the issue is purely factual and does not require a hearing&rdquo;. That reasoning has been struck down by the Madras and Calcutta High Courts more than once. The rule is that if a hearing is requested in a case where a variation prejudicial to the assessee is proposed, the hearing must be granted.</p>

<p>If your VC request has been declined, write back the same day. Cite the scheme, cite the most recent High Court ruling in your jurisdiction, and ask for a fresh hearing. In my experience the response rate to that letter is high &mdash; not always at the assessing-officer level, but certainly at the next review tier.</p>

<h2>3. The limitation maths under the new Act</h2>

<p>This is the one that catches even careful practitioners. The Income-tax Act, 2025 shortened several limitation windows, and the transitional provisions for matters already in the system as of 1 April 2026 are not as crisp as one would like.</p>

<p>The specific scenario to watch:</p>

<ul>
  <li>A notice issued under the 1961 Act, before 1 April 2026.</li>
  <li>An assessment that completes after 1 April 2026.</li>
  <li>A limitation calculation done by the officer that uses the <em>old</em> Act&rsquo;s window because &ldquo;the proceedings originated under the old Act&rdquo;.</li>
</ul>

<p>That calculation is, on most readings of the transitional provisions, wrong. The shorter window of the 2025 Act applies to assessments completed after 1 April 2026, regardless of when the originating notice issued. If your assessment order is dated after that line and the officer has used the old limitation, you have a clean limitation defence.</p>

<h2>Why these matter more than the constitutional fights</h2>

<p>The constitutional questions about faceless assessment have been answered, and they were answered in favour of the scheme. We are not going to undo that. But the day-to-day fights &mdash; whether a particular variation got a specific show-cause, whether a hearing was offered, whether the officer counted days correctly &mdash; are exactly the kind of fights the scheme was designed to remove discretion from. When the system gets them wrong, the High Courts have been consistent about correcting it.</p>

<p>The job of the advocate or CA representing the assessee is to spot these gaps inside the appeal window, not after it. That is, increasingly, the work.</p>
`.trim(),
  },

  {
    title:
      'Section 43B(h) two years on: the MSME-payment rule is finally being audited properly',
    slug: 'section-43b-h-msme-payment-audit-2026',
    categorySlug: 'income-tax',
    tagNames: ['Section 43B(h)', 'MSME', 'TDS'],
    authorName: 'CA Pratiksha Iyer',
    excerpt:
      'When the 45-day MSME payment rule was inserted as Section 43B(h), most buyers treated it as a one-time year-end disallowance puzzle. Audit season FY 2025–26 is the first where the auditors are actually digging.',
    seoTitle:
      'Section 43B(h) audit lessons for FY 2025–26: where buyers go wrong',
    seoDescription:
      'A field note on Section 43B(h) — the MSME 45-day payment rule — and the audit-season pitfalls that buyers, vendors and their accountants are still getting wrong.',
    ogTitle: 'Section 43B(h): audit-season lessons two years in',
    ogDescription:
      'How the MSME 45-day payment disallowance is actually being audited now — and the three mistakes that keep showing up.',
    content: `
<p class="lead">Section 43B(h) was supposed to be the elegant fix. The rule: if you buy from a registered MSME and you do not pay them inside the statutory window &mdash; 15 days where there is no written agreement, or up to 45 days where there is &mdash; the unpaid amount is disallowed as a deduction in the year of accrual. Pay late, lose the deduction. Simple.</p>

<p>Two audit seasons in, the rule is doing its job. The audit work to get there, though, is heavier than anyone expected, and the picture this year shows the same three mistakes again and again.</p>

<h2>Mistake one: treating &ldquo;registered MSME&rdquo; as an honour system</h2>

<p>The disallowance only bites where the supplier is registered as a Micro or Small enterprise. (Medium enterprises do not trigger 43B(h).) Most buyers, for the first year, relied on either a self-declaration from the vendor or a Udyam Registration number printed somewhere on the invoice.</p>

<p>That is not enough now. Auditors are asking for:</p>

<ul>
  <li>A current-year Udyam certificate &mdash; not the one from two years ago, the one that confirms the classification is still Micro or Small.</li>
  <li>A reconciliation of the vendor master against the Udyam portal at the start of every quarter. Registrations get cancelled; reclassifications happen.</li>
  <li>A documented process for what happens when a vendor changes status mid-year.</li>
</ul>

<p>I have seen one client this season disallow ₹38 lakh of payments that turned out to be to vendors whose Udyam registration had lapsed and never been renewed. They paid late, assumed 43B(h) did not apply, and were technically right. They just could not prove it on the date of the audit. The disallowance was reversed, but only after a week of evidence-gathering that should have happened during the year.</p>

<h2>Mistake two: the &ldquo;no written agreement&rdquo; default</h2>

<p>The rule has two windows. Where there is a written agreement between buyer and supplier, the maximum window is 45 days. Where there is not, the window collapses to 15.</p>

<p>For a manufacturing buyer with 400 vendors, &ldquo;is there a written agreement&rdquo; is not a yes-or-no question. There is usually a purchase order, sometimes a master supply agreement, sometimes only an email confirming terms. The MSME Development Act&rsquo;s definition of &ldquo;agreement&rdquo; is broader than most procurement teams realise &mdash; a recurring PO can qualify, even without a separate master.</p>

<p>The audit-friendly position is to document the agreement basis vendor by vendor, at the time of onboarding, and store the supporting document with the vendor master. The audit-hostile position is what most companies still do: argue it case by case after the year has closed.</p>

<h2>Mistake three: paying inside the window but accounting outside it</h2>

<p>This is the one that genuinely surprised me this year. A buyer pays the supplier inside the 45-day window. But the payment is accounted &mdash; cleared, posted, GL-stamped &mdash; only after the year-end cut-off. The auditor's tax disallowance run is keyed off the accounting date, not the bank-debit date.</p>

<p>Strictly speaking, 43B(h) talks about the date of <em>actual payment</em>, which is the bank-debit date, not the date of accounting entry. But if your books say March 28 was the bank date and the bank statement says April 3, you will spend audit-week proving it.</p>

<blockquote>
  Practical tip: reconcile your supplier payment run against the bank statement weekly, not at year-end. The cost is a junior accountant for 30 minutes. The benefit is not having to defend a ₹15 lakh disallowance on a clearly-paid invoice.
</blockquote>

<h2>The vendor side is also waking up</h2>

<p>43B(h) has done something the original drafters perhaps intended and perhaps did not: it has given MSME vendors a real lever. Two years ago an MSME vendor calling a finance team to ask for a payment status was an annoyance. Today, the same call comes with the implicit reminder that the buyer&rsquo;s deduction is at stake. The payment terms conversation has flipped.</p>

<p>I have spoken to three MSME owners this year who have used the rule to negotiate not just for faster payment, but for cleaner credit-period terms going forward. That is the rule working exactly as intended.</p>

<h2>What to fix before the next audit</h2>

<ol>
  <li>Run a vendor-master sweep against the Udyam portal. Today, not in October.</li>
  <li>Document the &ldquo;written agreement&rdquo; status for every active MSME vendor.</li>
  <li>Reconcile bank-debit dates against accounting dates on supplier payments at the end of every month.</li>
  <li>Brief procurement on the rule. Most procurement teams I have met have never actually read 43B(h).</li>
</ol>

<p>None of this is hard. It only feels hard the first time, in audit week, with a partner asking why a ₹2 crore payment is sitting in the disallowance schedule.</p>
`.trim(),
  },
];

// --- Runner ---------------------------------------------------------------

async function run() {
  await sequelize.authenticate();
  console.log('[seedBlog] DB connected.');

  // 1. Categories
  const catBySlug = {};
  for (const data of CATEGORIES) {
    const slug = data.slug || slugify(data.name);
    let row = await BlogCategory.findOne({ where: { slug } });
    if (row) {
      console.log(`[seedBlog] category exists: ${slug}`);
    } else {
      row = await BlogCategory.create({
        name: data.name,
        slug,
        description: data.description || null,
        sortOrder: data.sortOrder || 0,
      });
      console.log(`[seedBlog] created category: ${slug}`);
    }
    catBySlug[slug] = row.id;
  }

  // 2. Tags
  const tagByName = {};
  for (const name of TAGS) {
    const slug = slugify(name);
    let row = await BlogTag.findOne({ where: { slug } });
    if (row) {
      console.log(`[seedBlog] tag exists: ${slug}`);
    } else {
      row = await BlogTag.create({ name, slug });
      console.log(`[seedBlog] created tag: ${slug}`);
    }
    tagByName[name] = row.id;
  }

  // 3. Posts. Publish dates are staggered across May 2026 so the listing
  //    page has a believable feed order.
  const baseDates = [
    new Date('2026-05-26T09:30:00+05:30'),
    new Date('2026-05-21T08:00:00+05:30'),
    new Date('2026-05-15T07:45:00+05:30'),
    new Date('2026-05-09T10:15:00+05:30'),
    new Date('2026-05-03T09:00:00+05:30'),
  ];

  for (let i = 0; i < POSTS.length; i += 1) {
    const p = POSTS[i];
    const existing = await BlogPost.findOne({ where: { slug: p.slug } });
    if (existing) {
      console.log(`[seedBlog] post exists: ${p.slug}`);
      continue;
    }
    const tagIds = (p.tagNames || [])
      .map((n) => tagByName[n])
      .filter(Boolean);
    await BlogPost.create({
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      content: p.content,
      featuredImage: null,
      categoryId: catBySlug[p.categorySlug] || null,
      tagIds,
      authorUserId: null,
      authorName: p.authorName,
      status: 'published',
      publishedAt: baseDates[i] || new Date(),
      seoTitle: p.seoTitle || null,
      seoDescription: p.seoDescription || null,
      ogTitle: p.ogTitle || null,
      ogDescription: p.ogDescription || null,
      ogImage: null,
      readingMinutes: readingMinutes(p.content),
    });
    console.log(`[seedBlog] created post: ${p.slug}`);
  }

  console.log('[seedBlog] done.');
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[seedBlog] failed:', err);
    process.exit(1);
  });
