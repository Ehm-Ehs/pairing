"use client";
import React, { useEffect, useState, Suspense } from "react";
import Result from "./_components/Result";
import { fetchUserData } from "../../src/services/endpoints";
import { GroupingsPageProps } from "../../src/types";

export default function ResultPage() {
  const [data, setData] = useState<GroupingsPageProps | null>(null);

  useEffect(() => {
    fetchUserData(setData);
  }, []);

  return (
    <Suspense fallback={<div>Loading result...</div>}>
      <Result data={data} />
    </Suspense>
  );
}
