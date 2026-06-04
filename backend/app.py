# ================================================
# Point d'entrée de l'application Flask
# Bibliothèque Universitaire — ESP L2 GLSI 2026
# ================================================
from flask import Flask
from flask_cors import CORS

from routes.adherents import adherents_bp
from routes.livres     import livres_bp
from routes.emprunts   import emprunts_bp
from routes.amendes    import amendes_bp
from routes.dashboard  import dashboard_bp

app = Flask(__name__)

# Autorise les requêtes depuis React (port 3000)
CORS(app)

# Enregistrement des routes
app.register_blueprint(adherents_bp)
app.register_blueprint(livres_bp)
app.register_blueprint(emprunts_bp)
app.register_blueprint(amendes_bp)
app.register_blueprint(dashboard_bp)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
