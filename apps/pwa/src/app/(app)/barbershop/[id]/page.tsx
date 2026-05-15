"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { barbershopsApi } from "@/lib/api/barbershops.api";
import { barberApi } from "@/lib/api/barber.api";
import { Barber, Service } from "@/types";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import StarRating from "@/components/StarRating";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatCOP, formatDate, getInitials, cn } from "@/lib/utils";
import {
  MapPin,
  Phone,
  Star,
  ChevronDown,
  ChevronUp,
  Calendar,
  Scissors,
  MessageSquare,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuthStore } from "@/store/auth.store";

export default function BarbershopPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"services" | "reviews">("services");
  const [expandedBarber, setExpandedBarber] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const { data: shop, isLoading } = useQuery({
    queryKey: ["barbershop", id],
    queryFn: () => barbershopsApi.getById(id),
  });

  const { data: canReviewData } = useQuery({
    queryKey: ["can-review", id],
    queryFn: () => barbershopsApi.canReview(id),
    enabled: isAuthenticated,
  });

  function requireAuth(action: () => void) {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    action();
  }

  const reviewMutation = useMutation({
    mutationFn: () =>
      barbershopsApi.postReview(id, {
        rating: reviewRating,
        comment: reviewComment || undefined,
        appointmentId: canReviewData?.appointmentId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["barbershop", id] });
      queryClient.invalidateQueries({ queryKey: ["can-review", id] });
      setShowReviewModal(false);
      setReviewComment("");
      setReviewRating(5);
    },
  });

  if (isLoading) return <PageSpinner />;
  if (!shop) return null;

  const shopImages: string[] = (shop as any).images ?? [];
  const coverImage = shop.coverImageUrl || shopImages[0] || null;

  return (
    <div className="max-w-md mx-auto pb-28">
      {/* Header image */}
      <div className="relative h-56 bg-[rgba(255,255,255,0.04)]">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={shop.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Scissors size={48} className="text-text-tertiary" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white"
        >
          ←
        </button>
      </div>

      <div className="px-4 -mt-8 relative z-10">
        {/* Shop info */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">{shop.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <StarRating rating={shop.rating} size={14} />
            <span className="text-text-secondary text-sm">
              {shop.rating.toFixed(1)} ({shop.totalReviews} reseñas)
            </span>
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shop.address}, ${shop.city}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 mt-2 text-text-secondary text-sm hover:text-white transition-colors group"
          >
            <MapPin size={14} className="text-primary shrink-0" />
            <span className="group-hover:underline">{shop.address}, {shop.city}</span>
          </a>
          {shop.phone && (
            <a
              href={`tel:${shop.phone}`}
              className="flex items-center gap-2 mt-1 text-text-secondary text-sm hover:text-white transition-colors"
            >
              <Phone size={14} className="text-primary shrink-0" />
              <span className="hover:underline">{shop.phone}</span>
            </a>
          )}
        </div>

        {/* Galería de fotos */}
        {shopImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 mb-5 -mx-4 px-4">
            {shopImages.map((img, i) => (
              <div key={i} className="shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-[rgba(255,255,255,0.06)]">
                <Image
                  src={img}
                  alt={`Foto ${i + 1}`}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 mb-6">
          <Button
            fullWidth
            onClick={() => requireAuth(() => router.push(`/book/${shop.id}`))}
            className="gap-2"
          >
            <Calendar size={16} />
            Agendar cita
          </Button>
          {canReviewData?.canReview && (
            <Button
              variant="secondary"
              onClick={() => requireAuth(() => setShowReviewModal(true))}
              className="gap-2 shrink-0"
            >
              <Star size={16} />
              Calificar
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex bg-[rgba(255,255,255,0.04)] rounded-xl p-1 mb-6">
          <button
            onClick={() => setActiveTab("services")}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === "services"
                ? "bg-primary text-black"
                : "text-text-secondary"
            )}
          >
            Barberos & Servicios
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === "reviews"
                ? "bg-primary text-black"
                : "text-text-secondary"
            )}
          >
            Reseñas ({shop.totalReviews})
          </button>
        </div>

        {/* Barbers & Services tab */}
        {activeTab === "services" && (
          <div className="flex flex-col gap-3">
            {shop.barbers.length > 0 ? (
              shop.barbers.map((barber) => (
                <BarberAccordion
                  key={barber.id}
                  barber={barber}
                  isExpanded={expandedBarber === barber.id}
                  onToggle={() =>
                    setExpandedBarber(
                      expandedBarber === barber.id ? null : barber.id
                    )
                  }
                  onBook={() =>
                    requireAuth(() => router.push(`/book/${shop.id}?barberId=${barber.id}`))
                  }
                />
              ))
            ) : (
              <div className="text-center py-8 text-text-secondary text-sm">
                No hay barberos registrados
              </div>
            )}
          </div>
        )}

        {/* Reviews tab */}
        {activeTab === "reviews" && (
          <div className="flex flex-col gap-3">
            {shop.reviews.length > 0 ? (
              shop.reviews.map((review) => (
                <Card key={review.id}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-full bg-[rgba(201,162,39,0.15)] flex items-center justify-center text-xs font-bold text-primary">
                      {getInitials(
                        review.client.user.firstName,
                        review.client.user.lastName
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        {review.client.user.firstName}{" "}
                        {review.client.user.lastName}
                      </p>
                      <p className="text-text-tertiary text-xs">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                    <StarRating rating={review.rating} size={13} />
                  </div>
                  {review.comment && (
                    <p className="text-text-secondary text-sm">
                      {review.comment}
                    </p>
                  )}
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageSquare size={32} className="text-text-tertiary mx-auto mb-2" />
                <p className="text-text-secondary text-sm">Sin reseñas aún</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Calificar barbería"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-text-secondary mb-2 block">
              Calificación
            </label>
            <StarRating
              rating={reviewRating}
              size={32}
              interactive
              onChange={setReviewRating}
            />
          </div>
          <div>
            <label className="text-sm text-text-secondary mb-2 block">
              Comentario (opcional)
            </label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Cuéntanos tu experiencia..."
              rows={4}
              className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-white text-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary resize-none"
            />
          </div>
          <Button
            loading={reviewMutation.isPending}
            fullWidth
            onClick={() => reviewMutation.mutate()}
          >
            Enviar reseña
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function BarberAccordion({
  barber,
  isExpanded,
  onToggle,
  onBook,
}: {
  barber: Barber;
  isExpanded: boolean;
  onToggle: () => void;
  onBook: () => void;
}) {
  return (
    <Card padding="none" className="overflow-hidden">
      <button
        onClick={onToggle}
        className="flex items-center gap-3 px-4 py-4 w-full"
      >
        <div className="w-10 h-10 rounded-full bg-[rgba(201,162,39,0.15)] flex items-center justify-center text-sm font-bold text-primary">
          {getInitials(barber.user.firstName, barber.user.lastName)}
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-white">
            {barber.user.firstName} {barber.user.lastName}
          </p>
          {barber.specialties && (
            <p className="text-text-secondary text-xs">{barber.specialties}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              barber.isAvailable ? "bg-success" : "bg-error"
            )}
          />
          {isExpanded ? (
            <ChevronUp size={16} className="text-text-tertiary" />
          ) : (
            <ChevronDown size={16} className="text-text-tertiary" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-[rgba(255,255,255,0.04)]">
          <BarberServicesList barberId={barber.id} />
          <Button size="sm" fullWidth className="mt-4 gap-2" onClick={onBook}>
            <Calendar size={14} />
            Reservar con {barber.user.firstName}
          </Button>
        </div>
      )}
    </Card>
  );
}

function BarberServicesList({ barberId }: { barberId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["barber-services", barberId],
    queryFn: () => barberApi.getServicesByBarber(barberId),
  });

  const services = data?.data || [];

  if (isLoading)
    return (
      <div className="flex flex-col gap-2 pt-3">
        {[1, 2].map((i) => (
          <div key={i} className="skeleton h-10 rounded-xl" />
        ))}
      </div>
    );

  if (services.length === 0)
    return (
      <p className="text-text-tertiary text-xs pt-3">Sin servicios registrados</p>
    );

  return (
    <div className="flex flex-col gap-2 pt-3">
      {services.map((service) => (
        <div
          key={service.id}
          className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.04)] last:border-0"
        >
          <div>
            <p className="text-sm text-white">{service.name}</p>
            {service.description && (
              <p className="text-xs text-text-tertiary">{service.description}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-primary">
              {formatCOP(service.price)}
            </p>
            <p className="text-xs text-text-tertiary">
              {service.durationMinutes} min
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
