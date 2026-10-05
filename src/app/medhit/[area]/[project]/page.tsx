import { redirect } from "next/navigation";

export default async function ProjectIndexPage({
  params,
}: {
  params: Promise<{ area: string; project: string }>;
}) {
  const { area, project } = await params;
  redirect(`/medhit/${area}/${project}/board`);
}
