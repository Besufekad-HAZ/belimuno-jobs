"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  useEffect(() => {
    if (id) router.replace(`/en/client/jobs/${id}/applications`);
    else router.replace("/en");
  }, [id, router]);

  return null;
}
