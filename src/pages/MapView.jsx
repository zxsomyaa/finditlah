import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Loader2, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { db } from "@/lib/db";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
});

const lostIcon = new L.DivIcon({
  html: `<div style="background:#ef4444;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;border:2px solid white;">L</div>`,
  className: "",
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

const foundIcon = new L.DivIcon({
  html: `<div style="background:#0d9488;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;border:2px solid white;">F</div>`,
  className: "",
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

/** @param {string} locationName */
const geocodeLocation = async (locationName) => {
  if (!locationName) return null;

  const query = encodeURIComponent(`${locationName}, Singapore`);

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`
  );

  const data = await res.json();

  if (!data?.[0]) return null;

  return {
    latitude: Number(data[0].lat),
    longitude: Number(data[0].lon),
  };
};

export default function MapView() {
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["items-map"],
    queryFn: async () => {
      const items = await db.entities.Item.list();

      const itemsWithCoords = await Promise.all(
        items.map(async (item) => {
          if (item.latitude && item.longitude) {
            return item;
          }

          const coords = await geocodeLocation(item.location_name);

          if (!coords) return item;

          return {
            ...item,
            latitude: coords.latitude,
            longitude: coords.longitude,
          };
        })
      );

      return itemsWithCoords;
    },
  });

  const filtered = useMemo(() => {
    return items
      .filter((item) => item.latitude && item.longitude)
      .filter((item) => typeFilter === "all" || item.type === typeFilter);
  }, [items, typeFilter]);

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* HEADER */}
      <div className="px-4 py-3 border-b bg-background">
        <div className="flex items-center justify-between mb-2">
          <h1 className="flex items-center gap-2 font-bold text-lg text-foreground">
            <MapPin className="w-5 h-5 text-primary" />
            Map View
          </h1>

          <span className="text-xs text-muted-foreground">
            {filtered.length} items
          </span>
        </div>

        <div className="flex gap-2">
          {["all", "lost", "found"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-full text-xs border transition ${
                typeFilter === t
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border"
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* MAP */}
      <div className="flex-1">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="animate-spin w-6 h-6 text-primary" />
          </div>
        ) : (
          <MapContainer
            center={[1.3521, 103.8198]}
            zoom={12}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />

            {filtered.map((item) => (
              <Marker
                key={item.id}
                position={[Number(item.latitude), Number(item.longitude)]}
                icon={item.type === "lost" ? lostIcon : foundIcon}
              >
                <Popup>
                  <Link to={`/item/${item.id}`} className="block">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-32 h-20 object-cover rounded-md mb-2"
                      />
                    )}

                    <div className="font-semibold text-sm">
                      {item.title}
                    </div>

                    <div className="text-xs text-gray-500">
                      {item.location_name}
                    </div>

                    <div className="text-[10px] text-gray-400 mt-1">
                      {item.type?.toUpperCase()}
                    </div>
                  </Link>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
}