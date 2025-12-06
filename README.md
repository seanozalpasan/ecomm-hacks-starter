<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./static/darkmode.png">
  <source media="(prefers-color-scheme: light)" srcset="./static/lightmode.png">
  <img alt="Ecomm Hacks Banner" src="./static/lightmode.png">
</picture>

# Unwrappd

### Team Name

Jumbos

### Team Members

- Tika Capon
- Winston Hsiao
- Sean Ozalpasan
- Shane Sidman

### Demo

- **Live URL:** https://unwrappd.vercel.app/
- **Demo Video:** [YouTube/Loom link if applicable]

### What We Built

We built a website for groups of friends, coworkers, or family to get together and organize convenient, personalized gift giving.

### How It Works

We support users signing up, adding their interests, and creating or joining games with their friends. Once everyone is ready you will be assigned the person you are buying a gift for.

We use Gemini 2.5 Flash for basic text completions to generate general suggestion categories/queries. Then using those gift categories/queries we use Exa's search API to get real URLs for products

[Brief explanation of your architecture and how you're using Nano Banana Pro and Gemini 3 Pro]

### Key Features

- [Feature 1]
- [Feature 2]
- [Feature 3]

### Tech Stack

- **Frontend:** Next.js, React, Typescript
- **Backend:** Node (Typescript) as apart of Next.js deployed on vercel
- **Models:** Nano Banana Pro, Gemini 3 Pro, Gemini 2.5 Flash
- **Other:** [Exa](https://exa.ai/), [Firecrawl](https://www.firecrawl.dev/)

### Setup Instructions

```bash
# How to run your project locally
pnpm install
pnpm run dev
```

### Screenshots

![Demo](https://github.com/seanozalpasan/unwrappd/blob/main/public/images/DemoImage.png)

1.
2. ...
3. ...

### Challenges We Faced

We faced difficulties with search grounding related and properly crawling/scraping images from the product pages. Search results and grounding with real products was improved through iterations in our gift search/suggestion pipeline. Accurately scraping real product images from the URLs found was flaky.

### What's Next

[If you had more time, what would you add?]

**Getting Access:**

1. **Set up your Google Cloud billing account**

   - Go to [Google AI Studio](https://aistudio.google.com) or [Vertex AI](https://console.cloud.google.com/vertex-ai)
   - Create or link a Google Cloud project
   - Enable billing (credit card required)

2. **Apply your $100 GCP credit**
   - Each team receives $100 in GCP credits
   - Credits will be distributed at the start of the hackathon
   - This covers approximately 745 2K images or 416 4K images

**Pricing:**

- 2K image: $0.134 each
- 4K image: $0.24 each

**Resources:**

- [Nano Banana Pro Documentation](https://ai.google.dev/gemini-api/docs/image-generation)
- [Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- [Google Cloud Billing Setup](https://docs.cloud.google.com/billing/docs/how-to/create-billing-account)

**What we're looking for:**

1. **Solves a real problem** - Does this address something ecommerce businesses actually struggle with?
2. **Works well** - Is the execution solid? Does it deliver on what it promises?
3. **Creative use of the tools** - Are you using Nano Banana Pro and Gemini 3 Pro in interesting ways?
4. **Glitz, glam, gl-polished user interfaces** ✨ - Because it’s ecommerce, we ascribe a lot of value to excellent user experience. An obvious idea, executed extraordinarily well, in a useful/novel form factor ≥ an ambitious idea that leaves a lot to the imagination.

**A note on obvious ideas:**

Virtual try-on, background replacement, and basic product photography tools are the most straightforward applications of Nano Banana Pro. If you're building one of these, you're competing against what everyone else will think of first. To win with an obvious idea, your execution needs to be exceptional—not just functional, but genuinely better than existing solutions. We're looking for creativity.

Here are the other obvious ones:

**Image generation:**

- Virtual try-on
- Background replacement
- Product photography
- Marketing visuals/ad creative

**Text/chat:**

- Customer service/product guidance chatbot
- Product description generator
- Marketing copy writer
- Review summarizer

Maybe also:

- Visual search (upload image, find similar products)
- Size recommendation tool

You might make one of these more interesting by:

- Combining two or more obvious ideas into a unified experience, e.g. E2E rich marketing campaign generator, deep research for product reviews
- Putting one of these in an interesting form factor, e.g. iOS App Clip, Apple TV app, Web Component, PoS/kiosk

**What you need to deliver:**

- **GitHub repo with your code** - Fork this repository and fill out the submission template below with your project details
- **Live demo** - Hosted URL or demo video showcasing your tool in action
- **Presentation** - You'll present your project to the group at the end of the 24 hours (5-7 minutes)

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
