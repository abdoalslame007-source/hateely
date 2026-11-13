"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
    const [checking, setChecking] = useState(true);

      useEffect(() => {
          supabase.auth.getSession().then(({ data }) => {
                setSession(data.session);
                      setChecking(false);
                          });
                              const { data: listener } = supabase.auth.onAuthStateChange((_e, s) =>
                                    setSession(s)
                                        );
                                            return () => listener.subscription.unsubscribe();
                                              }, []);

                                                return { session, checking };
                                                }