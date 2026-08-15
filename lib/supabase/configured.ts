// Server components chamam isso antes de criar um client, pra cair num
// estado vazio em vez de derrubar a página quando o projeto Supabase real
// ainda não foi provisionado (harness sem .env preenchido).
export function supabaseConfigurado(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}
