# ================================================
# Connexion MySQL + requêtes préparées
# Les requêtes préparées sont OBLIGATOIRES
# pour éviter les injections SQL
# ================================================
import mysql.connector
from config import DB_CONFIG

def get_db():
    return mysql.connector.connect(**DB_CONFIG)

def execute_query(sql, params=None, fetch=True):
    """
    Exécute une requête préparée.
    - sql    : la requête avec des %s comme paramètres
    - params : tuple de valeurs (jamais concaténées dans le SQL)
    - fetch  : True pour SELECT, False pour INSERT/UPDATE/DELETE
    """
    conn   = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(sql, params or ())

    if fetch:
        result = cursor.fetchall()
        cursor.close()
        conn.close()
        return result
    else:
        conn.commit()
        last_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return last_id
