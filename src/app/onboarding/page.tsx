import { redirect } from 'next/navigation';
// import { getOnboardingStatus } from '@/actions/company';

export default async function OnboardingPage() {
  // const status = await getOnboardingStatus();
  // redirect(`/onboarding/${status?.step ?? 'company'}`);
  redirect('/onboarding/company');
}
