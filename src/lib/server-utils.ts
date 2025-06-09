"use server";

import { cookies, headers } from "next/headers";
import { auth } from "./auth";

export const validateRequest = async () => {
  const authData = await auth.api.getSession({
    headers: await headers(),
  });
  return { session: authData?.session ?? null, user: authData?.user ?? null };
};

export const getAppURL = async () => {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host");
  const protocol = headerStore.get("x-forwarded-proto");
  return `${protocol}://${host}`;
};

export const changeLocaleAction = async ({
  locale,
}: {
  locale: "fa" | "en";
}) => {
  (await cookies()).set("locale", locale);
};
