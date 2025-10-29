"use client";
import mapboxgl from "mapbox-gl";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";

mapboxgl.accessToken = `${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`;

export const useMap = () => {
  const map = useRef<mapboxgl.Map | null>(null);
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const moveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastZoomLevelRef = useRef<number>(18);
  const lastCenterRef = useRef<{ lng: number; lat: number } | null>(null);
  // 서울 기준으로 수정
  const [lng, setLng] = useState(126.9779692);
  const [lat, setLat] = useState(37.566535);
  const [zoom, setZoom] = useState(18);
  const [pitch, setPitch] = useState(45);
  const [bearing, setBearing] = useState(0);

  // 맵 로드 완료 시 시각적 피드백
  const onMapLoaded = (mapInstance: mapboxgl.Map) => {
    toast.success("맵이 로드되었습니다!", {
      duration: 2000,
    });
    mapInstance.addControl(new mapboxgl.NavigationControl(), "top-right");
  };

  // 줌 변경 시 시각적 피드백 (스로틀링 적용)
  const onZoomChanged = (mapInstance: mapboxgl.Map) => {
    const currentZoom = mapInstance.getZoom();
    const newZoom = Math.round(currentZoom * 10) / 10;
    setZoom(newZoom);
    
    // 스로틀링: 이전 타임아웃이 있으면 취소
    if (zoomTimeoutRef.current) {
      clearTimeout(zoomTimeoutRef.current);
    }
    
    // 줌 변경 완료 후에만 토스트 표시
    zoomTimeoutRef.current = setTimeout(() => {
      const zoomDiff = Math.abs(newZoom - lastZoomLevelRef.current);
      
      // 줌 레벨이 0.3 이상 변했을 때만 표시 (너무 자주 나오지 않도록)
      if (zoomDiff >= 0.3) {
        let message = `🔍 줌 레벨: ${newZoom}`;
        let description = "";
        
        if (currentZoom > 18.5) {
          message = `🔍 고해상도 모드`;
          description = `줌 레벨: ${newZoom}`;
        } else if (currentZoom < 15) {
          message = `🌍 광역 모드`;
          description = `줌 레벨: ${newZoom}`;
        } else {
          description = `${newZoom}`;
        }
        
        toast(message, {
          description: description,
          duration: 1500,
        });
        
        lastZoomLevelRef.current = newZoom;
      }
    }, 300); // 300ms 후에만 토스트 표시
  };

  // 맵 이동 시 시각적 피드백
  const onMove = (mapInstance: mapboxgl.Map) => {
    const center = mapInstance.getCenter();
    setLng(center.lng);
    setLat(center.lat);
    setBearing(Math.round(mapInstance.getBearing()));
    setPitch(Math.round(mapInstance.getPitch()));
    
    // 스로틀링: 이전 타임아웃이 있으면 취소
    if (moveTimeoutRef.current) {
      clearTimeout(moveTimeoutRef.current);
    }
    
    // 이동 완료 후에만 토스트 표시
    moveTimeoutRef.current = setTimeout(() => {
      const currentCenter = { lng: center.lng, lat: center.lat };
      
      if (lastCenterRef.current) {
        // 이전 위치와의 거리 계산 (대략적인 거리)
        const lngDiff = Math.abs(currentCenter.lng - lastCenterRef.current.lng);
        const latDiff = Math.abs(currentCenter.lat - lastCenterRef.current.lat);
        
        // 일정 거리 이상 이동했을 때만 표시 (너무 자주 나오지 않도록)
        if (lngDiff > 0.001 || latDiff > 0.001) {
          toast.info(`🗺️ 맵 이동`, {
            description: `${currentCenter.lat.toFixed(4)}, ${currentCenter.lng.toFixed(4)}`,
            duration: 1500,
          });
          
          lastCenterRef.current = currentCenter;
        }
      } else {
        // 첫 이동인 경우 저장만 함
        lastCenterRef.current = currentCenter;
      }
    }, 400); // 400ms 후에만 토스트 표시
  };

  // 클릭 시 시각적 피드백
  const onClicked = (e: mapboxgl.MapMouseEvent, mapInstance: mapboxgl.Map) => {
    const features = mapInstance.queryRenderedFeatures(e.point);
    const lng = e.lngLat.lng.toFixed(6);
    const lat = e.lngLat.lat.toFixed(6);
    
    if (features.length > 0) {
      const feature = features[0];
      const featureName = feature.properties?.name || 
                         feature.properties?.title || 
                         feature.layer?.id || 
                         "피처";
      toast.success(`🎯 ${featureName} 클릭`, {
        description: `${lat}, ${lng}`,
        duration: 3000,
      });
    } else {
      toast.info(`📍 맵 클릭`, { 
        description: `${lat}, ${lng}`,
        duration: 3000,
      });
    }
  };

  // 더블 클릭 시 줌 인
  const onDblClick = (e: mapboxgl.MapMouseEvent, mapInstance: mapboxgl.Map) => {
    mapInstance.easeTo({
      center: e.lngLat,
      zoom: mapInstance.getZoom() + 1,
      duration: 500,
    });
    // 줌 변경 이벤트에서 토스트가 표시되므로 여기서는 토스트 제거
  };

  // 맵 초기화
  const initMap = () => {
    if (mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: `${process.env.NEXT_PUBLIC_MAPBOX_STYLE}`,
        center: [lng, lat],
        zoom: zoom,
        pitch: pitch,
        bearing: bearing,
      });

      // 이벤트 리스너 등록
      map.current.on("load", () => onMapLoaded(map.current!));
      map.current.on("zoom", () => onZoomChanged(map.current!));
      map.current.on("move", () => onMove(map.current!));
      map.current.on("click", (e) => onClicked(e, map.current!));
      map.current.on("dblclick", (e) => onDblClick(e, map.current!));

      toast.loading("맵 초기화 중...", {
        duration: 1000,
      });
    }
  };

  useEffect(() => {
    initMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { map, mapContainer };
};