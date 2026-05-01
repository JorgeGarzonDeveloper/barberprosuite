"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subscriptionsApi } from "@/lib/api/subscriptions.api";
import { paymentsApi } from "@/lib/api/payments.api";
import Card from "@/components/ui/Card";
import Badge, { getStatusVariant } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatCOP, getStatusLabel, formatDate, cn } from "@/lib/utils";
import { Crown, Check, CreditCard, Calendar } from "lucide-react";

export default function SubscriptionPage() {
  const queryClient = useQueryClient();

  const { data: subData, isLoading: subLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => subscriptionsApi.getMy(),
  });

  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: () => subscriptionsApi.getPlans(),
  });

  const checkoutMutation = useMutation({
    mutationFn: (planName: string) =>
      paymentsApi.subscriptionCheckout({
        subscriptionId: subData?.data?.id,
        planName,
      }),
    onSuccess: ({ checkoutUrl }) => {
      window.open(checkoutUrl, "_blank");
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });

  const subscription = subData?.data;
  const plans = plansData?.data || [];

  if (subLoading || plansLoading) return <PageSpinner />;

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-6">
        <Crown size={24} className="text-primary" />
        <h1 className="text-xl font-bold text-white">Suscripción</h1>
      </div>

      {/* Current subscription */}
      {subscription && (
        <Card className="mb-6 border-primary/20 bg-[rgba(201,162,39,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
              Plan actual
            </h2>
            <Badge variant={getStatusVariant(subscription.status)}>
              {getStatusLabel(subscription.status)}
            </Badge>
          </div>
          <p className="text-xl font-bold text-white">
            {subscription.plan?.displayName || "Plan activo"}
          </p>
          {subscription.plan?.priceMonthly && (
            <p className="text-primary font-semibold mt-1">
              {formatCOP(subscription.plan.priceMonthly)}
              <span className="text-text-secondary text-sm font-normal">/mes</span>
            </p>
          )}
          {subscription.endDate && (
            <div className="flex items-center gap-2 mt-3 text-text-secondary text-sm">
              <Calendar size={14} className="text-primary" />
              <span>Vence: {formatDate(subscription.endDate)}</span>
            </div>
          )}
        </Card>
      )}

      {/* Available plans */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">
          Planes disponibles
        </h2>
        <div className="flex flex-col gap-4">
          {plans.map((plan) => {
            const isCurrent = subscription?.planId === plan.id;
            return (
              <Card
                key={plan.id}
                className={cn(
                  isCurrent && "border-primary/30 bg-[rgba(201,162,39,0.04)]"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-white text-lg">
                      {plan.displayName}
                    </h3>
                    <p className="text-primary font-semibold text-xl mt-0.5">
                      {formatCOP(plan.priceMonthly)}
                      <span className="text-text-secondary text-sm font-normal">
                        /mes
                      </span>
                    </p>
                  </div>
                  {isCurrent && (
                    <Badge variant="primary">
                      <Check size={12} className="mr-1" />
                      Actual
                    </Badge>
                  )}
                </div>

                {plan.description && (
                  <p className="text-text-secondary text-sm mb-4">
                    {plan.description}
                  </p>
                )}

                {!isCurrent && (
                  <Button
                    fullWidth
                    loading={checkoutMutation.isPending}
                    onClick={() => checkoutMutation.mutate(plan.name)}
                    className="gap-2 mt-2"
                  >
                    <CreditCard size={16} />
                    {subscription ? "Cambiar a este plan" : "Suscribirse"}
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
