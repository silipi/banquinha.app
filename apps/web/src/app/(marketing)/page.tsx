import type { Metadata } from 'next';
import { Audience } from './_components/Audience';
import { ExampleStores } from './_components/ExampleStores';
import { Faq } from './_components/Faq';
import { Features } from './_components/Features';
import { FinalCta } from './_components/FinalCta';
import { Hero } from './_components/Hero';
import { HowItWorks } from './_components/HowItWorks';
import { LatestPosts } from './_components/LatestPosts';
import { Pricing } from './_components/Pricing';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <Audience />
      <HowItWorks />
      <Features />
      <ExampleStores />
      <Pricing />
      <Faq />
      <LatestPosts />
      <FinalCta />
    </>
  );
}
