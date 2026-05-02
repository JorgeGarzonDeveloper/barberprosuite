"use client";

import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, BarbershopAdmin } from "@/lib/api/admin.api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import StarRating from "@/components/StarRating";
import { PageSpinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import {
  Search,
  Store,
  ChevronLeft,
  ChevronRight,
  Plus,
  Eye,
  EyeOff,
  Pencil,
  QrCode,
  ImagePlus,
  MapPin,
  Phone,
  Star,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface GeoResult {
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    road?: string;
    house_number?: string;
  };
  lat: string;
  lon: string;
}

const EMPTY_FORM = {
  name: "",
  description: "",
  address: "",
  city: "",
  state: "",
  phone: "",
  email: "",
  latitude: "4.6721",
  longitude: "-74.0447",
};

export default function AdminBarbershopsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(true);

  // Create/Edit modal
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BarbershopAdmin | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  // Nominatim geocoding
  const [addressQuery, setAddressQuery] = useState("");
  const [geoResults, setGeoResults] = useState<GeoResult[]>([]);
  const [searchingGeo, setSearchingGeo] = useState(false);

  // QR modal
  const [qrShop, setQrShop] = useState<BarbershopAdmin | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);

  // Image upload (for editing)
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageShopId, setImageShopId] = useState<string | null>(null);

  const LIMIT = 15;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-barbershops", page, search, showInactive],
    queryFn: () =>
      adminApi.getBarbershops({
        page,
        limit: LIMIT,
        search: search || undefined,
        includeInactive: showInactive,
      }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      adminApi.createBarbershop({
        ...form,
        phone: form.phone || undefined,
        email: form.email || undefined,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-barbershops"] });
      closeForm();
    },
    onError: (e: any) =>
      setFormError(e?.response?.data?.message ?? "Error al crear la barbería"),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      adminApi.updateBarbershop(editing!.id, {
        ...form,
        phone: form.phone || undefined,
        email: form.email || undefined,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-barbershops"] });
      closeForm();
    },
    onError: (e: any) =>
      setFormError(e?.response?.data?.message ?? "Error al actualizar"),
  });

  const toggleMutation = useMutation({
    mutationFn: (shop: BarbershopAdmin) =>
      adminApi.updateBarbershop(shop.id, { isActive: !shop.isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-barbershops"] }),
  });

  const deleteImageMutation = useMutation({
    mutationFn: ({ id, url }: { id: string; url: string }) =>
      adminApi.deleteBarbershopImage(id, url),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-barbershops"] }),
  });

  // ── Geocoding ──────────────────────────────────────────────────────────────
  const searchAddress = useCallback(async (query: string) => {
    if (query.length < 3) { setGeoResults([]); return; }
    setSearchingGeo(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=co&limit=5&format=json&addressdetails=1`,
        { headers: { "Accept-Language": "es" } }
      );
      const json: GeoResult[] = await res.json();
      setGeoResults(json);
    } catch {
      setGeoResults([]);
    } finally {
      setSearchingGeo(false);
    }
  }, []);

  function selectGeo(r: GeoResult) {
    const addr = r.address;
    const city = addr.city || addr.town || addr.village || "";
    const streetAddr =
      [addr.road, addr.house_number].filter(Boolean).join(" ") ||
      r.display_name.split(",")[0];
    setForm((f) => ({
      ...f,
      address: streetAddr,
      city,
      state: addr.state || f.state,
      latitude: parseFloat(r.lat).toFixed(6),
      longitude: parseFloat(r.lon).toFixed(6),
    }));
    setAddressQuery("");
    setGeoResults([]);
  }

  // ── Form helpers ───────────────────────────────────────────────────────────
  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setAddressQuery("");
    setGeoResults([]);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(b: BarbershopAdmin) {
    setEditing(b);
    setForm({
      name: b.name,
      description: b.description ?? "",
      address: b.address,
      city: b.city,
      state: b.state,
      phone: b.phone ?? "",
      email: b.email ?? "",
      latitude: String(b.latitude),
      longitude: String(b.longitude),
    });
    setAddressQuery("");
    setGeoResults([]);
    setFormError("");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setGeoResults([]);
    setAddressQuery("");
  }

  function handleSave() {
    if (!form.name.trim() || !form.address.trim() || !form.city.trim() || !form.state.trim()) {
      setFormError("Completa los campos requeridos: nombre, dirección, ciudad y departamento");
      return;
    }
    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    if (isNaN(lat) || isNaN(lng)) {
      setFormError("Las coordenadas no son válidas");
      return;
    }
    setFormError("");
    if (editing) updateMutation.mutate();
    else createMutation.mutate();
  }

  // ── QR ─────────────────────────────────────────────────────────────────────
  async function openQr(b: BarbershopAdmin) {
    setQrShop(b);
    setQrImage(null);
    setLoadingQr(true);
    try {
      const img = await adminApi.getBarbershopQr(b.id);
      setQrImage(img);
    } catch {
      setQrImage(null);
    } finally {
      setLoadingQr(false);
    }
  }

  // ── Image upload ────────────────────────────────────────────────────────────
  async function handleImageFiles(shopId: string, files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadingImages(true);
    try {
      await adminApi.uploadBarbershopImages(shopId, Array.from(files));
      queryClient.invalidateQueries({ queryKey: ["admin-barbershops"] });
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Error al subir imágenes");
    } finally {
      setUploadingImages(false);
      setImageShopId(null);
    }
  }

  const shops = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => router.back()} className="text-text-secondary hover:text-white">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white flex-1">Barberías</h1>
        <button
          onClick={() => setShowInactive((v) => !v)}
          className={cn(
            "p-2 rounded-xl border transition-colors",
            showInactive
              ? "bg-primary/15 border-primary/30 text-primary"
              : "bg-white/5 border-white/10 text-text-secondary"
          )}
          title={showInactive ? "Ocultar inactivas" : "Mostrar inactivas"}
        >
          {showInactive ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
        <Button size="sm" onClick={openCreate} className="gap-1.5">
          <Plus size={15} />
          Nueva
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input
          type="text"
          placeholder="Buscar barbería..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary"
        />
      </div>

      <p className="text-text-tertiary text-xs mb-3">
        {total} barberías {showInactive ? "(incluye inactivas)" : ""}
      </p>

      {isLoading ? (
        <PageSpinner />
      ) : shops.length > 0 ? (
        <>
          <div className="flex flex-col gap-3">
            {shops.map((b) => (
              <Card key={b.id} padding="sm">
                {/* Top row */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Store size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{b.name}</p>
                    {b.owner && (
                      <p className="text-text-tertiary text-xs">
                        {b.owner.firstName} {b.owner.lastName}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleMutation.mutate(b)}
                    disabled={toggleMutation.isPending}
                    className={cn(
                      "text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors",
                      b.isActive
                        ? "text-success bg-success/10 border-success/20 hover:bg-success/15"
                        : "text-error bg-error/10 border-error/20 hover:bg-error/15"
                    )}
                  >
                    {b.isActive ? "Abierta" : "Cerrada"}
                  </button>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-1.5 text-text-secondary text-xs mb-1">
                  <MapPin size={11} className="text-primary shrink-0" />
                  <span className="truncate">{b.city}, {b.state} · {b.address}</span>
                </div>
                {b.phone && (
                  <div className="flex items-center gap-1.5 text-text-secondary text-xs mb-1">
                    <Phone size={11} className="text-primary shrink-0" />
                    <span>{b.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs mb-1">
                  <Star size={11} className="text-primary" />
                  <span className="text-primary font-semibold">{(b.rating ?? 0).toFixed(1)}</span>
                  <span className="text-text-tertiary">({b.totalReviews ?? 0} reseñas)</span>
                  {b.images && b.images.length > 0 && (
                    <span className="text-text-tertiary ml-2">· {b.images.length} foto(s)</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-white/5 mt-2">
                  <button
                    onClick={() => openEdit(b)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-text-secondary hover:text-white text-xs font-medium transition-colors"
                  >
                    <Pencil size={12} />
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      setImageShopId(b.id);
                      fileInputRef.current?.click();
                    }}
                    disabled={uploadingImages && imageShopId === b.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-medium hover:bg-primary/15 transition-colors"
                  >
                    {uploadingImages && imageShopId === b.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <ImagePlus size={12} />
                    )}
                    Fotos
                  </button>
                  <button
                    onClick={() => openQr(b)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-medium hover:bg-primary/15 transition-colors"
                  >
                    <QrCode size={12} />
                    QR
                  </button>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-text-secondary text-sm">{page} / {totalPages}</span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center mt-16 gap-3">
          <Store size={40} className="text-text-tertiary" />
          <p className="text-text-secondary">No hay barberías registradas</p>
          <Button onClick={openCreate} className="gap-2">
            <Plus size={16} />
            Crear primera barbería
          </Button>
        </div>
      )}

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (imageShopId) handleImageFiles(imageShopId, e.target.files);
          e.target.value = "";
        }}
      />

      {/* ── Modal: Crear / Editar ──────────────────────────────────────────── */}
      <Modal
        isOpen={formOpen}
        onClose={closeForm}
        title={editing ? "Editar barbería" : "Nueva barbería"}
        className="max-h-[90vh] overflow-y-auto"
      >
        <div className="flex flex-col gap-3">
          {formError && (
            <div className="flex items-start gap-2 bg-error/10 border border-error/20 rounded-xl p-3">
              <AlertCircle size={15} className="text-error shrink-0 mt-0.5" />
              <p className="text-error text-xs">{formError}</p>
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="text-text-tertiary text-xs font-semibold mb-1.5 block">Nombre *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Elite Barber Shop"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="text-text-tertiary text-xs font-semibold mb-1.5 block">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Breve descripción del local..."
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary resize-none"
            />
          </div>

          {/* Búsqueda de dirección con Nominatim */}
          <div>
            <label className="text-text-tertiary text-xs font-semibold mb-1.5 block">
              Buscar dirección
            </label>
            <div className="flex gap-2">
              <input
                value={addressQuery}
                onChange={(e) => setAddressQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchAddress(addressQuery)}
                placeholder="Ej: Calle 72 Bogotá, El Poblado..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary"
              />
              <button
                onClick={() => searchAddress(addressQuery)}
                disabled={searchingGeo}
                className="px-3.5 bg-primary rounded-xl text-background font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {searchingGeo ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              </button>
            </div>

            {geoResults.length > 0 && (
              <div className="mt-2 bg-[#1a1a25] border border-primary/20 rounded-xl overflow-hidden">
                {geoResults.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => selectGeo(r)}
                    className="flex items-start gap-2.5 p-3 w-full text-left hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors"
                  >
                    <MapPin size={13} className="text-primary shrink-0 mt-0.5" />
                    <span className="text-white text-xs leading-relaxed">{r.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dirección manual */}
          <div>
            <label className="text-text-tertiary text-xs font-semibold mb-1.5 block">Dirección *</label>
            <input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Calle 72 #10-34"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-text-tertiary text-xs font-semibold mb-1.5 block">Ciudad *</label>
              <input
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                placeholder="Bogotá"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-text-tertiary text-xs font-semibold mb-1.5 block">Departamento *</label>
              <input
                value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                placeholder="Cundinamarca"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-text-tertiary text-xs font-semibold mb-1.5 block">Latitud</label>
              <input
                value={form.latitude}
                onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-text-tertiary text-xs font-semibold mb-1.5 block">Longitud</label>
              <input
                value={form.longitude}
                onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-text-tertiary text-xs font-semibold mb-1.5 block">Teléfono</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="3001234567"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-text-tertiary text-xs font-semibold mb-1.5 block">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="local@email.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Imágenes actuales (solo al editar) */}
          {editing && editing.images && editing.images.length > 0 && (
            <div>
              <label className="text-text-tertiary text-xs font-semibold mb-2 block">
                Fotos del carrusel ({editing.images.length})
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {editing.images.map((url, i) => (
                  <div key={i} className="relative shrink-0">
                    <Image
                      src={url}
                      alt={`Foto ${i + 1}`}
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                    <button
                      onClick={() => deleteImageMutation.mutate({ id: editing.id, url })}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-error rounded-full flex items-center justify-center hover:bg-error/80 transition-colors"
                    >
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={closeForm}>
              Cancelar
            </Button>
            <Button className="flex-1" loading={isSaving} onClick={handleSave}>
              {editing ? "Guardar" : "Crear"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: QR ──────────────────────────────────────────────────────── */}
      <Modal
        isOpen={!!qrShop}
        onClose={() => { setQrShop(null); setQrImage(null); }}
        title={qrShop?.name ?? "QR"}
      >
        <div className="flex flex-col items-center gap-4 py-2">
          <p className="text-text-secondary text-xs">Escanea para unirse a la fila virtual</p>
          {loadingQr ? (
            <Loader2 size={40} className="text-primary animate-spin my-8" />
          ) : qrImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrImage}
              alt="QR code"
              width={220}
              height={220}
              className="rounded-xl"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 py-8">
              <QrCode size={48} className="text-text-tertiary" />
              <p className="text-text-tertiary text-sm">No se pudo cargar el QR</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
