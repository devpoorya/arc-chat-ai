"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader } from "lucide-react";
import Link from "next/link";

const FormSchema = z
  .object({
    name: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6).max(120),
    passwordConfirmation: z.string().min(6).max(120),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Password and confirmation password must match",
    path: ["passwordConfirmation"],
  });

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      passwordConfirmation: "",
    },
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    setLoading(true);
    authClient.signUp
      .email({
        email: data.email,
        password: data.password,
        callbackURL: "/dashboard",
        name: data.name,
      })
      .then((res) => {
        setLoading(false);
        if (res.error) {
          toast("Failed to create your account");
        } else {
          router.push("/dashboard");
        }
      })
      .catch(() => {
        setLoading(false);
        toast("Failed to create your account");
      });
  }
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("flex flex-col gap-6")}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-bold">Register</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your information to create an account
          </p>
        </div>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder={"mail@example.com"} {...field} />
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
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input placeholder="" type={"password"} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="passwordConfirmation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password Confirmation</FormLabel>
              <FormControl>
                <Input placeholder="" type={"password"} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={loading}>
          {loading && <Loader className="size-4 animate-spin" />}
          Register
        </Button>
        <Link href="/auth/login" className="text-center text-sm">
          Already have an account? <span className="underline">Login</span>
        </Link>
      </form>
    </Form>
  );
}
