import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Payment() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const url = localStorage.getItem("payment_url");
    if (!url) {
      setLocation("/packages");
    } else {
      setPaymentUrl(url);
    }
  }, [setLocation]);

  const { refetch } = useGetMe({
    query: {
      enabled: false,
      queryKey: getGetMeQueryKey()
    }
  });

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const { data } = await refetch();
      if (data?.status === "active") {
        localStorage.removeItem("payment_url");
        setLocation("/dashboard");
      }
    } finally {
      setIsChecking(false);
    }
  };

  if (user?.status === "active") {
    setLocation("/dashboard");
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 w-full">
      <Card className="shadow-lg border-0 bg-white dark:bg-slate-900">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold">Complete your payment</CardTitle>
          <CardDescription className="text-lg">
            Complete the checkout process via Paynecta below to activate your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {paymentUrl ? (
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden h-[600px] w-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
              <iframe 
                src={paymentUrl} 
                className="w-full h-full border-0" 
                title="Paynecta Checkout"
              />
            </div>
          ) : (
            <div className="h-[600px] flex items-center justify-center border rounded-lg bg-slate-50 dark:bg-slate-950">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          )}

          <div className="flex flex-col items-center justify-center space-y-4 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
            <p className="text-slate-600 dark:text-slate-400 text-center max-w-md">
              Once you've completed the payment in the frame above, click the button below to verify and access your dashboard.
            </p>
            <Button size="lg" onClick={checkStatus} disabled={isChecking} className="w-full max-w-xs font-semibold">
              {isChecking ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verifying...</>
              ) : (
                <><RefreshCw className="mr-2 h-5 w-5" /> Check payment status</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
