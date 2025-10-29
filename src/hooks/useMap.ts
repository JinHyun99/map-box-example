"use client";
import mapboxgl from "mapbox-gl";
import { useRef, useState, useEffect } from "react";

mapboxgl.accessToken = `${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`;

export const useMap = () => {
  const map = useRef<mapboxgl.Map | null>(null);
  const mapContainer = useRef<HTMLDivElement | null>(null);
  // 서울 기준으로 수정
  const [lng, setLng] = useState(126.9779692);
  const [lat, setLat] = useState(37.566535);
  const [zoom, setZoom] = useState(18);
  const [pitch, setPitch] = useState(45);
  const [bearing, setBearing] = useState(0);

  useEffect(() => {
    if (mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: `${process.env.NEXT_PUBLIC_MAPBOX_STYLE}`,
        center: [lng, lat],
        zoom: zoom,
        pitch: pitch,
        bearing: bearing,
        });
    }
  }, [lng, lat, zoom, pitch, bearing]);

  return { map, mapContainer };
};