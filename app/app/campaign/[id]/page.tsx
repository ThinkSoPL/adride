import { CampaignMapServer } from '@/features/campaign-map/CampaignMapServer';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <main className="h-screen w-screen relative">
      <CampaignMapServer campaignId={id} />
    </main>
  );
}
