"use client";
import { APIProvider } from "@vis.gl/react-google-maps";
import { ReactNode } from "react";

export default function GoogleAPIProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_API_KEY!}>
      {children}
    </APIProvider>
  );
}
