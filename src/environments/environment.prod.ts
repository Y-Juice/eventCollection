export const environment = {
  production: true,
  // Use local API when running in Docker
  apiUrl: 'http://localhost:3000/api',
  // Set to true to use local PostgreSQL instead of Supabase
  useLocalApi: true,
  // Supabase configuration (used when useLocalApi is false)
  supabaseUrl: 'https://yvswrfkogqpvkhohouvp.supabase.co',
  supabaseKey: 'sb_publishable_dgO6LYC0FSO-lgOMJrySpA_ldTwOzYp'
};
