import { createClient } from "@supabase/supabase-js";

/**
 * Cria um cliente administrativo do Supabase para uso exclusivo no servidor.
 * Nunca disponibilize essa chave no navegador.
 */
export function createSupabaseClient({ url, key }) {
  if (!url) {
    throw new Error("SUPABASE_URL não está definida nas variáveis de ambiente.");
  }
  if (!key) {
    throw new Error("SUPABASE_SECRET_KEY não está definida. Configure a chave secreta do Supabase no servidor.");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Camada de acesso aos usuários. As senhas novas são salvas com hash scrypt.
 * password_legacy existe apenas para migrar contas antigas que guardavam
 * senha em texto puro: ela é removida da linha assim que a pessoa entra.
 */
export function createUserStore(supabase) {
  return {
    async findByEmail(email) {
      const { data, error } = await supabase
        .from("users")
        .select("id, email, password_hash, password_legacy")
        .eq("email", String(email).trim().toLowerCase())
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    async findById(id) {
      const { data, error } = await supabase
        .from("users")
        .select("id, email")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    async create(email, passwordHash) {
      const { data, error } = await supabase
        .from("users")
        .insert({
          email: String(email).trim().toLowerCase(),
          password_hash: passwordHash,
        })
        .select("id, email")
        .single();

      if (error) throw error;
      return data;
    },

    async updatePasswordHash(id, passwordHash) {
      const { error } = await supabase
        .from("users")
        .update({ password_hash: passwordHash, password_legacy: null })
        .eq("id", id);

      if (error) throw error;
    },
  };
}

export function isUniqueViolation(error) {
  return error?.code === "23505" || error?.code === "ERR_SQLITE_CONSTRAINT_UNIQUE";
}
