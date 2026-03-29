import React, { useState } from 'react';
import { supabase } from './supabase';
import './App.css';

const ADMIN_PASSWORD = 'admin123';

const MISSIONS_FACILES = [
  "Fais rire ta cible sans dire un mot",
  "Fais trinquer ta cible avec toi",
  "Fais prendre une photo de groupe avec ta cible",
  "Fais dire 'santé' à ta cible",
  "Fais donner un conseil de vie à ta cible",
  "Fais chanter un refrain à ta cible",
  "Fais mimer un animal à ta cible",
  "Fais dire un compliment à ta cible",
  "Fais poser ta cible comme une statue",
  "Fais compter jusqu'à 10 en anglais à ta cible",
];

const MISSIONS_NORMALES = [
  "Fais prendre une photo avec un inconnu à ta cible",
  "Fais inventer un cocktail à ta cible et lui donner un nom",
  "Fais danser ta cible pendant 10 secondes",
  "Fais raconter une blague à ta cible",
  "Fais faire 3 pompes à ta cible",
  "Fais imiter une célébrité à ta cible",
  "Fais dire un mot en japonais à ta cible",
  "Fais faire un discours de 30 secondes à ta cible",
  "Fais dessiner un autoportrait à ta cible en 1 minute",
  "Fais appeler quelqu'un par un prénom qui n'est pas le sien à ta cible",
];

const MISSIONS_DIFFICILES = [
  "Fais chanter ta cible à voix haute devant tout le monde",
  "Fais faire une déclaration d'amour fictive à ta cible",
  "Fais faire un karaoké improvisé à ta cible",
  "Fais avouer un secret (fictif ou vrai) à ta cible",
  "Fais ramper jusqu'à la cuisine à ta cible",
  "Fais porter quelque chose sur la tête pendant 5 minutes à ta cible",
  "Fais parler avec un accent étranger pendant 2 minutes à ta cible",
  "Fais faire un défilé de mode improvisé à ta cible",
  "Fais demander le numéro d'un inconnu à ta cible",
  "Fais faire 10 secondes de breakdance à ta cible",
];

function App() {
  const [pseudo, setPseudo] = useState('');
  const [code, setCode] = useState('');
  const [page, setPage] = useState('connexion');
  const [joueur, setJoueur] = useState(null);
  const [partie, setPartie] = useState(null);
  const [erreur, setErreur] = useState('');

  const handleConnexion = async () => {
    if (!pseudo || !code) {
      setErreur('Remplis tous les champs !');
      return;
    }

    if (pseudo.toLowerCase() === 'admin' && code === ADMIN_PASSWORD) {
      setPage('admin');
      return;
    }

    const { data: partieData, error: partieError } = await supabase
      .from('parties')
      .select('*')
      .eq('code', code)
      .single();

    if (partieError || !partieData) {
      setErreur('Code de partie invalide !');
      return;
    }

    setPartie(partieData);

    let { data: joueurGlobal } = await supabase
      .from('joueurs_global')
      .select('*')
      .eq('pseudo', pseudo)
      .maybeSingle();

    if (!joueurGlobal) {
      const { data: newJoueur } = await supabase
        .from('joueurs_global')
        .insert({ pseudo, parties_jouees: 0, parties_gagnees: 0, kills_total: 0 })
        .select()
        .single();
      joueurGlobal = newJoueur;
    }

    let { data: joueurPartie } = await supabase
      .from('joueurs_partie')
      .select('*')
      .eq('pseudo', pseudo)
      .eq('partie_id', partieData.id)
      .maybeSingle();

    if (!joueurPartie) {
      const { data: newJoueurPartie } = await supabase
        .from('joueurs_partie')
        .insert({ pseudo, partie_id: partieData.id, statut: 'vivant', kills_partie: 0 })
        .select()
        .single();
      joueurPartie = newJoueurPartie;
    }

    setJoueur({ 
  partie_id_joueur: joueurPartie.id,
  global_id: joueurGlobal.id,
  pseudo: joueurPartie.pseudo,
  statut: joueurPartie.statut,
  kills_partie: joueurPartie.kills_partie,
  cible_id: joueurPartie.cible_id,
  mission_id: joueurPartie.mission_id,
  ordre_elimination: joueurPartie.ordre_elimination,
  parties_jouees: joueurGlobal.parties_jouees,
  parties_gagnees: joueurGlobal.parties_gagnees,
  kills_total: joueurGlobal.kills_total,
  id: joueurPartie.id,
});
    setPage('joueur');
  };

  return (
    <div className="app">
      {page === 'connexion' && (
        <>
          <h1 className="titre">☠️ KILLER PARTY</h1>
          <div className="carte">
            <h2>Connexion</h2>
            {erreur && <p className="erreur">{erreur}</p>}
            <input
              className="input"
              type="text"
              placeholder="Ton pseudo"
              value={pseudo}
              onChange={(e) => { setPseudo(e.target.value); setErreur(''); }}
            />
            <input
              className="input"
              type={pseudo.toLowerCase() === 'admin' ? 'password' : 'text'}
              placeholder={pseudo.toLowerCase() === 'admin' ? 'Mot de passe admin' : 'Code de la partie'}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button className="btn-kill" onClick={handleConnexion}>
              ENTRER
            </button>
          </div>
        </>
      )}

      {page === 'joueur' && joueur && partie && (
        <PageJoueur joueur={joueur} partie={partie} setJoueur={setJoueur} />
      )}

      {page === 'admin' && (
        <PageAdmin partie={partie} setPartie={setPartie} />
      )}
    </div>
  );
}

function PageJoueur({ joueur, partie, setJoueur }) {
  const [message, setMessage] = useState('');
  const [missionTexte, setMissionTexte] = useState(null);

  const actualiser = async () => {
  const { data: joueurPartie } = await supabase
    .from('joueurs_partie')
    .select('*')
    .eq('pseudo', joueur.pseudo)
    .eq('partie_id', partie.id)
    .single();

  if (joueurPartie) {
    setJoueur((prev) => ({ ...prev, ...joueurPartie, id: joueurPartie.id }));
  }

  const { data: joueurGlobal } = await supabase
    .from('joueurs_global')
    .select('*')
    .eq('pseudo', joueur.pseudo)
    .single();

  if (joueurGlobal) {
    setJoueur((prev) => ({ ...prev, parties_jouees: joueurGlobal.parties_jouees, parties_gagnees: joueurGlobal.parties_gagnees, kills_total: joueurGlobal.kills_total }));
  }

  // Vérifie si la partie est terminée et s'il est le gagnant
  const { data: partieActuelle } = await supabase
    .from('parties')
    .select('*')
    .eq('id', partie.id)
    .single();

  if (partieActuelle?.statut === 'terminée') {
    const { data: joueursVivants } = await supabase
      .from('joueurs_partie')
      .select('*')
      .eq('partie_id', partie.id)
      .eq('statut', 'vivant');

    if (joueursVivants && joueursVivants.length === 1 && joueursVivants[0].pseudo === joueur.pseudo) {
      setMessage('🏆 Tu as gagné la partie ! Félicitations !');
    }
  }
};

  React.useEffect(() => {
    if (joueur.mission_id) {
      supabase
        .from('missions')
        .select('texte')
        .eq('id', joueur.mission_id)
        .single()
        .then(({ data }) => setMissionTexte(data?.texte || null));
    }
  }, [joueur.mission_id]);

  const handleJaiKill = async () => {
  // Cherche l'id réel du joueur dans joueurs_partie
  const { data: moi } = await supabase
    .from('joueurs_partie')
    .select('*')
    .eq('pseudo', joueur.pseudo)
    .eq('partie_id', partie.id)
    .single();

  if (!moi) {
    setMessage("Joueur introuvable !");
    return;
  }

  if (!moi.cible_id) {
    setMessage("Tu n'as pas de cible assignée !");
    return;
  }

  const { data: killExistant } = await supabase
    .from('kills_en_attente')
    .select('*')
    .eq('tueur_id', moi.id)
    .maybeSingle();

  if (killExistant) {
    setMessage('Kill déjà en attente de confirmation !');
    return;
  }

  const { error } = await supabase.from('kills_en_attente').insert({
    partie_id: partie.id,
    tueur_id: moi.id,
    victime_id: moi.cible_id,
  });

  if (error) {
    setMessage('Erreur : ' + error.message);
    return;
  }

  setMessage('✅ Kill déclaré ! En attente de confirmation de ta cible...');
};

  const handleJaiEteKill = async () => {
  const { data: moi } = await supabase
    .from('joueurs_partie')
    .select('*')
    .eq('pseudo', joueur.pseudo)
    .eq('partie_id', partie.id)
    .single();

  if (!moi) {
    setMessage("Joueur introuvable !");
    return;
  }

  const { data: killEnAttente } = await supabase
    .from('kills_en_attente')
    .select('*')
    .eq('victime_id', moi.id)
    .maybeSingle();

  if (!killEnAttente) {
    setMessage("Personne n'a déclaré t'avoir tué !");
    return;
  }

  // Élimine la victime
  await supabase
    .from('joueurs_partie')
    .update({ statut: 'éliminé' })
    .eq('id', moi.id);

  // Récupère le tueur
  const { data: tueur } = await supabase
    .from('joueurs_partie')
    .select('*')
    .eq('id', killEnAttente.tueur_id)
    .single();

  // Met à jour le tueur dans joueurs_partie
  await supabase
    .from('joueurs_partie')
    .update({
      cible_id: moi.cible_id,
      mission_id: moi.mission_id,
      kills_partie: (tueur.kills_partie || 0) + 1,
    })
    .eq('id', killEnAttente.tueur_id);

  // Met à jour les stats globales du tueur
  const { data: tueurGlobal } = await supabase
    .from('joueurs_global')
    .select('*')
    .eq('pseudo', tueur.pseudo)
    .single();

  if (tueurGlobal) {
    await supabase
      .from('joueurs_global')
      .update({ kills_total: (tueurGlobal.kills_total || 0) + 1 })
      .eq('pseudo', tueur.pseudo);
  }

  // Supprime le kill en attente
  await supabase.from('kills_en_attente').delete().eq('id', killEnAttente.id);

  // Vérifie les joueurs vivants
  const { data: joueursVivants } = await supabase
    .from('joueurs_partie')
    .select('*')
    .eq('partie_id', partie.id)
    .eq('statut', 'vivant');

  // Fin de partie
  if (joueursVivants && joueursVivants.length === 1) {
    const gagnant = joueursVivants[0];

    // Termine la partie
    await supabase
      .from('parties')
      .update({ statut: 'terminée' })
      .eq('id', partie.id);

    // Met à jour les stats globales de tous les joueurs de la partie
    const { data: tousJoueurs } = await supabase
      .from('joueurs_partie')
      .select('*')
      .eq('partie_id', partie.id);

    for (const j of tousJoueurs) {
      const { data: jGlobal } = await supabase
        .from('joueurs_global')
        .select('*')
        .eq('pseudo', j.pseudo)
        .single();

      if (jGlobal) {
        await supabase
          .from('joueurs_global')
          .update({
            parties_jouees: (jGlobal.parties_jouees || 0) + 1,
            parties_gagnees: j.pseudo === gagnant.pseudo
              ? (jGlobal.parties_gagnees || 0) + 1
              : jGlobal.parties_gagnees,
          })
          .eq('pseudo', j.pseudo);
      }
    }

    setJoueur((prev) => ({ ...prev, statut: 'éliminé' }));
    setMessage(`💀 Tu as été éliminé ! 🏆 ${gagnant.pseudo} remporte la partie !`);
    return;
  }

  setJoueur((prev) => ({ ...prev, statut: 'éliminé' }));
  setMessage('💀 Tu as été éliminé. Bonne chance pour la prochaine fois !');
};

  return (
    <>
      <h1 className="titre">☠️ KILLER PARTY</h1>
      <div className="carte">
        <h2>Bienvenue, {joueur.pseudo}</h2>
        <div className="info-bloc">
          <p>🎯 <strong>Statut :</strong> {joueur.statut}</p>
          <p>🏆 <strong>Kills :</strong> {joueur.kills_partie || 0}</p>
          <p>🕐 <strong>Début :</strong> {partie.heure_debut ? new Date(partie.heure_debut).toLocaleTimeString() : 'Non défini'}</p>
          <p>🕐 <strong>Fin :</strong> {partie.heure_fin ? new Date(partie.heure_fin).toLocaleTimeString() : 'Non défini'}</p>
        </div>

        {missionTexte && (
          <div style={{ background: '#0a0a0a', border: '1px solid #cc0000', borderRadius: '8px', padding: '12px', marginTop: '10px' }}>
            <p style={{ color: '#cc0000', fontSize: '0.85rem', marginBottom: '4px' }}>🎯 TA MISSION</p>
            <p style={{ color: '#ffffff' }}>{missionTexte}</p>
          </div>
        )}

        {joueur.cible_id && (
          <div style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', padding: '12px', marginTop: '10px' }}>
            <p style={{ color: '#999', fontSize: '0.85rem', marginBottom: '4px' }}>🎯 TA CIBLE</p>
            <CibleNom cibleId={joueur.cible_id} />
          </div>
        )}

        {message && <p className="message">{message}</p>}

        <button className="btn-victime" onClick={actualiser} style={{ marginBottom: '10px' }}>
          🔄 Actualiser
        </button>

        {joueur.statut !== 'éliminé' && (
          <>
            <button className="btn-kill" onClick={handleJaiKill}>🔪 J'AI KILL</button>
            <button className="btn-victime" onClick={handleJaiEteKill}>💀 J'AI ÉTÉ KILL</button>
          </>
        )}
        {joueur.statut === 'éliminé' && (
          <p className="elimine">Tu es éliminé ☠️</p>
        )}
      </div>
      <div className="carte" style={{ marginTop: '20px' }}>
        <h2>📊 Tes stats globales</h2>
        <p>Parties jouées : {joueur.parties_jouees}</p>
        <p>Parties gagnées : {joueur.parties_gagnees}</p>
        <p>Kills total : {joueur.kills_total}</p>
      </div>
    </>
  );
}

function CibleNom({ cibleId }) {
  const [nom, setNom] = useState('...');
  React.useEffect(() => {
    supabase.from('joueurs_partie').select('pseudo').eq('id', cibleId).single()
      .then(({ data }) => { if (data) setNom(data.pseudo); });
  }, [cibleId]);
  return <p style={{ color: '#ffffff', fontWeight: 'bold' }}>👤 {nom}</p>;
}

function PageAdmin({ partie, setPartie }) {
  const [joueurs, setJoueurs] = useState([]);
  const [missions, setMissions] = useState([]);
  const [toutes_parties, setToutesParties] = useState([]);
  const [message, setMessage] = useState('');
  const [vue, setVue] = useState('parties');
  const [chargementIA, setChargementIA] = useState(false);
  const [nouvelleMission, setNouvelleMission] = useState('');
  const [difficulteEdit, setDifficulteEdit] = useState('normal');
  const [nouvellePartie, setNouvellePartie] = useState({
    nom: '', code: '', difficulte: 'normal', heure_debut: '', heure_fin: '',
  });

  const getMissionsPool = (difficulte) => {
    if (difficulte === 'facile') return [...MISSIONS_FACILES];
    if (difficulte === 'difficile') return [...MISSIONS_DIFFICILES];
    return [...MISSIONS_NORMALES];
  };

  const chargerToutesParties = async () => {
    const { data } = await supabase.from('parties').select('*').order('id', { ascending: false });
    setToutesParties(data || []);
  };

  const chargerJoueurs = async (p = partie) => {
    if (!p) return;
    const { data } = await supabase
      .from('joueurs_partie').select('*').eq('partie_id', p.id)
      .order('kills_partie', { ascending: false });
    setJoueurs(data || []);
  };

  const chargerMissions = async (p = partie) => {
    if (!p) return;
    const { data } = await supabase.from('missions').select('*').eq('partie_id', p.id);
    setMissions(data || []);
  };

  React.useEffect(() => {
    chargerToutesParties();
  }, []);

  React.useEffect(() => {
    if (partie) {
      chargerJoueurs();
      chargerMissions();
    }
  }, [partie]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectionnerPartie = (p) => {
    setPartie(p);
    setVue('dashboard');
    setMessage('');
  };

  const genererMissions = async () => {
    const { data: joueursActuels } = await supabase
      .from('joueurs_partie').select('*').eq('partie_id', partie.id)
      .order('kills_partie', { ascending: false });

    if (!joueursActuels || joueursActuels.length === 0) {
      setMessage('Aucun joueur dans la partie !');
      return;
    }

    setJoueurs(joueursActuels);
    setChargementIA(true);
    setMessage('🎲 Génération des missions...');

    const pool = getMissionsPool(partie.difficulte);
    const selectionnees = [...pool].sort(() => Math.random() - 0.5).slice(0, joueursActuels.length);

    try {
      const { error: deleteError } = await supabase.from('missions').delete().eq('partie_id', partie.id);
      if (deleteError) { setMessage('Erreur suppression : ' + deleteError.message); setChargementIA(false); return; }

      const { error: insertError } = await supabase.from('missions').insert(
        selectionnees.map((texte, index) => ({
          texte, difficulte: partie.difficulte, partie_id: partie.id,
          joueur_pseudo: joueursActuels[index]?.pseudo || null, statut: 'brouillon',
        }))
      );
      if (insertError) { setMessage('Erreur insertion : ' + insertError.message); setChargementIA(false); return; }

      await chargerMissions();
      setMessage('✅ Missions générées ! Vérifie et valide-les ci-dessous.');
    } catch (error) {
      setMessage('Erreur : ' + error.message);
    }
    setChargementIA(false);
  };

  const validerMissions = async () => {
    const { data: missionsActuelles } = await supabase.from('missions').select('*').eq('partie_id', partie.id);
    if (!missionsActuelles || missionsActuelles.length === 0) { setMessage('Aucune mission à valider !'); return; }

    const { error: updateError } = await supabase.from('missions')
      .update({ statut: 'validée' }).eq('partie_id', partie.id).eq('statut', 'brouillon');
    if (updateError) { setMessage('Erreur validation : ' + updateError.message); return; }

    const { data: joueursActuels } = await supabase.from('joueurs_partie').select('*').eq('partie_id', partie.id);
    if (!joueursActuels || joueursActuels.length === 0) { setMessage('Aucun joueur trouvé !'); return; }

    let joueursMelanges;
    let tentatives = 0;
    do {
      joueursMelanges = [...joueursActuels].sort(() => Math.random() - 0.5);
      tentatives++;
    } while (
      joueursActuels.some((j, i) => j.id === joueursMelanges[(i + 1) % joueursMelanges.length].id) &&
      tentatives < 100
    );

    for (let i = 0; i < joueursActuels.length; i++) { // eslint-disable-line no-loop-func
      const joueur = joueursActuels[i];
      const cible = joueursMelanges[(i + 1) % joueursMelanges.length];
      const mission = missionsActuelles[i];
      const { error } = await supabase.from('joueurs_partie')
        .update({ cible_id: cible.id, mission_id: mission?.id || null })
        .eq('id', joueur.id);
      if (error) { setMessage('Erreur attribution : ' + error.message); return; }
    }

    await chargerJoueurs();
    setMessage('✅ Missions validées et cibles attribuées !');
  };

  const ajouterMissionPool = (difficulte) => {
    if (!nouvelleMission.trim()) return;
    if (difficulte === 'facile') MISSIONS_FACILES.push(nouvelleMission.trim());
    else if (difficulte === 'difficile') MISSIONS_DIFFICILES.push(nouvelleMission.trim());
    else MISSIONS_NORMALES.push(nouvelleMission.trim());
    setNouvelleMission('');
    setMessage('✅ Mission ajoutée au pool !');
  };

  const supprimerMissionPool = (difficulte, index) => {
    if (difficulte === 'facile') MISSIONS_FACILES.splice(index, 1);
    else if (difficulte === 'difficile') MISSIONS_DIFFICILES.splice(index, 1);
    else MISSIONS_NORMALES.splice(index, 1);
    setMessage('🗑️ Mission supprimée !');
  };
  const supprimerJoueur = async (joueurId, joueurPseudo) => {
  // Supprime le joueur de la partie uniquement (pas les stats globales)
  await supabase.from('kills_en_attente').delete().eq('tueur_id', joueurId);
  await supabase.from('kills_en_attente').delete().eq('victime_id', joueurId);
  await supabase.from('joueurs_partie').delete().eq('id', joueurId);
  await chargerJoueurs();
  setMessage(`🗑️ ${joueurPseudo} supprimé de la partie !`);
};
  const supprimerPartie = async (partieId) => {
  await supabase.from('kills_en_attente').delete().eq('partie_id', partieId);
  await supabase.from('missions').delete().eq('partie_id', partieId);
  await supabase.from('joueurs_partie').delete().eq('partie_id', partieId);
  await supabase.from('parties').delete().eq('id', partieId);

  if (partie?.id === partieId) {
    setPartie(null);
    setVue('parties');
  }

  await chargerToutesParties();
  setMessage('🗑️ Partie supprimée !');
};
  const creerPartie = async () => {
    if (!nouvellePartie.nom || !nouvellePartie.code) { setMessage('Remplis le nom et le code !'); return; }
    const { data, error } = await supabase.from('parties').insert({
      nom: nouvellePartie.nom, code: nouvellePartie.code, difficulte: nouvellePartie.difficulte,
      heure_debut: nouvellePartie.heure_debut || null, heure_fin: nouvellePartie.heure_fin || null,
      statut: 'en_attente',
    }).select().single();

    if (error) { setMessage('Erreur : ' + error.message); }
    else {
      setPartie(data);
      setNouvellePartie({ nom: '', code: '', difficulte: 'normal', heure_debut: '', heure_fin: '' });
      await chargerToutesParties();
      setMessage('✅ Partie créée ! Code : ' + data.code);
      setVue('dashboard');
    }
  };

  const lancerPartie = async () => {
    await supabase.from('parties').update({ statut: 'en_cours' }).eq('id', partie.id);
    setMessage('🚀 Partie lancée !');
    chargerToutesParties();
  };

  const terminerPartie = async () => {
    await supabase.from('parties').update({ statut: 'terminée' }).eq('id', partie.id);
    setMessage('🏁 Partie terminée !');
    chargerToutesParties();
  };

  const poolActuel = getMissionsPool(difficulteEdit);

  return (
    <>
      <h1 className="titre">☠️ KILLER PARTY</h1>

      {/* Navigation */}
      <div className="carte" style={{ flexDirection: 'row', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
  <button className={vue === 'parties' ? 'btn-kill' : 'btn-victime'} onClick={() => { setVue('parties'); chargerToutesParties(); }} style={{ flex: 1 }}>🗂️ Parties</button>
  <button className={vue === 'dashboard' ? 'btn-kill' : 'btn-victime'} onClick={() => partie && setVue('dashboard')} style={{ flex: 1, opacity: partie ? 1 : 0.4 }}>Dashboard</button>
  <button className={vue === 'joueurs' ? 'btn-kill' : 'btn-victime'} onClick={() => { partie && setVue('joueurs'); partie && chargerJoueurs(); }} style={{ flex: 1, opacity: partie ? 1 : 0.4 }}>👥 Joueurs</button>
  <button className={vue === 'missions' ? 'btn-kill' : 'btn-victime'} onClick={() => partie && setVue('missions')} style={{ flex: 1, opacity: partie ? 1 : 0.4 }}>🎲 Missions</button>
  <button className={vue === 'editer' ? 'btn-kill' : 'btn-victime'} onClick={() => setVue('editer')} style={{ flex: 1 }}>📝 Éditer</button>
  <button className={vue === 'creer' ? 'btn-kill' : 'btn-victime'} onClick={() => setVue('creer')} style={{ flex: 1 }}>+ Nouvelle</button>
</div>

      {/* Liste des parties */}
      {vue === 'parties' && (
  <div className="carte">
    <h2>🗂️ Mes Parties</h2>
    {message && <p className="message">{message}</p>}
    {toutes_parties.length === 0 && (
      <p style={{ color: '#666', textAlign: 'center' }}>Aucune partie. Crées-en une !</p>
    )}
    {toutes_parties.map((p) => (
      <div key={p.id} className="joueur-ligne" style={{ flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{ color: '#ffffff', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}
            onClick={() => selectionnerPartie(p)}
          >
            {p.nom}
          </span>
          <button
            onClick={() => supprimerPartie(p.id)}
            style={{
              background: 'transparent',
              border: '1px solid #cc0000',
              color: '#cc0000',
              borderRadius: '6px',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            🗑️
          </button>
        </div>
        <span style={{ color: '#999', fontSize: '0.85rem' }}>
          Code : {p.code} — {p.statut}
        </span>
        {partie?.id === p.id && (
          <span style={{ color: '#cc0000', fontSize: '0.8rem' }}>✅ Sélectionnée</span>
        )}
      </div>
    ))}
  </div>
)}

      {/* Dashboard */}
      {vue === 'dashboard' && partie && (
        <>
          <div className="carte">
            <h2>👑 {partie.nom}</h2>
            <p>Code : <strong>{partie.code}</strong></p>
            <p>Statut : <strong>{partie.statut}</strong></p>
            <p>🕐 Début : {partie.heure_debut ? new Date(partie.heure_debut).toLocaleString() : 'Non défini'}</p>
            <p>🕐 Fin : {partie.heure_fin ? new Date(partie.heure_fin).toLocaleString() : 'Non défini'}</p>
            {message && <p className="message">{message}</p>}
            <button className="btn-kill" onClick={lancerPartie}>🚀 LANCER LA PARTIE</button>
            <button className="btn-victime" onClick={terminerPartie}>🏁 TERMINER LA PARTIE</button>
          </div>
          <div className="carte" style={{ marginTop: '20px' }}>
            <h2>🏆 Classement</h2>
            <button className="btn-kill" onClick={() => chargerJoueurs()} style={{ marginBottom: '15px' }}>🔄 Actualiser</button>
            {joueurs.length === 0 && <p style={{ color: '#666', textAlign: 'center' }}>Aucun joueur pour l'instant</p>}
            {joueurs.map((j, index) => (
              <div key={j.id} className="joueur-ligne">
                <span>#{index + 1} {j.pseudo}</span>
                <span>{j.kills_partie} kills — {j.statut}</span>
              </div>
            ))}
          </div>
        </>
      )}
      {vue === 'joueurs' && partie && (
  <div className="carte">
    <h2>👥 Joueurs — {partie.nom}</h2>
    {message && <p className="message">{message}</p>}
    <button className="btn-kill" onClick={() => chargerJoueurs()} style={{ marginBottom: '15px' }}>
      🔄 Actualiser
    </button>
    {joueurs.length === 0 && (
      <p style={{ color: '#666', textAlign: 'center' }}>Aucun joueur connecté</p>
    )}
    {joueurs.map((j) => (
      <div key={j.id} className="joueur-ligne" style={{ alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ color: '#ffffff', fontWeight: 'bold' }}>👤 {j.pseudo}</span>
          <span style={{ color: '#999', fontSize: '0.8rem' }}>
            {j.statut} — {j.kills_partie} kill(s)
          </span>
          <span style={{ color: j.cible_id ? '#cc0000' : '#666', fontSize: '0.8rem' }}>
            {j.cible_id ? '🎯 Cible assignée' : '⚠️ Pas de cible'}
          </span>
        </div>
        <button
          onClick={() => supprimerJoueur(j.id, j.pseudo)}
          style={{
            background: 'transparent',
            border: '1px solid #cc0000',
            color: '#cc0000',
            borderRadius: '6px',
            padding: '4px 8px',
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          🗑️
        </button>
      </div>
    ))}
  </div>
)}
      {/* Générer missions */}
      {vue === 'missions' && partie && (
        <div className="carte">
          <h2>🎲 Missions — {partie.nom}</h2>
          <p style={{ color: '#999', fontSize: '0.9rem', textAlign: 'center' }}>
            Difficulté : {partie.difficulte}
          </p>
          {message && <p className="message">{message}</p>}
          <button className="btn-kill" onClick={genererMissions} disabled={chargementIA}>
            {chargementIA ? '⏳ Génération...' : '🎲 GÉNÉRER LES MISSIONS'}
          </button>
          {missions.length > 0 && (
            <>
              <div style={{ marginTop: '15px' }}>
                {missions.map((m, index) => (
                  <div key={m.id} className="joueur-ligne" style={{ flexDirection: 'column', gap: '4px' }}>
                    <span style={{ color: '#cc0000', fontSize: '0.85rem' }}>👤 {m.joueur_pseudo || `Joueur ${index + 1}`}</span>
                    <span style={{ color: '#cccccc' }}>🎯 {m.texte}</span>
                    <span style={{ color: '#666', fontSize: '0.8rem' }}>Statut : {m.statut}</span>
                  </div>
                ))}
              </div>
              {missions.some(m => m.statut === 'brouillon') && (
                <button className="btn-kill" onClick={validerMissions} style={{ marginTop: '15px' }}>
                  ✅ VALIDER ET ATTRIBUER LES CIBLES
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Éditer le pool de missions */}
      {vue === 'editer' && (
        <div className="carte">
          <h2>📝 Éditer les missions</h2>
          {message && <p className="message">{message}</p>}
          <select className="input" value={difficulteEdit} onChange={(e) => setDifficulteEdit(e.target.value)}>
            <option value="facile">😊 Facile</option>
            <option value="normal">⚔️ Normal</option>
            <option value="difficile">💀 Difficile</option>
          </select>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <input className="input" type="text" placeholder="Nouvelle mission..." value={nouvelleMission}
              onChange={(e) => setNouvelleMission(e.target.value)} style={{ flex: 1 }} />
            <button className="btn-kill" onClick={() => ajouterMissionPool(difficulteEdit)}
              style={{ padding: '10px 16px', fontSize: '1.2rem' }}>+</button>
          </div>
          <div style={{ marginTop: '15px' }}>
            <p style={{ color: '#999', fontSize: '0.85rem', marginBottom: '8px' }}>
              {poolActuel.length} missions — {difficulteEdit}
            </p>
            {poolActuel.map((m, index) => (
              <div key={index} className="joueur-ligne" style={{ alignItems: 'center' }}>
                <span style={{ color: '#cccccc', flex: 1, fontSize: '0.9rem' }}>🎯 {m}</span>
                <button onClick={() => supprimerMissionPool(difficulteEdit, index)}
                  style={{ background: 'transparent', border: '1px solid #cc0000', color: '#cc0000', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}>
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Créer une partie */}
      {vue === 'creer' && (
        <div className="carte">
          <h2>➕ Nouvelle Partie</h2>
          {message && <p className="message">{message}</p>}
          <input className="input" type="text" placeholder="Nom de la partie" value={nouvellePartie.nom}
            onChange={(e) => setNouvellePartie({ ...nouvellePartie, nom: e.target.value })} />
          <input className="input" type="text" placeholder="Code (ex: 5678)" value={nouvellePartie.code}
            onChange={(e) => setNouvellePartie({ ...nouvellePartie, code: e.target.value })} />
          <select className="input" value={nouvellePartie.difficulte}
            onChange={(e) => setNouvellePartie({ ...nouvellePartie, difficulte: e.target.value })}>
            <option value="facile">😊 Facile</option>
            <option value="normal">⚔️ Normal</option>
            <option value="difficile">💀 Difficile</option>
          </select>
          <label style={{ color: '#999', fontSize: '0.85rem' }}>Heure de début</label>
          <input className="input" type="datetime-local" value={nouvellePartie.heure_debut}
            onChange={(e) => setNouvellePartie({ ...nouvellePartie, heure_debut: e.target.value })} />
          <label style={{ color: '#999', fontSize: '0.85rem' }}>Heure de fin</label>
          <input className="input" type="datetime-local" value={nouvellePartie.heure_fin}
            onChange={(e) => setNouvellePartie({ ...nouvellePartie, heure_fin: e.target.value })} />
          <button className="btn-kill" onClick={creerPartie}>✅ CRÉER LA PARTIE</button>
        </div>
      )}
    </>
  );
}

export default App;