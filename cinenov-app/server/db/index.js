const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Auxiliar para verificar se o erro é de e-mail duplicado no Postgres/Supabase
function isUniqueViolation(error) {
    return error && error.code === '23505';
}

// Busca o usuário pelo e-mail
async function getUserByEmail(email) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

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
    createUser,
    isUniqueViolation
};