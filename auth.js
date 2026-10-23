'use strict';
// CPR Gestion : authentification et stockage distant, protégés côté serveur par RLS.
// L'interface masquée n'est jamais considérée comme une mesure de sécurité.
(function () {
  let client = null;
  let connected = false;
  let currentUserId = null;
  let revision = 0;
  let blocked = false;
  let loading = false;
  let formHandlersAttached = false;
  let recoveryMode = /(?:[?#&])type=recovery(?:&|$)/.test(location.href);
  let saveQueue = Promise.resolve(true);
  const byId = id => document.getElementById(id);
  const formIds = ['loginForm','forgotForm','newPasswordForm'];

  function message(text, kind = '') {
    const node = byId('authMessage');
    node.textContent = text;
    node.className = `auth-message ${kind}`;
  }
  function showAuth(which = 'loginForm') {
    byId('appShell').hidden = true;
    byId('authScreen').hidden = false;
    for (const id of formIds) byId(id).hidden = id !== which;
  }
  function setSync(text, kind = '') {
    const node = byId('syncStatus');
    node.textContent = text;
    node.className = `pill ${kind}`;
  }
  function isConfigured() {
    const url = String(window.CPR_SUPABASE_URL || '');
    const key = String(window.CPR_SUPABASE_ANON_KEY || '');
    return /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url) &&
      key.length > 20 && !/VOTRE_|PLACEHOLDER|service_role/i.test(key);
  }
  function validateData(payload) {
    return payload && typeof payload === 'object' && !Array.isArray(payload) &&
      payload.company && typeof payload.company === 'object' &&
      ['clients','chantiers','devis','factures'].every(k => Array.isArray(payload[k]));
  }
  async function authorizeAndLoad() {
    if (loading || recoveryMode) return;
    loading = true;
    try {
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (userError || !user) {
        connected = false;
        showAuth();
        return;
      }
      if (connected && currentUserId === user.id) return;
      message('Vérification des droits administrateur…');
      // Cette vérification UX double le contrôle RLS qui protège les données en base.
      const { data: role, error: roleError } = await client.from('cpr_admins')
        .select('user_id').eq('user_id', user.id).maybeSingle();
      if (roleError) throw new Error('Accès aux droits administrateur impossible. Vérifiez le script SQL Supabase.');
      if (!role) {
        await client.auth.signOut();
        connected = false;
        showAuth();
        message('Ce compte ne dispose pas des droits administrateur CPR.', 'error');
        return;
      }
      const { data: store, error: storeError } = await client.from('cpr_store')
        .select('payload,revision').eq('id', 1).single();
      if (storeError || !store) throw new Error('Impossible de charger les données. Exécutez le script supabase/setup.sql.');
      // Pas de copie locale des clients, devis et factures : uniquement l'état cloud.
      if (validateData(store.payload)) db = structuredClone(store.payload);
      else if (store.payload && Object.keys(store.payload).length === 0) db = initial();
      else throw new Error('La structure des données distantes est invalide : aucune modification ne sera faite.');
      revision = Number(store.revision);
      blocked = false;
      connected = true;
      currentUserId = user.id;
      byId('adminEmail').textContent = user.email || '';
      byId('authScreen').hidden = true;
      byId('appShell').hidden = false;
      setSync('● Supabase connecté');
      render();
    } catch (error) {
      connected = false;
      currentUserId = null;
      showAuth();
      message(error.message || 'Connexion impossible.', 'error');
    } finally {
      loading = false;
    }
  }

  function lockSync(reason) {
    blocked = true;
    setSync('⚠ Sauvegarde bloquée', 'error');
    window.alert(reason + '\n\nExportez d’abord vos données dans Paramètres avant de choisir « Actualiser ». Les changements non enregistrés restent visibles dans cet onglet.');
  }

  async function save(payload) {
    if (!connected || blocked) {
      if (blocked) window.alert('Sauvegarde bloquée : exportez vos données, puis actualisez depuis Supabase.');
      return false;
    }
    // Chaque mutation capture son état exact. Les écritures sont mises en file
    // pour éviter qu'un enregistrement plus ancien écrase un plus récent.
    const snapshot = JSON.parse(JSON.stringify(payload));
    const work = async () => {
      if (blocked || !connected) return false;
      setSync('⏳ Enregistrement…', 'wait');
      try {
        const { data, error } = await client.from('cpr_store')
          .update({ payload: snapshot, revision: revision + 1 })
          .eq('id', 1).eq('revision', revision)
          .select('revision').maybeSingle();
        if (error) throw error;
        if (!data) {
          lockSync('Conflit : les données ont été modifiées sur un autre appareil. Aucune écriture distante n’a été effectuée.');
          return false;
        }
        revision = Number(data.revision);
        setSync('✓ Enregistré sur Supabase');
        return true;
      } catch (error) {
        lockSync('Échec de la sauvegarde Supabase : ' + (error.message || 'erreur réseau'));
        return false;
      }
    };
    saveQueue = saveQueue.then(work, work);
    return saveQueue;
  }

  function ensureWritable() {
    if (!connected) return false;
    if (blocked) {
      window.alert('Des modifications ne sont pas enregistrées sur Supabase. Exportez les données dans Paramètres avant d’actualiser.');
      return false;
    }
    return true;
  }
  async function refresh() {
    if (!connected) return;
    await saveQueue;
    if (!window.confirm(blocked
      ? 'Les modifications non sauvegardées seront perdues. Exportez un JSON depuis Paramètres avant de continuer. Recharger les données Supabase ?'
      : 'Récupérer les dernières données Supabase ? Fermez d’abord les formulaires en cours.')) return;
    try {
      const { data, error } = await client.from('cpr_store').select('payload,revision').eq('id',1).single();
      if (error || !data) throw (error || new Error('Données non disponibles'));
      if (validateData(data.payload)) db = structuredClone(data.payload);
      else if (!data.payload || Object.keys(data.payload).length === 0) db = initial();
      else throw new Error('Format des données invalide');
      revision = Number(data.revision);
      blocked = false;
      setSync('✓ Données à jour');
      closeModal();
      render();
    } catch (error) {
      setSync('⚠ Actualisation échouée','error');
      window.alert(error.message);
    }
  }
  async function logout() {
    if (connected) await saveQueue;
    await client.auth.signOut();
    connected = false;
    currentUserId = null;
    db = initial();
    closeModal();
    message('Vous êtes déconnecté.');
    showAuth('loginForm');
  }
  function disableWhileSubmitting(form, active) {
    const button = form.querySelector('button[type=submit]');
    button.disabled = active;
    button.textContent = active ? 'Veuillez patienter…' : button.dataset.originalTitle;
  }
  function attachForms() {
    if (formHandlersAttached) return;
    formHandlersAttached = true;
    for (const id of formIds) {
      const f = byId(id), b = f.querySelector('button[type=submit]');
      b.dataset.originalTitle = b.textContent;
    }
    byId('forgotLink').addEventListener('click', () => {
      message('');
      byId('forgotEmail').value = byId('loginEmail').value;
      showAuth('forgotForm');
    });
    document.querySelectorAll('.auth-back').forEach(b => b.addEventListener('click', () => {
      message('');
      showAuth('loginForm');
    }));
    byId('loginForm').addEventListener('submit', async e => {
      e.preventDefault();
      if (!client) return message('Supabase n’est pas encore configuré.','error');
      const form = e.currentTarget;
      disableWhileSubmitting(form,true);
      message('Connexion en cours…');
      try {
        const { error } = await client.auth.signInWithPassword({
          email: byId('loginEmail').value.trim(), password: byId('loginPassword').value
        });
        byId('loginPassword').value = '';
        if (error) message('Identifiants incorrects ou compte non confirmé.', 'error');
        else await authorizeAndLoad();
      } catch (_) {
        message('Connexion momentanément impossible. Vérifiez votre accès Internet et réessayez.','error');
      } finally {
        disableWhileSubmitting(form,false);
      }
    });
    byId('forgotForm').addEventListener('submit', async e => {
      e.preventDefault();
      if (!client) return message('Supabase n’est pas configuré.','error');
      const form = e.currentTarget;
      disableWhileSubmitting(form,true);
      const url = new URL(window.location.href);
      url.hash = '';
      url.search = '';
      try {
        const { error } = await client.auth.resetPasswordForEmail(byId('forgotEmail').value.trim(), {
          redirectTo: url.toString()
        });
        if (error) message('Envoi impossible : ' + error.message,'error');
        else message('Si cette adresse correspond à un compte, un e-mail de réinitialisation sera envoyé. Vérifiez aussi les spams.','ok');
      } catch (_) {
        message('Envoi impossible pour le moment. Vérifiez la connexion Internet.', 'error');
      } finally {
        disableWhileSubmitting(form,false);
      }
    });
    byId('newPasswordForm').addEventListener('submit', async e => {
      e.preventDefault();
      if (!client) return;
      const password = byId('newPassword').value;
      if (password.length < 12) return message('Utilisez au moins 12 caractères.', 'error');
      if (password !== byId('confirmPassword').value) return message('Les deux mots de passe sont différents.', 'error');
      const form = e.currentTarget;
      disableWhileSubmitting(form,true);
      try {
        const { error } = await client.auth.updateUser({ password });
        if (error) return message('Modification impossible : ' + error.message, 'error');
        recoveryMode = false;
        await client.auth.signOut();
        try { history.replaceState({}, '', location.pathname); } catch (_) { /* Fichier de test local. */ }
        byId('newPassword').value = '';
        byId('confirmPassword').value = '';
        showAuth('loginForm');
        message('Mot de passe modifié. Connectez-vous avec le nouveau mot de passe.','ok');
      } catch (_) {
        message('Impossible de mettre à jour le mot de passe. Réessayez.', 'error');
      } finally {
        disableWhileSubmitting(form,false);
      }
    });
    byId('logoutBtn').addEventListener('click',logout);
    byId('refreshBtn').addEventListener('click',refresh);
  }
  async function init() {
    showAuth();
    attachForms();
    if (!isConfigured()) {
      message('Configuration requise : renseignez l’URL Supabase et la clé publique dans config.js, puis exécutez supabase/setup.sql. Consultez le README.','error');
      return;
    }
    if (!window.supabase?.createClient) {
      message('Impossible de charger la bibliothèque Supabase. Vérifiez la connexion Internet.','error');
      return;
    }
    try {
      client = window.supabase.createClient(window.CPR_SUPABASE_URL,window.CPR_SUPABASE_ANON_KEY,{
        auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}
      });
      client.auth.onAuthStateChange((event,session) => {
        if (event === 'PASSWORD_RECOVERY') {
          recoveryMode = true;
          showAuth('newPasswordForm');
          message('Lien de réinitialisation reconnu. Choisissez votre nouveau mot de passe.');
        } else if (event === 'SIGNED_OUT') {
          connected = false;
          currentUserId = null;
          showAuth();
        } else if (event === 'SIGNED_IN' && !recoveryMode && session) {
          // Différer la requête Supabase hors du callback d'authentification.
          setTimeout(authorizeAndLoad, 0);
        }
      });
      const {data:{session},error} = await client.auth.getSession();
      if (error) throw error;
      if (recoveryMode) {
        showAuth('newPasswordForm');
        message('Choisissez un nouveau mot de passe.');
      } else if (session) {
        await authorizeAndLoad();
      } else {
        message('Connectez-vous avec votre compte administrateur CPR.');
      }
    } catch (error) {
      showAuth();
      message('Erreur Supabase : ' + (error.message || 'connexion impossible'),'error');
    }
  }
  window.CPR_AUTH = { init, save, refresh, ensureWritable, validateData };
})();
