import { getFestivalContent, defaultFestivalHeading } from "@/lib/festival-content";
import { festivalEvents } from "@/lib/festival-events";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return Response.json(await getFestivalContent(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Unable to load festival event content", error);
    return Response.json({ heading: defaultFestivalHeading, events: festivalEvents }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
