import { createServiceRoleClient } from "@/lib/supabase/server";

import type { InscreverInput, InscreverResultado, ListaEsperaRepository } from "./repository";

// Código de erro do Postgres pra violação de unique constraint — repassado
// como está pelo PostgREST em error.code.
const UNIQUE_VIOLATION = "23505";

export const supabaseListaEsperaRepository: ListaEsperaRepository = {
  async inscrever(input: InscreverInput): Promise<InscreverResultado> {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.from("lista_de_espera").insert({
      nome: input.nome,
      email: input.email,
      nome_restaurante: input.nomeRestaurante ?? null,
    });

    if (!error) return "inscrito";
    if (error.code === UNIQUE_VIOLATION) return "ja_inscrito";
    return "erro";
  },
};
