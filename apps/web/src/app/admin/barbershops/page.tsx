"use client";

import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { Search, Plus, X, Pencil, Images, QrCode, MapPin, Star } from "lucide-react";

interface Barbershop {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  phone?: string;
  email?: string;
  rating: number;
  totalReviews: number;
  isActive: boolean;
  latitude: number;
  longitude: number;
  images?: string[];
  owner?: { firstName: string; lastName: string };
  _count?: { barbers: number; appointments: number };
}

interface GeoResult {
  display_name: string;
  address: { city?: string; town?: string; village?: string; state?: string; road?: string; house_number?: string };
  lat: string;
  lon: string;
}

const EMPTY_FORM = {
  name: "", description: "", address: "", city: "", state: "",
  phone: "", email: "", latitude: "4.6721", longitude: "-74.0447",
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "2-digit" });
}

function validateColPhone(p: string) {
  if (!p) return true;
  return /^(\+57)?3\d{9}$/.test(p.replace(/\s/g, ""));
}
function validateEmail(e: string) {
  if (!e) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export default function BarbershopsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(true);

  // Create/Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Barbershop | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [addressQuery, setAddressQuery] = useState("");
  const [geoResults, setGeoResults] = useState<GeoResult[]>([]);
  const [searchingGeo, setSearchingGeo] = useState(false);

  // QR modal
  const [qrShop, setQrShop] = useState<Barbershop | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);

  // Photos modal
  const [photosShop, setPhotosShop] = useState<Barbershop | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-barbershops", page, search, includeInactive],
    queryFn: () => adminApi.getBarbershops(page, search, includeInactive),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (d: typeof EMPTY_FORM) =>
      adminApi.createBarbershop({
        ...d,
        phone: d.phone || undefined,
        email: d.email || undefined,
        latitude: parseFloat(d.latitude),
        longitude: parseFloat(d.longitude),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-barbershops"] }); closeModal(); },
    onError: (e: any) => setFormError(e.message ?? "Error al crear"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateBarbershop(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-barbershops"] }); closeModal(); },
    onError: (e: any) => setFormError(e.message ?? "Error al actualizar"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.updateBarbershop(id, { isActive: !isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-barbershops"] }),
  });

  const deleteImageMutation = useMutation({
    mutationFn: ({ id, imageUrl }: { id: string; imageUrl: string }) =>
      adminApi.deleteBarbershopImage(id, imageUrl),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-barbershops"] }),
  });

  const shops: Barbershop[] = data?.data ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 15));
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const searchGeo = useCallback(async (q: string) => {
    if (q.length < 3) { setGeoResults([]); return; }
    setSearchingGeo(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=co&limit=5&format=json&addressdetails=1`,
        { headers: { "Accept-Language": "es" } }
      );
      setGeoResults(await res.json());
    } catch { setGeoResults([]); }
    finally { setSearchingGeo(false); }
  }, []);

  function selectGeo(r: GeoResult) {
    const a = r.address;
    const city = a.city || a.town || a.village || "";
    const street = [a.road, a.house_number].filter(Boolean).join(" ") || r.display_name.split(",")[0];
    setForm((f) => ({ ...f, address: street, city, state: a.state || f.state, latitude: parseFloat(r.lat).toFixed(6), longitude: parseFloat(r.lon).toFixed(6) }));
    setAddressQuery("");
    setGeoResults([]);
  }

  function openCreate() {
    setEditing(null); setForm(EMPTY_FORM); setFormError(""); setAddressQuery(""); setGeoResults([]); setShowModal(true);
  }
  function openEdit(b: Barbershop) {
    setEditing(b);
    setForm({ name: b.name, description: b.description ?? "", address: b.address, city: b.city, state: b.state, phone: b.phone ?? "", email: b.email ?? "", latitude: String(b.latitude), longitude: String(b.longitude) });
    setFormError(""); setAddressQuery(""); setGeoResults([]); setShowModal(true);
  }
  function closeModal() { setShowModal(false); setEditing(null); setForm(EMPTY_FORM); setFormError(""); setAddressQuery(""); setGeoResults([]); }

  async function openQr(b: Barbershop) {
    setQrShop(b); setQrImage(null); setLoadingQr(true);
    try {
      const res = await adminApi.getBarbershopQR(b.id);
      setQrImage(res?.qrImage ?? res?.data?.qrImage ?? null);
    } catch { setQrImage(null); }
    finally { setLoadingQr(false); }
  }

  async function handleUploadPhotos(files: FileList | null) {
    if (!files || !files.length || !photosShop) return;
    setUploadingPhoto(true);
    try {
      await adminApi.uploadBarbershopImages(photosShop.id, Array.from(files));
      qc.invalidateQueries({ queryKey: ["admin-barbershops"] });
    } catch (e: any) {
      alert(e.message ?? "Error subiendo imágenes");
    } finally { setUploadingPhoto(false); }
  }

  function handleSave() {
    if (!form.name.trim() || !form.address.trim() || !form.city.trim() || !form.state.trim()) {
      setFormError("Completa los campos requeridos: nombre, dirección, ciudad y departamento"); return;
    }
    if (!validateColPhone(form.phone)) { setFormError("Teléfono colombiano inválido (ej: 3001234567)"); return; }
    if (!validateEmail(form.email)) { setFormError("Correo electrónico inválido"); return; }
    const lat = parseFloat(form.latitude); const lng = parseFloat(form.longitude);
    if (isNaN(lat) || isNaN(lng)) { setFormError("Coordenadas inválidas"); return; }
    setFormError("");
    const payload = { ...form, phone: form.phone || undefined, email: form.email || undefined, latitude: lat, longitude: lng };
    if (editing) { updateMutation.mutate({ id: editing.id, data: payload }); }
    else { createMutation.mutate(form); }
  }

  const Field = ({ label, fieldKey, placeholder, type = "text" }: { label: string; fieldKey: keyof typeof EMPTY_FORM; placeholder?: string; type?: string }) => (
    <div className="mb-3">
      <label className="text-white/50 text-xs font-semibold mb-1.5 block">{label}</label>
      <input type={type} value={form[fieldKey]} onChange={(e) => setForm((f) => ({ ...f, [fieldKey]: e.target.value }))} placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#c9a227]/40" />
    </div>
  );

  // Sync photosShop with latest data
  const latestPhotosShop = photosShop ? shops.find((s) => s.id === photosShop.id) ?? photosShop : null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Barberías</h1>
          <p className="text-white/40 text-sm mt-1">{total} barberías {includeInactive ? "(incluye inactivas)" : ""}</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#c9a227] hover:bg-[#c9a227]/90 text-[#0a0a0f] font-bold rounded-xl text-sm transition-all">
          <Plus size={16} /> Nueva barbería
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input type="text" placeholder="Buscar barbería..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#c9a227]/30" />
        </div>
        <button
          onClick={() => setIncludeInactive((v) => !v)}
          title={includeInactive ? "Ocultar inactivas" : "Mostrar inactivas"}
          className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${includeInactive ? "bg-[#c9a227] border-[#c9a227] text-[#0a0a0f]" : "bg-white/5 border-white/10 text-white/50 hover:text-white"}`}
        >
          Inactivas
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
      ) : shops.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <p className="text-white/30">Sin barberías</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shops.map((b) => (
              <div key={b.id} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                {/* Card header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#c9a227]/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-[#c9a227] text-base">✂</span>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm">{b.name}</h3>
                      {b.owner && <p className="text-white/40 text-xs">{b.owner.firstName} {b.owner.lastName}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleMutation.mutate({ id: b.id, isActive: b.isActive })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${b.isActive ? "bg-green-500/15 border-green-500/30 text-green-400 hover:bg-red-500/15 hover:border-red-500/30 hover:text-red-400" : "bg-white/5 border-white/15 text-white/30 hover:bg-green-500/15 hover:border-green-500/30 hover:text-green-400"}`}
                  >
                    {b.isActive ? "Activa" : "Inactiva"}
                  </button>
                </div>

                {/* Meta */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center gap-1.5 text-white/40 text-xs">
                    <MapPin size={11} />
                    <span>{b.city}, {b.state}</span>
                    {b.address && <span className="text-white/20">· {b.address}</span>}
                  </div>
                  {typeof b.rating === "number" && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <Star size={11} className="text-[#c9a227]" />
                      <span className="text-[#c9a227]">{b.rating.toFixed(1)}</span>
                      <span className="text-white/30">({b.totalReviews ?? 0} reseñas)</span>
                    </div>
                  )}
                  {b.images && b.images.length > 0 && (
                    <p className="text-white/30 text-xs">{b.images.length} foto(s) en carrusel</p>
                  )}
                </div>

                {/* Counts (if available from admin endpoint) */}
                {b._count && (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <p className="text-white font-bold">{b._count.barbers}</p>
                      <p className="text-white/30 text-xs">Barberos</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <p className="text-white font-bold">{b._count.appointments}</p>
                      <p className="text-white/30 text-xs">Citas</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-white/8">
                  <button onClick={() => openEdit(b)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 text-xs transition-all">
                    <Pencil size={12} /> Editar
                  </button>
                  <button onClick={() => { setPhotosShop(b); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c9a227]/30 bg-[#c9a227]/8 text-[#c9a227] hover:bg-[#c9a227]/15 text-xs transition-all">
                    <Images size={12} /> Fotos
                  </button>
                  <button onClick={() => openQr(b)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c9a227]/30 bg-[#c9a227]/8 text-[#c9a227] hover:bg-[#c9a227]/15 text-xs transition-all">
                    <QrCode size={12} /> Ver QR
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-white/30 text-sm">Página {page} de {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/60 text-sm disabled:opacity-30 hover:bg-white/10 transition-all">← Anterior</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/60 text-sm disabled:opacity-30 hover:bg-white/10 transition-all">Siguiente →</button>
            </div>
          </div>
        </>
      )}

      {/* ====== Modal: Crear / Editar ====== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-[#111118] rounded-2xl w-full max-w-lg border border-white/10 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-white/10">
              <h2 className="text-white text-lg font-bold">{editing ? "Editar barbería" : "Nueva barbería"}</h2>
              <button onClick={closeModal} className="text-white/40 hover:text-white transition-colors"><X size={20} /></button>
            </div>

            <div className="overflow-y-auto p-6 flex-1">
              {formError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-red-400 text-sm">{formError}</p>
                </div>
              )}

              <Field label="Nombre *" fieldKey="name" placeholder="Elite Barber Shop" />
              <Field label="Descripción" fieldKey="description" placeholder="Breve descripción de la barbería..." />

              {/* Address search */}
              <div className="mb-3">
                <label className="text-white/50 text-xs font-semibold mb-1.5 block">Buscar dirección</label>
                <div className="flex gap-2">
                  <input type="text" value={addressQuery} onChange={(e) => setAddressQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchGeo(addressQuery)}
                    placeholder="Ej: Calle 72 Bogotá..."
                    className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#c9a227]/40" />
                  <button onClick={() => searchGeo(addressQuery)} disabled={searchingGeo}
                    className="px-3 py-2.5 bg-[#c9a227] text-[#0a0a0f] rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-[#c9a227]/90 transition-all">
                    {searchingGeo ? "..." : "Buscar"}
                  </button>
                </div>
                {geoResults.length > 0 && (
                  <div className="mt-2 bg-[#1a1a25] border border-[#c9a227]/20 rounded-xl overflow-hidden">
                    {geoResults.map((r, i) => (
                      <button key={i} onClick={() => selectGeo(r)}
                        className="w-full flex items-start gap-2 px-3 py-2.5 text-left hover:bg-white/5 border-b border-white/5 last:border-0 transition-all">
                        <MapPin size={13} className="text-[#c9a227] mt-0.5 flex-shrink-0" />
                        <span className="text-white text-xs leading-relaxed">{r.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Field label="Dirección *" fieldKey="address" placeholder="Calle 72 #10-34" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ciudad *" fieldKey="city" placeholder="Bogotá" />
                <Field label="Departamento *" fieldKey="state" placeholder="Cundinamarca" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Latitud" fieldKey="latitude" placeholder="4.6721" type="number" />
                <Field label="Longitud" fieldKey="longitude" placeholder="-74.0447" type="number" />
              </div>
              <Field label="Teléfono (opcional)" fieldKey="phone" placeholder="3001234567" type="tel" />
              <Field label="Email (opcional)" fieldKey="email" placeholder="contacto@barberia.com" type="email" />

              {/* Photos (only when editing) */}
              {editing && (
                <div className="mt-2">
                  <label className="text-white/50 text-xs font-semibold mb-2 block">Fotos del carrusel ({editing.images?.length ?? 0})</label>
                  {editing.images && editing.images.length > 0 && (
                    <div className="flex gap-2 flex-wrap mb-3">
                      {editing.images.map((url, i) => (
                        <div key={i} className="relative">
                          <img src={url} alt="" className="w-16 h-16 rounded-lg object-cover bg-white/10" />
                          <button
                            onClick={() => deleteImageMutation.mutate({ id: editing.id, imageUrl: url })}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-all"
                          >
                            <X size={10} className="text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <label className="flex items-center justify-center gap-2 py-3 border border-dashed border-[#c9a227]/30 bg-[#c9a227]/5 rounded-xl cursor-pointer hover:bg-[#c9a227]/10 transition-all">
                    <Images size={14} className="text-[#c9a227]" />
                    <span className="text-[#c9a227] text-sm font-semibold">Agregar fotos</span>
                    <input type="file" accept="image/*" multiple className="hidden"
                      onChange={(e) => handleUploadPhotos(e.target.files)} />
                  </label>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 pt-4 border-t border-white/10">
              <button onClick={closeModal} className="flex-1 py-3 bg-white/5 border border-white/10 text-white/60 font-semibold rounded-xl text-sm hover:bg-white/10 transition-all">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={isSaving}
                className="flex-1 py-3 bg-[#c9a227] hover:bg-[#c9a227]/90 text-[#0a0a0f] font-bold rounded-xl text-sm disabled:opacity-50 transition-all">
                {isSaving ? "Guardando..." : editing ? "Guardar cambios" : "Crear barbería"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== Modal: Ver QR ====== */}
      {qrShop && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111118] rounded-2xl p-6 w-full max-w-sm border border-white/10 text-center">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-lg font-bold">{qrShop.name}</h2>
              <button onClick={() => { setQrShop(null); setQrImage(null); }} className="text-white/40 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <p className="text-white/40 text-sm mb-5">Escanea para unirse a la fila virtual</p>
            {loadingQr ? (
              <div className="py-16 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#c9a227] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : qrImage ? (
              <img src={qrImage} alt="QR" className="w-52 h-52 rounded-xl mx-auto object-contain" />
            ) : (
              <div className="py-10 text-center">
                <QrCode size={48} className="text-white/10 mx-auto mb-3" />
                <p className="text-white/30 text-sm">No se pudo cargar el QR</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====== Modal: Fotos ====== */}
      {latestPhotosShop && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-[#111118] rounded-2xl p-6 w-full max-w-md border border-white/10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white text-lg font-bold">Fotos — {latestPhotosShop.name}</h2>
              <button onClick={() => setPhotosShop(null)} className="text-white/40 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {latestPhotosShop.images && latestPhotosShop.images.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {latestPhotosShop.images.map((url, i) => (
                  <div key={i} className="relative aspect-square">
                    <img src={url} alt="" className="w-full h-full rounded-xl object-cover bg-white/10" />
                    <button
                      onClick={() => deleteImageMutation.mutate({ id: latestPhotosShop.id, imageUrl: url })}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500/90 rounded-full flex items-center justify-center hover:bg-red-600 transition-all"
                    >
                      <X size={12} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center mb-4">
                <Images size={36} className="text-white/10 mx-auto mb-2" />
                <p className="text-white/30 text-sm">Sin fotos aún</p>
              </div>
            )}

            <label className={`flex items-center justify-center gap-2 py-3 border border-dashed border-[#c9a227]/30 bg-[#c9a227]/5 rounded-xl cursor-pointer hover:bg-[#c9a227]/10 transition-all ${uploadingPhoto ? "opacity-50 pointer-events-none" : ""}`}>
              <Images size={15} className="text-[#c9a227]" />
              <span className="text-[#c9a227] text-sm font-semibold">
                {uploadingPhoto ? "Subiendo..." : "Subir fotos"}
              </span>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => handleUploadPhotos(e.target.files)} />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
