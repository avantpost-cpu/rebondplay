// ============================================================
// SUPABASE — VRAI / FAUX REBOND
// ============================================================

(() => {

    // --------------------------------------------------------
    // Vérification configuration
    // --------------------------------------------------------

    if (!window.VF_SUPABASE_URL) {
        console.error(
            "VRAI/FAUX : VF_SUPABASE_URL est manquant."
        );
        return;
    }

    if (!window.VF_SUPABASE_ANON_KEY) {
        console.error(
            "VRAI/FAUX : VF_SUPABASE_ANON_KEY est manquant."
        );
        return;
    }

    if (!window.supabase) {
        console.error(
            "VRAI/FAUX : la bibliothèque Supabase n'est pas chargée."
        );
        return;
    }


    // --------------------------------------------------------
    // Client Supabase
    // --------------------------------------------------------

    const client = window.supabase.createClient(
        window.VF_SUPABASE_URL,
        window.VF_SUPABASE_ANON_KEY
    );


    // ========================================================
    // STOCKAGE LOCAL DE LA PARTIE
    // ========================================================

    const STORAGE_ID = "rebond_vf_partie_id";
    const STORAGE_KEY = "rebond_vf_cle_validation";


    function sauvegarderPartie(partieId, cleValidation) {

        sessionStorage.setItem(
            STORAGE_ID,
            partieId
        );

        sessionStorage.setItem(
            STORAGE_KEY,
            cleValidation
        );

    }


    function lirePartie() {

        return {
            partieId:
                sessionStorage.getItem(STORAGE_ID),

            cleValidation:
                sessionStorage.getItem(STORAGE_KEY)
        };

    }


    function effacerPartie() {

        sessionStorage.removeItem(STORAGE_ID);
        sessionStorage.removeItem(STORAGE_KEY);

    }


    // ========================================================
    // CRÉER UNE PARTIE
    // ========================================================

    async function creerPartie({
        prenom = "",
        nom = "",
        structure = "",
        fonction = ""
    } = {}) {

        try {

            const { data, error } =
                await client.rpc(
                    "vf_creer_partie",
                    {
                        p_prenom: prenom,
                        p_nom: nom,
                        p_structure: structure,
                        p_fonction: fonction
                    }
                );


            if (error) {

                console.error(
                    "VRAI/FAUX — erreur création partie :",
                    error
                );

                throw error;

            }


            if (!data || data.length === 0) {

                throw new Error(
                    "Supabase n'a retourné aucune partie."
                );

            }


            const partie = data[0];


            if (
                !partie.partie_id ||
                !partie.cle_validation
            ) {

                console.error(
                    "Réponse Supabase inattendue :",
                    partie
                );

                throw new Error(
                    "Identifiant de partie incomplet."
                );

            }


            sauvegarderPartie(
                partie.partie_id,
                partie.cle_validation
            );


            console.log(
                "VRAI/FAUX — partie créée :",
                partie.partie_id
            );


            return {
                success: true,

                partieId:
                    partie.partie_id,

                cleValidation:
                    partie.cle_validation
            };


        } catch (error) {

            console.error(
                "VRAI/FAUX — creerPartie() :",
                error
            );


            return {
                success: false,
                error
            };

        }

    }


    // ========================================================
    // ENREGISTRER UNE RÉPONSE
    // ========================================================

    async function enregistrerReponse({

        questionNumero,
        question,
        reponse,
        bonneReponse

    }) {

        const partie =
            lirePartie();


        if (
            !partie.partieId ||
            !partie.cleValidation
        ) {

            console.error(
                "VRAI/FAUX : aucune partie active."
            );

            return {
                success: false,
                error: new Error(
                    "Aucune partie active."
                )
            };

        }


        try {

            const { data, error } =
                await client.rpc(
                    "vf_enregistrer_reponse",
                    {
                        p_partie_id:
                            partie.partieId,

                        p_cle_validation:
                            partie.cleValidation,

                        p_question_numero:
                            questionNumero,

                        p_question:
                            question,

                        p_reponse:
                            reponse,

                        p_bonne_reponse:
                            bonneReponse
                    }
                );


            if (error) {

                console.error(
                    "VRAI/FAUX — erreur réponse :",
                    error
                );

                throw error;

            }


            if (data !== true) {

                throw new Error(
                    "La réponse n'a pas été enregistrée."
                );

            }


            return {
                success: true
            };


        } catch (error) {

            console.error(
                "VRAI/FAUX — enregistrerReponse() :",
                error
            );


            return {
                success: false,
                error
            };

        }

    }


    // ========================================================
    // TERMINER UNE PARTIE
    // ========================================================

    async function terminerPartie(score) {

        const partie =
            lirePartie();


        if (
            !partie.partieId ||
            !partie.cleValidation
        ) {

            console.error(
                "VRAI/FAUX : aucune partie active."
            );

            return {
                success: false,
                error: new Error(
                    "Aucune partie active."
                )
            };

        }


        try {

            const { data, error } =
                await client.rpc(
                    "vf_terminer_partie",
                    {
                        p_partie_id:
                            partie.partieId,

                        p_cle_validation:
                            partie.cleValidation,

                        p_score:
                            score
                    }
                );


            if (error) {

                console.error(
                    "VRAI/FAUX — erreur fin de partie :",
                    error
                );

                throw error;

            }


            if (data !== true) {

                throw new Error(
                    "La partie n'a pas pu être terminée."
                );

            }


            console.log(
                "VRAI/FAUX — partie terminée."
            );


            return {
                success: true
            };


        } catch (error) {

            console.error(
                "VRAI/FAUX — terminerPartie() :",
                error
            );


            return {
                success: false,
                error
            };

        }

    }


    // ========================================================
    // NOUVELLE PARTIE
    // ========================================================

    function nouvellePartie() {

        effacerPartie();

    }


    // ========================================================
    // API PUBLIQUE
    // ========================================================

    window.VraiFauxSupabase = {

        creerPartie,

        enregistrerReponse,

        terminerPartie,

        lirePartie,

        nouvellePartie

    };


})();
