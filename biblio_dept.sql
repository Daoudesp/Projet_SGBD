-- ================================================
-- CREATION DE LA BASE DE DONNEES
-- ================================================

DROP DATABASE IF EXISTS biblio_dept;
CREATE DATABASE biblio_dept CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE biblio_dept;

-- ================================================
-- TABLE LIVRE
-- ================================================
CREATE TABLE Livre (
    isbn            VARCHAR(20)  NOT NULL,
    titre           VARCHAR(200) NOT NULL,
    auteur          VARCHAR(150) NOT NULL,
    categorie       VARCHAR(100) NOT NULL,
    nb_exemplaires  INT          NOT NULL DEFAULT 0,
    CONSTRAINT pk_livre PRIMARY KEY (isbn),
    CONSTRAINT chk_nb CHECK (nb_exemplaires >= 0)
);

-- ================================================
-- TABLE ADHERENT
-- ================================================
CREATE TABLE Adherent (
    num_adherent     INT          NOT NULL AUTO_INCREMENT,
    nom              VARCHAR(100) NOT NULL,
    prenom           VARCHAR(100) NOT NULL,
    filiere          ENUM('Génie Logiciel','Telecom') NOT NULL,
    niveau           VARCHAR(20)  NOT NULL,
    email            VARCHAR(150) NOT NULL,
    date_inscription DATE         NOT NULL DEFAULT (CURRENT_DATE),
    CONSTRAINT pk_adherent  PRIMARY KEY (num_adherent),
    CONSTRAINT uq_email     UNIQUE (email)
);

-- ================================================
-- TABLE EXEMPLAIRE
-- ================================================
CREATE TABLE Exemplaire (
    id_exemplaire  INT         NOT NULL AUTO_INCREMENT,
    etat           ENUM('disponible','emprunte','abime') NOT NULL DEFAULT 'disponible',
    isbn           VARCHAR(20) NOT NULL,
    CONSTRAINT pk_exemplaire    PRIMARY KEY (id_exemplaire),
    CONSTRAINT fk_exempl_livre  FOREIGN KEY (isbn)
        REFERENCES Livre(isbn)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ================================================
-- TABLE EMPRUNT
-- ================================================
CREATE TABLE Emprunt (
    id_emprunt          INT  NOT NULL AUTO_INCREMENT,
    date_emprunt        DATE NOT NULL DEFAULT (CURRENT_DATE),
    date_retour_prevue  DATE NOT NULL,
    date_retour_reelle  DATE NULL,
    num_adherent        INT  NOT NULL,
    id_exemplaire       INT  NOT NULL,
    CONSTRAINT pk_emprunt          PRIMARY KEY (id_emprunt),
    CONSTRAINT fk_empr_adherent    FOREIGN KEY (num_adherent)
        REFERENCES Adherent(num_adherent)
        ON DELETE RESTRICT,
    CONSTRAINT fk_empr_exemplaire  FOREIGN KEY (id_exemplaire)
        REFERENCES Exemplaire(id_exemplaire)
        ON DELETE RESTRICT
);

-- ================================================
-- TABLE AMENDE
-- ================================================
CREATE TABLE Amende (
    id_amende        INT           NOT NULL AUTO_INCREMENT,
    montant          DECIMAL(10,2) NOT NULL,
    statut_paiement  ENUM('paye','non_paye') NOT NULL DEFAULT 'non_paye',
    id_emprunt       INT           NOT NULL,
    CONSTRAINT pk_amende        PRIMARY KEY (id_amende),
    CONSTRAINT uq_emprunt       UNIQUE (id_emprunt),
    CONSTRAINT chk_montant      CHECK (montant > 0),
    CONSTRAINT fk_amende_empr   FOREIGN KEY (id_emprunt)
        REFERENCES Emprunt(id_emprunt)
        ON DELETE CASCADE
);

DELIMITER $$

-- ------------------------------------------------
-- TRIGGER 1 : Vérifications avant emprunt
-- Règle 1 : exemplaire non abîmé et non emprunté
-- Règle 2 : max 3 emprunts actifs par adhérent
-- Règle 3 : aucune amende impayée
-- Règle 4 : calcul automatique date_retour_prevue = J+14
-- ------------------------------------------------
CREATE TRIGGER trg_before_insert_emprunt
BEFORE INSERT ON Emprunt
FOR EACH ROW
BEGIN
    DECLARE v_etat       VARCHAR(20);
    DECLARE v_nb_actifs  INT;
    DECLARE v_nb_amendes INT;

    SELECT etat INTO v_etat
    FROM Exemplaire WHERE id_exemplaire = NEW.id_exemplaire;

    IF v_etat = 'abime' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Exemplaire abîmé : emprunt impossible.';
    END IF;

    IF v_etat = 'emprunte' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Exemplaire déjà emprunté.';
    END IF;

    SELECT COUNT(*) INTO v_nb_actifs
    FROM Emprunt
    WHERE num_adherent = NEW.num_adherent
      AND date_retour_reelle IS NULL;

    IF v_nb_actifs >= 3 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Maximum 3 emprunts actifs atteint.';
    END IF;

    SELECT COUNT(*) INTO v_nb_amendes
    FROM Amende a
    JOIN Emprunt e ON a.id_emprunt = e.id_emprunt
    WHERE e.num_adherent = NEW.num_adherent
      AND a.statut_paiement = 'non_paye';

    IF v_nb_amendes > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Adhérent bloqué : amendes impayées.';
    END IF;

    SET NEW.date_retour_prevue = DATE_ADD(NEW.date_emprunt, INTERVAL 14 DAY);
END$$

-- ------------------------------------------------
-- TRIGGER 2 : Exemplaire passe à 'emprunte' après emprunt
-- ------------------------------------------------
CREATE TRIGGER trg_after_insert_emprunt
AFTER INSERT ON Emprunt
FOR EACH ROW
BEGIN
    UPDATE Exemplaire SET etat = 'emprunte'
    WHERE id_exemplaire = NEW.id_exemplaire;
END$$

-- ------------------------------------------------
-- TRIGGER 3 : Calcul amende automatique au retour
-- 100 FCFA par jour de retard
-- ------------------------------------------------
CREATE TRIGGER trg_before_update_emprunt
BEFORE UPDATE ON Emprunt
FOR EACH ROW
BEGIN
    DECLARE v_retard INT;

    IF OLD.date_retour_reelle IS NULL AND NEW.date_retour_reelle IS NOT NULL THEN
        SET v_retard = DATEDIFF(NEW.date_retour_reelle, NEW.date_retour_prevue);

        IF v_retard > 0 THEN
            INSERT INTO Amende (montant, statut_paiement, id_emprunt)
            VALUES (v_retard * 100, 'non_paye', NEW.id_emprunt);
        END IF;
    END IF;
END$$

-- ------------------------------------------------
-- TRIGGER 4 : Exemplaire repasse à 'disponible' après retour
-- ------------------------------------------------
CREATE TRIGGER trg_after_update_emprunt
AFTER UPDATE ON Emprunt
FOR EACH ROW
BEGIN
    IF OLD.date_retour_reelle IS NULL AND NEW.date_retour_reelle IS NOT NULL THEN
        UPDATE Exemplaire SET etat = 'disponible'
        WHERE id_exemplaire = NEW.id_exemplaire;
    END IF;
END$$

DELIMITER ;

-- Vue 1 : Exemplaires disponibles avec infos du livre
CREATE VIEW vue_exemplaires_disponibles AS
SELECT e.id_exemplaire, l.titre, l.auteur, l.categorie, e.etat
FROM Exemplaire e
JOIN Livre l ON e.isbn = l.isbn
WHERE e.etat = 'disponible';

-- Vue 2 : Emprunts actifs avec jours de retard
CREATE VIEW vue_emprunts_actifs AS
SELECT
    em.id_emprunt,
    CONCAT(a.nom,' ',a.prenom) AS adherent,
    a.filiere,
    l.titre,
    em.date_emprunt,
    em.date_retour_prevue,
    DATEDIFF(CURDATE(), em.date_retour_prevue) AS jours_retard
FROM Emprunt em
JOIN Adherent a    ON em.num_adherent  = a.num_adherent
JOIN Exemplaire ex ON em.id_exemplaire = ex.id_exemplaire
JOIN Livre l       ON ex.isbn          = l.isbn
WHERE em.date_retour_reelle IS NULL;

-- Vue 3 : Amendes non payées avec infos adhérent
CREATE VIEW vue_amendes_impayees AS
SELECT
    am.id_amende,
    CONCAT(a.nom,' ',a.prenom) AS adherent,
    a.filiere,
    l.titre,
    am.montant,
    am.statut_paiement
FROM Amende am
JOIN Emprunt em    ON am.id_emprunt   = em.id_emprunt
JOIN Adherent a    ON em.num_adherent = a.num_adherent
JOIN Exemplaire ex ON em.id_exemplaire = ex.id_exemplaire
JOIN Livre l       ON ex.isbn          = l.isbn
WHERE am.statut_paiement = 'non_paye';

-- ================================================
-- INDEXS
-- ================================================
CREATE INDEX idx_emprunt_adherent  ON Emprunt(num_adherent);
CREATE INDEX idx_emprunt_retour    ON Emprunt(date_retour_reelle);
CREATE INDEX idx_exemplaire_isbn   ON Exemplaire(isbn);
CREATE INDEX idx_amende_statut     ON Amende(statut_paiement);

-- ================================================
-- INSERT LIVRES
-- ================================================
INSERT INTO Livre (isbn, titre, auteur, categorie, nb_exemplaires) VALUES
('978-2-07-036822-8', 'Le Petit Prince',              'Antoine de Saint-Exupéry', 'Littérature',    3),
('978-2-07-040850-4', 'Les Misérables',               'Victor Hugo',              'Littérature',    2),
('978-2-10-079477-1', 'Introduction aux Algorithmes', 'Thomas H. Cormen',         'Informatique',   4),
('978-2-10-078345-4', 'Bases de Données',             'Stephane Faroult',         'Informatique',   3),
('978-2-07-041239-6', 'L Etranger',                   'Albert Camus',             'Littérature',    2),
('978-2-10-080112-3', 'Réseaux Informatiques',        'Andrew Tanenbaum',         'Informatique',   3),
('978-2-01-270102-9', 'Mathématiques L2',             'Jean-Pierre Ramis',        'Mathématiques',  2),
('978-2-10-075423-2', 'Génie Logiciel',               'Ian Sommerville',          'Informatique',   3),
('978-2-07-036024-6', 'Crime et Châtiment',           'Fiodor Dostoïevski',       'Littérature',    2),
('978-2-10-077891-7', 'Systèmes d Exploitation',      'Silberschatz & Galvin',    'Informatique',   2);

-- ================================================
-- INSERT ADHERENTS
-- ================================================
INSERT INTO Adherent (nom, prenom, filiere, niveau, email, date_inscription) VALUES
('Diallo',   'Amadou',    'Génie Logiciel', 'L2', 'amadou.diallo@esp.sn',    '2024-10-01'),
('Ndiaye',   'Fatou',     'Telecom',        'L2', 'fatou.ndiaye@esp.sn',     '2024-10-01'),
('Sow',      'Ibrahima',  'Génie Logiciel', 'L3', 'ibrahima.sow@esp.sn',     '2024-09-15'),
('Ba',       'Mariama',   'Telecom',        'L1', 'mariama.ba@esp.sn',       '2024-10-05'),
('Cisse',    'Ousmane',   'Génie Logiciel', 'L2', 'ousmane.cisse@esp.sn',    '2024-10-01'),
('Sarr',     'Aissatou',  'Telecom',        'M1', 'aissatou.sarr@esp.sn',    '2023-10-01'),
('Fall',     'Moussa',    'Génie Logiciel', 'L1', 'moussa.fall@esp.sn',      '2024-10-10'),
('Diouf',    'Rokhaya',   'Telecom',        'L3', 'rokhaya.diouf@esp.sn',    '2024-09-20'),
('Kane',     'Alassane',  'Génie Logiciel', 'M2', 'alassane.kane@esp.sn',    '2022-10-01'),
('Mbaye',    'Seynabou',  'Génie Logiciel', 'L2', 'seynabou.mbaye@esp.sn',   '2024-10-01'),
('Thiaw',    'Pape',      'Telecom',        'L2', 'pape.thiaw@esp.sn',       '2024-10-01'),
('Gueye',    'Ndeye',     'Génie Logiciel', 'L3', 'ndeye.gueye@esp.sn',      '2024-09-15'),
('Drame',    'Cheikh',    'Telecom',        'L1', 'cheikh.drame@esp.sn',     '2024-10-08'),
('Toure',    'Binta',     'Génie Logiciel', 'M1', 'binta.toure@esp.sn',      '2023-10-01'),
('Ly',       'Samba',     'Telecom',        'L2', 'samba.ly@esp.sn',         '2024-10-01');

-- ================================================
-- INSERT EXEMPLAIRES (tous disponibles au départ)
-- ================================================

-- Livre 1 : 3 exemplaires
INSERT INTO Exemplaire (etat, isbn) VALUES
('disponible', '978-2-07-036822-8'),
('disponible', '978-2-07-036822-8'),
('disponible', '978-2-07-036822-8');

-- Livre 2 : 2 exemplaires
INSERT INTO Exemplaire (etat, isbn) VALUES
('disponible', '978-2-07-040850-4'),
('disponible', '978-2-07-040850-4');

-- Livre 3 : 3 exemplaires
INSERT INTO Exemplaire (etat, isbn) VALUES
('disponible', '978-2-10-079477-1'),
('disponible', '978-2-10-079477-1'),
('disponible', '978-2-10-079477-1');

-- Livre 4 : 3 exemplaires
INSERT INTO Exemplaire (etat, isbn) VALUES
('disponible', '978-2-10-078345-4'),
('disponible', '978-2-10-078345-4'),
('disponible', '978-2-10-078345-4');

-- Livre 5 : 2 exemplaires
INSERT INTO Exemplaire (etat, isbn) VALUES
('disponible', '978-2-07-041239-6'),
('disponible', '978-2-07-041239-6');

-- Livres 6 à 10 : 1 exemplaire chacun
INSERT INTO Exemplaire (etat, isbn) VALUES
('disponible', '978-2-10-080112-3'),
('disponible', '978-2-01-270102-9'),
('disponible', '978-2-10-075423-2'),
('disponible', '978-2-07-036024-6'),
('disponible', '978-2-10-077891-7'),
('abime',      '978-2-10-079477-1'),
('disponible', '978-2-10-078345-4'),
('disponible', '978-2-07-036822-8');
-- Total : 20 exemplaires

-- ================================================
-- EMPRUNTS TERMINÉS SANS RETARD (3 emprunts)
-- ================================================

-- Emprunt 1 : Adhérent 6 - exemplaire 1 - rendu à temps
INSERT INTO Emprunt (date_emprunt, date_retour_prevue, num_adherent, id_exemplaire)
VALUES ('2026-04-01', '2026-04-15', 6, 1);
UPDATE Emprunt SET date_retour_reelle = '2026-04-14' WHERE id_emprunt = 1;

-- Emprunt 2 : Adhérent 7 - exemplaire 4 - rendu à temps
INSERT INTO Emprunt (date_emprunt, date_retour_prevue, num_adherent, id_exemplaire)
VALUES ('2026-04-05', '2026-04-19', 7, 4);
UPDATE Emprunt SET date_retour_reelle = '2026-04-18' WHERE id_emprunt = 2;

-- Emprunt 3 : Adhérent 8 - exemplaire 6 - rendu à temps
INSERT INTO Emprunt (date_emprunt, date_retour_prevue, num_adherent, id_exemplaire)
VALUES ('2026-04-10', '2026-04-24', 8, 6);
UPDATE Emprunt SET date_retour_reelle = '2026-04-23' WHERE id_emprunt = 3;

-- ================================================
-- EMPRUNTS TERMINÉS AVEC RETARD (5 emprunts)
-- Le trigger crée automatiquement l'amende
-- ================================================

-- Emprunt 4 : Adhérent 1 - retard 10 jours → amende 1000 FCFA
INSERT INTO Emprunt (date_emprunt, date_retour_prevue, num_adherent, id_exemplaire)
VALUES ('2026-04-01', '2026-04-15', 1, 7);
UPDATE Emprunt SET date_retour_reelle = '2026-04-25' WHERE id_emprunt = 4;

-- Emprunt 5 : Adhérent 2 - retard 12 jours → amende 1200 FCFA
INSERT INTO Emprunt (date_emprunt, date_retour_prevue, num_adherent, id_exemplaire)
VALUES ('2026-03-15', '2026-03-29', 2, 9);
UPDATE Emprunt SET date_retour_reelle = '2026-04-10' WHERE id_emprunt = 5;

-- Emprunt 6 : Adhérent 3 - retard 7 jours → amende 700 FCFA
INSERT INTO Emprunt (date_emprunt, date_retour_prevue, num_adherent, id_exemplaire)
VALUES ('2026-03-20', '2026-04-03', 3, 10);
UPDATE Emprunt SET date_retour_reelle = '2026-04-10' WHERE id_emprunt = 6;

-- Emprunt 7 : Adhérent 4 - retard 6 jours → amende 600 FCFA
INSERT INTO Emprunt (date_emprunt, date_retour_prevue, num_adherent, id_exemplaire)
VALUES ('2026-04-05', '2026-04-19', 4, 12);
UPDATE Emprunt SET date_retour_reelle = '2026-04-25' WHERE id_emprunt = 7;

-- Emprunt 8 : Adhérent 5 - retard 8 jours → amende 800 FCFA
INSERT INTO Emprunt (date_emprunt, date_retour_prevue, num_adherent, id_exemplaire)
VALUES ('2026-04-10', '2026-04-24', 5, 11);
UPDATE Emprunt SET date_retour_reelle = '2026-05-02' WHERE id_emprunt = 8;

-- ================================================
-- EMPRUNTS ACTIFS (7 emprunts - pas encore rendus)
-- Ces adhérents n'ont PAS d'amendes impayées
-- ================================================

-- Emprunt 9 : Adhérent 6 - actif
INSERT INTO Emprunt (date_emprunt, date_retour_prevue, num_adherent, id_exemplaire)
VALUES ('2026-05-22', '2026-06-05', 6, 2);

-- Emprunt 10 : Adhérent 7 - actif
INSERT INTO Emprunt (date_emprunt, date_retour_prevue, num_adherent, id_exemplaire)
VALUES ('2026-05-25', '2026-06-08', 7, 5);

-- Emprunt 11 : Adhérent 8 - actif
INSERT INTO Emprunt (date_emprunt, date_retour_prevue, num_adherent, id_exemplaire)
VALUES ('2026-05-28', '2026-06-11', 8, 8);

-- Emprunt 12 : Adhérent 9 - actif
INSERT INTO Emprunt (date_emprunt, date_retour_prevue, num_adherent, id_exemplaire)
VALUES ('2026-05-20', '2026-06-03', 9, 13);

-- Emprunt 13 : Adhérent 10 - actif
INSERT INTO Emprunt (date_emprunt, date_retour_prevue, num_adherent, id_exemplaire)
VALUES ('2026-05-26', '2026-06-09', 10, 14);

-- Emprunt 14 : Adhérent 11 - actif
INSERT INTO Emprunt (date_emprunt, date_retour_prevue, num_adherent, id_exemplaire)
VALUES ('2026-05-29', '2026-06-12', 11, 15);

-- Emprunt 15 : Adhérent 12 - actif (EN RETARD car date prévue dépassée)
INSERT INTO Emprunt (date_emprunt, date_retour_prevue, num_adherent, id_exemplaire)
VALUES ('2026-05-15', '2026-05-29', 12, 16);

-- ================================================
-- REQUÊTES DE CONSULTATION
-- ================================================

-- ------------------------------------------------
-- Requête 1 : Liste des exemplaires disponibles
--             avec titre et auteur
-- ------------------------------------------------
-- On joint Exemplaire et Livre sur isbn
-- pour récupérer les infos du livre
-- On filtre uniquement les exemplaires disponibles
-- ------------------------------------------------
SELECT
    ex.id_exemplaire,
    l.titre,
    l.auteur,
    l.categorie,
    ex.etat
FROM Exemplaire ex
JOIN Livre l ON ex.isbn = l.isbn
WHERE ex.etat = 'disponible'
ORDER BY l.titre;


-- ------------------------------------------------
-- Requête 2 : Nombre d'emprunts actifs par adhérent
-- ------------------------------------------------
-- LEFT JOIN pour inclure les adhérents sans emprunt
-- La condition IS NULL dans le ON filtre
-- uniquement les emprunts pas encore rendus
-- HAVING garde uniquement ceux avec au moins 1 actif
-- ------------------------------------------------
SELECT
    a.num_adherent,
    CONCAT(a.nom, ' ', a.prenom) AS adherent,
    a.filiere,
    COUNT(em.id_emprunt)         AS nb_emprunts_actifs
FROM Adherent a
LEFT JOIN Emprunt em
       ON a.num_adherent = em.num_adherent
      AND em.date_retour_reelle IS NULL
GROUP BY a.num_adherent, a.nom, a.prenom, a.filiere
HAVING nb_emprunts_actifs > 0
ORDER BY nb_emprunts_actifs DESC;


-- ------------------------------------------------
-- Requête 3 : Adhérents ayant des amendes non payées
--             (sous-requête)
-- ------------------------------------------------
-- La sous-requête récupère les num_adherent
-- qui ont au moins une amende impayée
-- via la jointure Amende → Emprunt
-- DISTINCT évite les doublons si plusieurs amendes
-- ------------------------------------------------
SELECT
    a.num_adherent,
    CONCAT(a.nom, ' ', a.prenom) AS adherent,
    a.filiere,
    a.email
FROM Adherent a
WHERE a.num_adherent IN (
    SELECT DISTINCT em.num_adherent
    FROM Emprunt em
    JOIN Amende am ON em.id_emprunt = am.id_emprunt
    WHERE am.statut_paiement = 'non_paye'
);


-- ------------------------------------------------
-- Requête 4 : Les 3 livres les plus empruntés
-- ------------------------------------------------
-- Double jointure : Livre → Exemplaire → Emprunt
-- pour remonter tous les emprunts d'un livre
-- GROUP BY + COUNT comptent le total par livre
-- ORDER BY DESC + LIMIT 3 donnent le TOP 3
-- ------------------------------------------------
SELECT
    l.isbn,
    l.titre,
    l.auteur,
    COUNT(em.id_emprunt) AS nb_emprunts
FROM Livre l
JOIN Exemplaire ex ON l.isbn          = ex.isbn
JOIN Emprunt    em ON ex.id_exemplaire = em.id_exemplaire
GROUP BY l.isbn, l.titre, l.auteur
ORDER BY nb_emprunts DESC
LIMIT 3;


-- ------------------------------------------------
-- Requête 5 : Adhérents n'ayant jamais emprunté
-- ------------------------------------------------
-- NOT EXISTS : vérifie qu'il n'existe aucun emprunt
-- pour cet adhérent dans la table Emprunt
-- Plus efficace qu'un LEFT JOIN car s'arrête
-- dès qu'un emprunt est trouvé
-- ------------------------------------------------
SELECT
    a.num_adherent,
    CONCAT(a.nom, ' ', a.prenom) AS adherent,
    a.filiere,
    a.niveau,
    a.email
FROM Adherent a
WHERE NOT EXISTS (
    SELECT 1
    FROM Emprunt em
    WHERE em.num_adherent = a.num_adherent
);


-- ------------------------------------------------
-- Requête 6 : Montant total des amendes par filière
-- ------------------------------------------------
-- Jointure en chaîne : Amende → Emprunt → Adherent
-- pour relier les amendes aux filières
-- CASE WHEN dans SUM : sépare montants payés
-- et impayés dans une seule requête
-- ------------------------------------------------
SELECT
    a.filiere,
    COUNT(am.id_amende)                              AS nb_amendes,
    SUM(am.montant)                                  AS montant_total_fcfa,
    SUM(CASE WHEN am.statut_paiement = 'paye'
             THEN am.montant ELSE 0 END)             AS montant_paye,
    SUM(CASE WHEN am.statut_paiement = 'non_paye'
             THEN am.montant ELSE 0 END)             AS montant_impaye
FROM Amende am
JOIN Emprunt  em ON am.id_emprunt    = em.id_emprunt
JOIN Adherent a  ON em.num_adherent  = a.num_adherent
GROUP BY a.filiere
ORDER BY montant_total_fcfa DESC;

-- ================================================
-- GESTION DES DROITS (LCD)
-- ================================================

-- ------------------------------------------------
-- UTILISATEUR 1 : bibliothecaire
-- Droits : SELECT, INSERT, UPDATE sur toutes les tables
-- Interdit : DELETE, DROP, ALTER
-- Rôle : gère les livres, adhérents et emprunts
-- ------------------------------------------------
CREATE USER 'bibliothecaire'@'localhost'
    IDENTIFIED BY 'Biblio2026!';

-- On accorde SELECT, INSERT, UPDATE sur toute la base
GRANT SELECT, INSERT, UPDATE
    ON biblio_dept.*
    TO 'bibliothecaire'@'localhost';

-- ------------------------------------------------
-- UTILISATEUR 2 : lecteur
-- Droits : SELECT uniquement sur Livre et Exemplaire
-- Interdit : tout le reste
-- Rôle : consulte le catalogue (étudiant, visiteur)
-- ------------------------------------------------
CREATE USER 'lecteur'@'localhost'
    IDENTIFIED BY 'Lecteur2026!';

-- Accès en lecture seule sur Livre uniquement
GRANT SELECT
    ON biblio_dept.Livre
    TO 'lecteur'@'localhost';

-- Accès en lecture seule sur Exemplaire uniquement
GRANT SELECT
    ON biblio_dept.Exemplaire
    TO 'lecteur'@'localhost';

