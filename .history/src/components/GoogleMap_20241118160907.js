import React, { useState, useRef, useEffect } from "react";
import { GoogleMap, LoadScript, Autocomplete, Polyline, Marker, InfoWindow } from "@react-google-maps/api";
import api from "../api"; // API 호출을 위한 모듈

const libraries = ["places"];
const MIN_ZOOM_FOR_MARKERS = 14; // 마커를 표시하기 위한 최소 줌 레벨

export default function GoogleMapPage() {
    const [autocompleteStart, setAutocompleteStart] = useState(null);
    const [autocompleteEnd, setAutocompleteEnd] = useState(null);
    const [path, setPath] = useState([]); // Polyline 경로
    const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.9780 }); // 지도 중심
    const [title, setTitle] = useState(""); // 제목
    const [userId, setUserId] = useState(null); // 사용자 ID
    const [places, setPlaces] = useState([]); // 명소 정보
    const [zoom, setZoom] = useState(12); // 현재 줌 레벨
    const [selectedPlace, setSelectedPlace] = useState(null); // 선택된 명소
    const [markers, setMarkers] = useState([]); // 추가된 마커
    const [memo, setMemo] = useState({}); // 마커별 메모
    const [selectedMarkerIndex, setSelectedMarkerIndex] = useState(null); // 선택된 마커 인덱스
    const polylineRef = useRef(null); // Polyline 참조
    const mapRef = useRef(null); // 지도 참조

    // 로컬 스토리지에서 사용자 ID 가져오기
    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem("user"));
        if (userData) {
            setUserId(userData.id.toString()); // ID를 문자열로 변환
        }
    }, []);

    // 출발지 선택
    const handlePlaceSelectedStart = () => {
        if (autocompleteStart) {
            const place = autocompleteStart.getPlace();
            if (place.geometry) {
                const location = place.geometry.location;
                const latLng = { lat: location.lat(), lng: location.lng() };
                setPath((prevPath) => [latLng, ...prevPath.slice(1)]);
                setMapCenter(latLng); // 지도 중심 이동
            }
        }
    };

    // 도착지 선택
    const handlePlaceSelectedEnd = () => {
        if (autocompleteEnd) {
            const place = autocompleteEnd.getPlace();
            if (place.geometry) {
                const location = place.geometry.location;
                const latLng = { lat: location.lat(), lng: location.lng() };
                setPath((prevPath) => [...prevPath.slice(0, prevPath.length - 1), latLng]);
            }
        }
    };

    // 지도 클릭으로 경로 추가
    const handleMapClick = (event) => {
        const latLng = { lat: event.latLng.lat(), lng: event.latLng.lng() };
        setPath((prevPath) => [...prevPath, latLng]);
    };

    // Polyline 편집 시 경로 업데이트
    const handlePolylineEdit = () => {
        if (polylineRef.current) {
            const updatedPath = polylineRef.current
                .getPath()
                .getArray()
                .map((coord) => ({
                    lat: coord.lat(),
                    lng: coord.lng(),
                }));
            setPath(updatedPath); // 전체 경로 업데이트
        }
    };

    // 명소 정보 가져오기
    const fetchVisiblePlaces = () => {
        if (!mapRef.current) return;

        const bounds = mapRef.current.getBounds();
        if (!bounds) return;

        const service = new window.google.maps.places.PlacesService(mapRef.current);
        const request = {
            bounds,
            type: [],
        };

        if (zoom >= MIN_ZOOM_FOR_MARKERS) {
            if (showRestaurants) request.type.push("restaurant");
            if (showTouristAttractions) request.type.push("tourist_attraction");

            service.nearbySearch(request, (results, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                    setPlaces(results);
                } else {
                    console.error("Places API Error:", status);
                }
            });
        }
    };

    // 마커 드래그 위치 업데이트
    const updateMarkerPosition = (index, position) => {
        setMarkers((prevMarkers) =>
            prevMarkers.map((marker, i) => (i === index ? position : marker))
        );
    };

    // Polyline 경로를 서버로 전송
    const sendPathToServer = async () => {
        if (!userId || !title || path.length < 2) {
            alert("유효한 사용자 ID, 제목 및 경로를 입력하세요.");
            return;
        }

        const payload = {
            pathData: path,
            title,
            userId,
        };

        try {
            console.log("서버로 전송할 데이터:", payload);
            const response = await api.PostPolyLine(payload);
            console.log("서버 응답:", response.data);
            alert("Polyline 정보가 성공적으로 전송되었습니다!");
        } catch (error) {
            console.error("Polyline 정보 전송 실패:", error);
            alert("Polyline 정보 전송 중 오류가 발생했습니다.");
        }
    };

    return (
        <div style={{ height: "100vh", width: "100%", display: "flex", flexDirection: "column" }}>
            <LoadScript googleMapsApiKey="YOUR_API_KEY" libraries={libraries}>
                <div style={{ padding: "10px", backgroundColor: "#f1f1f1", display: "flex" }}>
                    <Autocomplete
                        onLoad={(autocomplete) => setAutocompleteStart(autocomplete)}
                        onPlaceChanged={handlePlaceSelectedStart}
                    >
                        <input
                            type="text"
                            placeholder="출발지 검색"
                            style={{ padding: "10px", marginRight: "10px", width: "200px" }}
                        />
                    </Autocomplete>
                    <Autocomplete
                        onLoad={(autocomplete) => setAutocompleteEnd(autocomplete)}
                        onPlaceChanged={handlePlaceSelectedEnd}
                    >
                        <input
                            type="text"
                            placeholder="도착지 검색"
                            style={{ padding: "10px", marginRight: "10px", width: "200px" }}
                        />
                    </Autocomplete>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="여행 제목을 입력하세요"
                        style={{ padding: "10px", marginRight: "10px", width: "200px" }}
                    />
                    <button
                        onClick={sendPathToServer}
                        style={{
                            padding: "10px 20px",
                            backgroundColor: "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                        }}
                    >
                        서버로 경로 전송
                    </button>
                </div>
                <GoogleMap
                    mapContainerStyle={{ height: "100%", width: "100%" }}
                    center={mapCenter}
                    zoom={zoom}
                    onLoad={(map) => {
                        mapRef.current = map;
                        fetchVisiblePlaces();
                    }}
                    onZoomChanged={() => {
                        if (mapRef.current) {
                            const currentZoom = mapRef.current.getZoom();
                            setZoom(currentZoom);
                            fetchVisiblePlaces();
                        }
                    }}
                    onClick={(event) =>
                        setMarkers((prevMarkers) => [
                            ...prevMarkers,
                            { lat: event.latLng.lat(), lng: event.latLng.lng() },
                        ])
                    }
                >
                    {/* Polyline 렌더링 */}
                    {path.length > 1 && (
                        <Polyline
                            path={path}
                            options={{
                                strokeColor: "#FF0000",
                                strokeOpacity: 1.0,
                                strokeWeight: 2,
                                draggable: true,
                                editable: true,
                            }}
                            onLoad={(polyline) => {
                                polylineRef.current = polyline;
                                const updatedPath = polyline.getPath().getArray().map((coord) => ({
                                    lat: coord.lat(),
                                    lng: coord.lng(),
                                }));
                                setPath(updatedPath); // 초기 상태 동기화
                            }}
                            onMouseUp={handlePolylineEdit}
                        />
                    )}

                    {/* 드래그 가능한 마커 */}
                    {markers.map((marker, index) => (
                        <Marker
                            key={index}
                            position={marker}
                            draggable
                            onDragEnd={(event) => {
                                const newPosition = {
                                    lat: event.latLng.lat(),
                                    lng: event.latLng.lng(),
                                };
                                updateMarkerPosition(index, newPosition);
                            }}
                            onClick={() => setSelectedMarkerIndex(index)}
                        />
                    ))}

                    {/* 선택된 마커의 InfoWindow */}
                    {selectedMarkerIndex !== null && (
                        <InfoWindow
                            position={markers[selectedMarkerIndex]}
                            onCloseClick={() => setSelectedMarkerIndex(null)}
                        >
                            <textarea
                                value={memo[selectedMarkerIndex] || ""}
                                onChange={(e) =>
                                    setMemo((prevMemo) => ({
                                        ...prevMemo,
                                        [selectedMarkerIndex]: e.target.value,
                                    }))
                                }
                                placeholder="메모를 입력하세요"
                                style={{ width: "200px", height: "100px" }}
                            />
                        </InfoWindow>
                    )}

                    {/* 명소 마커 */}
                    {places.map((place, index) => (
                        <Marker
                            key={index}
                            position={place.geometry.location}
                            title={place.name}
                            onClick={() => setSelectedPlace(place)}
                        />
                    ))}
                    {selectedPlace && (
                        <InfoWindow
                            position={selectedPlace.geometry.location}
                            onCloseClick={() => setSelectedPlace(null)}
                        >
                            <div>
                                <h4>{selectedPlace.name}</h4>
                                <p>{selectedPlace.vicinity}</p>
                                {selectedPlace.photos && selectedPlace.photos[0] && (
                                    <img
                                        src={selectedPlace.photos[0].getUrl()}
                                        alt={selectedPlace.name}
                                        style={{ width: "100px", height: "100px" }}
                                    />
                                )}
                            </div>
                        </InfoWindow>
                    )}
                </GoogleMap>
            </LoadScript>
        </div>
    );
}
