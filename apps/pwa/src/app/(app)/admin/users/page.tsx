"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin.api";
import { User } from "@/types";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";
import { getInitials, cn } from "@/lib/utils";
import { Search, Users, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminUsersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, search],
    queryFn: () => adminApi.getUsers({ page, limit: 20, search: search || undefined }),
  });

  const users = data?.data || [];
  const total = data?.total || 0;

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="text-text-secondary hover:text-white"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white">Usuarios</h1>
        <span className="text-text-tertiary text-sm ml-auto">{total} total</span>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary"
        />
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : users.length > 0 ? (
        <>
          <div className="flex flex-col gap-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 bg-[rgba(255,255,255,0.04)] rounded-xl border border-[rgba(255,255,255,0.06)]"
              >
                <div className="w-10 h-10 rounded-full bg-[rgba(201,162,39,0.15)] flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {getInitials(user.firstName, user.lastName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-text-secondary truncate">{user.email}</p>
                </div>
                <Badge
                  variant={
                    user.role === "ADMIN"
                      ? "warning"
                      : user.role === "BARBER"
                      ? "primary"
                      : "secondary"
                  }
                >
                  {user.role === "ADMIN" ? "Admin" : user.role === "BARBER" ? "Barbero" : "Cliente"}
                </Badge>
              </div>
            ))}
          </div>
          {users.length < total && (
            <Button
              variant="secondary"
              fullWidth
              className="mt-4"
              onClick={() => setPage((p) => p + 1)}
            >
              Ver más
            </Button>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center mt-16 gap-3">
          <Users size={40} className="text-text-tertiary" />
          <p className="text-text-secondary">No se encontraron usuarios</p>
        </div>
      )}
    </div>
  );
}
