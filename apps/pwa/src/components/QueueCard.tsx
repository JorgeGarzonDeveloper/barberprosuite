"use client";

import { QueueEntry } from "@/types";
import { cn } from "@/lib/utils";
import Card from "./ui/Card";
import Badge, { getStatusVariant } from "./ui/Badge";
import Button from "./ui/Button";
import { Clock, MapPin, User, ChevronRight } from "lucide-react";
import { getStatusLabel } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface QueueCardProps {
  entry: QueueEntry;
  onLeave?: () => void;
}

export default function QueueCard({ entry, onLeave }: QueueCardProps) {
  const router = useRouter();
  const isCalled = entry.status === "CALLED";

  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        isCalled && "border-success/30 bg-[rgba(34,197,94,0.04)]"
      )}
    >
      {isCalled && (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-success to-transparent" />
      )}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold",
              isCalled
                ? "bg-[rgba(34,197,94,0.15)] text-success"
                : "bg-[rgba(201,162,39,0.15)] text-primary"
            )}
          >
            {entry.position}
          </div>
          <div>
            <p className="text-xs text-text-tertiary">Tu posición</p>
            <p className="text-sm font-semibold text-white">
              {entry.barbershopName || "Barbería"}
            </p>
          </div>
        </div>
        <Badge variant={getStatusVariant(entry.status)}>
          {getStatusLabel(entry.status)}
        </Badge>
      </div>

      {isCalled && (
        <div className="bg-[rgba(34,197,94,0.08)] border border-success/20 rounded-xl p-3 mb-3 text-center">
          <p className="text-success font-semibold text-sm">
            ¡Es tu turno! Dirígete a la silla
          </p>
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-text-secondary mb-4">
        {entry.estimatedWaitMinutes > 0 && (
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-primary" />
            <span>~{entry.estimatedWaitMinutes} min</span>
          </div>
        )}
        {entry.barberName && (
          <div className="flex items-center gap-1.5">
            <User size={14} className="text-primary" />
            <span>{entry.barberName}</span>
          </div>
        )}
      </div>

      <Button
        variant="secondary"
        size="sm"
        fullWidth
        onClick={() => router.push(`/queue/${entry.id}`)}
        className="justify-between"
      >
        <span>Ver detalle</span>
        <ChevronRight size={16} />
      </Button>
    </Card>
  );
}
