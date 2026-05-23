import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const loginMutation = useLogin();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data: values }, {
      onSuccess: (response) => {
        login(response.token);
        if (response.user.status === "inactive") {
          setLocation("/packages");
        } else {
          setLocation("/dashboard");
        }
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: error.data?.error || "Invalid credentials. Please try again.",
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white">
            <div className="w-10 h-10 rounded bg-primary flex items-center justify-center text-white text-xl">
              M
            </div>
            MetaPay Agencies
          </div>
        </div>

        <Card className="border-0 shadow-xl dark:bg-slate-900">
          <CardHeader className="space-y-1 text-center pb-8">
            <CardTitle className="text-2xl font-semibold tracking-tight">Welcome back</CardTitle>
            <CardDescription className="text-slate-500">
              Sign in to manage your tasks and team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email address</FormLabel>
                      <FormControl>
                        <Input placeholder="name@agency.com" type="email" autoComplete="email" disabled={loginMutation.isPending} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Password</FormLabel>
                      </div>
                      <FormControl>
                        <Input placeholder="••••••••" type="password" autoComplete="current-password" disabled={loginMutation.isPending} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full mt-6" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center border-t p-6">
            <div className="text-sm text-slate-500">
              Don't have an account?{" "}
              <Link href="/register" className="font-semibold text-primary hover:underline">
                Create one now
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
