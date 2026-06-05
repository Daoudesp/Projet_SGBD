-- ============================================================
-- Suppression des livres : Crime et Châtiment, L'Étranger,
--                          Le Petit Prince, Les Misérables
-- Ordre obligatoire : Amendes → Emprunts → Exemplaires → Livres
-- ============================================================

-- 1. Supprimer les amendes liées à ces livres
DELETE FROM Amende
WHERE id_emprunt IN (
    SELECT e.id_emprunt
    FROM Emprunt e
    JOIN Exemplaire ex ON e.id_exemplaire = ex.id_exemplaire
    JOIN Livre l       ON ex.isbn = l.isbn
    WHERE l.titre IN ('Crime et Châtiment', 'L\'Étranger', 'Le Petit Prince', 'Les Misérables')
);

-- 2. Supprimer les emprunts liés à ces livres
DELETE FROM Emprunt
WHERE id_exemplaire IN (
    SELECT ex.id_exemplaire
    FROM Exemplaire ex
    JOIN Livre l ON ex.isbn = l.isbn
    WHERE l.titre IN ('Crime et Châtiment', 'L\'Étranger', 'Le Petit Prince', 'Les Misérables')
);

-- 3. Supprimer les exemplaires
DELETE FROM Exemplaire
WHERE isbn IN (
    SELECT isbn FROM Livre
    WHERE titre IN ('Crime et Châtiment', 'L\'Étranger', 'Le Petit Prince', 'Les Misérables')
);

-- 4. Supprimer les livres
DELETE FROM Livre
WHERE titre IN ('Crime et Châtiment', 'L\'Étranger', 'Le Petit Prince', 'Les Misérables');

-- Vérification
SELECT titre, auteur, categorie FROM Livre ORDER BY titre;
