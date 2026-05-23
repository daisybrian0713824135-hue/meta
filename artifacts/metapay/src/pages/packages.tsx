import { useGetPackages, getGetPackagesQueryKey, useCreateSubscription } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Packages() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: packages, isLoading } = useGetPackages({
    query: {
      queryKey: getGetPackagesQueryKey()
    }
  });

  const createSubMutation = useCreateSubscription();

  if (user?.status === "active") {
    setLocation("/dashboard");
    return null;
  }

  const handleSelectPackage = (packageId: number) => {
    createSubMutation.mutate({
      data: { packageId }
    }, {
      onSuccess: (data) => {
        localStorage.setItem("payment_url", data.paymentUrl);
        localStorage.setItem("selected_package_id", packageId.toString());
        setLocation("/payment");
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.data?.error || "Failed to initiate subscription."
        });
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight sm:text-5xl">
          Choose your package
        </h1>
        <p className="mt-4 text-xl text-slate-500 dark:text-slate-400">
          Select a subscription plan to activate your MetaPay workspace and unlock the full potential of your agency.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8 items-start">
          {packages?.map((pkg) => (
            <Card key={pkg.id} className={`flex flex-col relative ${pkg.popular ? 'border-primary shadow-xl scale-105 z-10' : 'border-slate-200 dark:border-slate-800'}`}>
              {pkg.popular && (
                <div className="absolute top-0 inset-x-0 transform -translate-y-1/2 flex justify-center">
                  <span className="bg-primary text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader className="text-center pb-8 pt-8">
                <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                <div className="mt-4 flex justify-center items-baseline text-5xl font-extrabold">
                  KES {pkg.price}
                  <span className="ml-1 text-xl font-medium text-slate-500">/{pkg.duration === 30 ? 'mo' : pkg.duration + 'd'}</span>
                </div>
                <CardDescription className="mt-4 text-base">{pkg.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-4">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <div className="flex-shrink-0">
                        <Check className="h-5 w-5 text-green-500" />
                      </div>
                      <p className="ml-3 text-base text-slate-700 dark:text-slate-300">{feature}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-8 pb-8">
                <Button
                  className="w-full text-lg h-12"
                  variant={pkg.popular ? "default" : "outline"}
                  onClick={() => handleSelectPackage(pkg.id)}
                  disabled={createSubMutation.isPending}
                >
                  {createSubMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Select Plan"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
