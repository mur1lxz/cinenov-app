const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Busca o usuário pelo e-mail
async function getUserByEmail(email) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    // Se não achar o usuário, retorna null em vez de dar erro
    if (error && error.code === 'PGRST116') return null; 
    if (error) throw error;

    return data;
}

// Cria um novo usuário
async function createUser(email, password) {
    const { data, error } = await supabase
        .from('users')
        .insert([{ email, password }])
        .select();

    if (error) throw error;
    return data[0];
}

module.exports = {
    getUserByEmail,
    createUser
};