import { supabase } from "@/integrations/supabase/client";

/**
 * NOTE: This file did not exist in the exported project — it was referenced as
 * "@/integrations/lovable/index" (a helper injected by the Lovable.dev platform)
 * but was not included in the available source files.
 *
 * This is a best-effort reconstruction that provides the same call signature
 * (`lovable.auth.signInWithOAuth("google", { redirect_uri })`) used in Auth.tsx,
 * implemented directly on top of Supabase's own OAuth flow. Since this app no
 * longer runs on the Lovable platform, this is the natural replacement.
 */
export const lovable = {
  auth: {
    async signInWithOAuth(
      provider: "google" | "github" | "azure" | "facebook",
      options: { redirect_uri: string }
    ) {
      return supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: options.redirect_uri },
      });
    },
  },
};
