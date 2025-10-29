"use client";
import { useMap } from "@/hooks/useMap";

export default function Home() {
  const { mapContainer } = useMap();

  return (
    <>
      <div ref={mapContainer} style={{ width: "100%", height: "100vh" }} />
    </>
  );
}
