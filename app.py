"""
Aura Perfume AI - Python Backend
Supports Gemini API integration, PWA API endpoints, and smart curated sommelier fallback.
Works out of the box with standard library or with FastAPI/Uvicorn.
"""

import os
import json
import urllib.request
import urllib.error
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

# Load environment variables from .env or .env.local if present
def load_env_file():
    for env_name in ['.env.local', '.env']:
        env_path = Path(__file__).parent / env_name
        if env_path.exists():
            with open(env_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        k, v = line.split('=', 1)
                        k = k.strip()
                        v = v.strip().strip('"').strip("'")
                        if k not in os.environ:
                            os.environ[k] = v

load_env_file()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
PORT = int(os.environ.get("PORT", 3000))

# Curated sommelier catalog for Club de Nuit and common dupes
FALLBACK_CATALOG = {
    "club_de_nuit": {
        "original": "Club de Nuit Intense Man (Armaf) / Creed Aventus",
        "originalPrice": 42.0,
        "items": [
            {
                "id": "zara-vibrant-leather",
                "name": "Vibrant Leather Eau de Parfum",
                "brand": "Zara",
                "estimatedPrice": 22.95,
                "savingsPercent": 45,
                "matchScore": 92,
                "olfactoryFamily": "Amaderado Cítrico Cuero",
                "topNotes": ["Bergamota", "Limón"],
                "heartNotes": ["Bambú", "Flor de azahar"],
                "baseNotes": ["Cuero", "Pachulí"],
                "longevityHours": "5 - 6 hrs",
                "sillage": "Moderada / Cercana",
                "bestOccasions": ["Oficina diaria", "Clima cálido", "Salidas casuales"],
                "whyItMatches": "Ofrece el mismo ADN afrutado ahumado de Club de Nuit pero con una salida mucho más limpia y natural, sin la nota sintética punzante de limón.",
                "pros": ["Salida sin aroma químico", "Precio imbatible", "Fácil de encontrar en tiendas físicas"],
                "badge": "Opción más limpia & barata",
                "vibeDescription": "Elegancia cotidiana relajada con fondo cítrico y cuero refinado."
            },
            {
                "id": "lattafa-shaheen-silver",
                "name": "Shaheen Silver",
                "brand": "Lattafa Pride",
                "estimatedPrice": 26.50,
                "savingsPercent": 37,
                "matchScore": 94,
                "olfactoryFamily": "Cítrico Amaderado Especiado",
                "topNotes": ["Bergamota", "Cassis"],
                "heartNotes": ["Pachulí", "Rosa"],
                "baseNotes": ["Musgo de roble", "Almizcle", "Ámbar"],
                "longevityHours": "7 - 8 hrs",
                "sillage": "Moderada a Fuerte",
                "bestOccasions": ["Tardes", "Reuniones de trabajo", "Primavera / Otoño"],
                "whyItMatches": "Gran clon con corazón de musgo de roble y pachulí que replica el secado ahumado distintivo con excelente fijación a un precio aún más accesible.",
                "pros": ["Presentación premium en botella de metal", "Excelente duración", "Secado casi idéntico al Creed vintage"],
                "badge": "Mejor fijación económica",
                "vibeDescription": "Aroma magnético, maduro y con presencia envolvente."
            },
            {
                "id": "antonio-banderas-icon",
                "name": "The Icon Elixir",
                "brand": "Antonio Banderas",
                "estimatedPrice": 19.90,
                "savingsPercent": 52,
                "matchScore": 88,
                "olfactoryFamily": "Amaderado Aromático Especiado",
                "topNotes": ["Cítricos", "Cardamomo"],
                "heartNotes": ["Lavanda", "Salvia"],
                "baseNotes": ["Abedul ahumado", "Cedro", "Ámbar"],
                "longevityHours": "6 hrs",
                "sillage": "Moderada",
                "bestOccasions": ["Universidad", "Gimnasio & diario", "Clima templado"],
                "whyItMatches": "Para presupuestos muy ajustados, incorpora la faceta ahumada del abedul con un acorde fresco y cítrico muy complaciente.",
                "pros": ["Menos de 20 euros", "Fácil de gustar a cualquier persona", "Muy versátil"],
                "badge": "Ultra Low-Cost",
                "vibeDescription": "Fresco, dinámico y amigable para el uso diario sin complicaciones."
            },
            {
                "id": "afnan-supremacy-silver",
                "name": "Supremacy Silver",
                "brand": "Afnan",
                "estimatedPrice": 32.00,
                "savingsPercent": 24,
                "matchScore": 96,
                "olfactoryFamily": "Amaderado Floral Almizcle",
                "topNotes": ["Manzana", "Bergamota", "Grosella negra", "Piña"],
                "heartNotes": ["Rosa", "Abedul", "Jazmín marroquí", "Pachulí"],
                "baseNotes": ["Musgo de roble", "Almizcle", "Ámbar gris", "Vainilla"],
                "longevityHours": "8 - 10 hrs",
                "sillage": "Fuerte",
                "bestOccasions": ["Eventos formales", "Noches de fiesta", "Citas"],
                "whyItMatches": "Considerado por la comunidad perfumista como una versión más refinada y equilibrada que Club de Nuit, con nota de piña jugosa más prominente.",
                "pros": ["Aroma más natural que Armaf", "Proyección estelar", "Frasco de colección pesado"],
                "badge": "Calidad Olfativa Superior",
                "vibeDescription": "Proyección imponente y magnetismo frutal con humo suave de abedul."
            }
        ]
    }
}

def get_curated_response(query: str, min_price: float, max_price: float):
    q = query.lower()
    if any(k in q for k in ['club de nuit', 'aventus', 'creed', 'ahumado', 'piña', 'barato']):
        cat = FALLBACK_CATALOG['club_de_nuit']
        filtered = [it for it in cat['items'] if it['estimatedPrice'] <= max_price]
        items = filtered if len(filtered) > 0 else cat['items'][:3]
        return {
            "originalReference": cat["original"],
            "originalEstimatedPrice": cat["originalPrice"],
            "analysis": f"Hemos encontrado excelentes alternativas directas con el célebre ADN cítrico y abedul ahumado de Club de Nuit Intense Man, priorizando opciones por debajo de tu límite de {max_price}€ con salidas más balanceadas.",
            "recommendations": items
        }

    # Generic sommelier curation
    return {
        "originalReference": query if len(query) > 3 else "Fragancia de referencia",
        "originalEstimatedPrice": 75.0,
        "analysis": f"Selección curada por IA con alternativas de alta fijación y notas equilibradas dentro de tu rango de presupuesto ({min_price}€ - {max_price}€).",
        "recommendations": [
            {
                "id": "lattafa-khamrah",
                "name": "Khamrah",
                "brand": "Lattafa",
                "estimatedPrice": 34.00,
                "savingsPercent": 55,
                "matchScore": 94,
                "olfactoryFamily": "Ámbar Especiado Gourmand",
                "topNotes": ["Canela", "Nuez moscada", "Bergamota"],
                "heartNotes": ["Dátiles", "Praliné", "Nardos"],
                "baseNotes": ["Vainilla", "Haba tonka", "Benjuí", "Mirra"],
                "longevityHours": "9 - 12 hrs",
                "sillage": "Potente",
                "bestOccasions": ["Noches frías", "Citas especiales", "Invierno / Otoño"],
                "whyItMatches": "Aroma dulce, licoroso y envolvente de nivel nicho con una relación calidad-precio excepcional.",
                "pros": ["Fijación extrema de más de 10 horas", "Botella de cristal tallado estilo licorera", "Calidez sofisticada"],
                "badge": "Gourmand N° 1",
                "vibeDescription": "Cálido, tentador y opulento con notas de canela, dátiles y vainilla tostada."
            },
            {
                "id": "zara-vibrant-leather",
                "name": "Vibrant Leather",
                "brand": "Zara",
                "estimatedPrice": 22.95,
                "savingsPercent": 65,
                "matchScore": 90,
                "olfactoryFamily": "Amaderado Cítrico Cuero",
                "topNotes": ["Bergamota brillante"],
                "heartNotes": ["Bambú crujiente"],
                "baseNotes": ["Cuero flexible"],
                "longevityHours": "5 - 6 hrs",
                "sillage": "Moderada",
                "bestOccasions": ["Oficina diaria", "Clima templado", "Uso versátil"],
                "whyItMatches": "Alternativa limpia y minimalista, perfecta para presupuestos bajos sin renunciar a una salida fresca y moderna.",
                "pros": ["Muy económico", "Aceptación universal", "Elegante y no invasivo"],
                "badge": "Mejor Opción Diaria",
                "vibeDescription": "Frescura cítrica moderna con un fondo de cuero refinado y limpio."
            },
            {
                "id": "afnan-9pm",
                "name": "9 PM",
                "brand": "Afnan",
                "estimatedPrice": 28.50,
                "savingsPercent": 60,
                "matchScore": 95,
                "olfactoryFamily": "Ámbar Vainilla Dulce",
                "topNotes": ["Manzana", "Canela", "Lavanda silvestre", "Bergamota"],
                "heartNotes": ["Flor de azahar", "Lirio de los valles"],
                "baseNotes": ["Vainilla", "Haba tonka", "Ámbar", "Pachulí"],
                "longevityHours": "8 - 10 hrs",
                "sillage": "Intensa",
                "bestOccasions": ["Fiestas", "Salidas nocturnas", "Jóvenes y citas"],
                "whyItMatches": "Famoso dupe del icónico Ultra Male de JPG, con salida afrutada y vainilla vibrante que dura toda la noche.",
                "pros": ["Generador de cumplidos número uno", "Gran proyección nocturna", "Excelente relación calidad-precio"],
                "badge": "Rey de la Fiesta",
                "vibeDescription": "Juvenil, seductor y dulce con una estela inconfundible."
            }
        ]
    }

def call_gemini_api(query: str, min_price: float, max_price: float) -> dict:
    """Calls Gemini REST API or uses google-genai library if installed."""
    if not GEMINI_API_KEY:
        print("[Python Server] GEMINI_API_KEY not found, using curated sommelier response")
        return get_curated_response(query, min_price, max_price)

    # List of official supported models in preference order
    candidate_models = ['gemini-3.5-flash']

    # First attempt: official google-genai library if present
    try:
        from google import genai
        client = genai.Client(api_key=GEMINI_API_KEY)
        system_instruction = (
            f"Eres un sumiller y perfumista experto en fragancias y dupes accesibles. "
            f"El usuario busca: '{query}'. Presupuesto máximo: {max_price}€, mínimo: {min_price}€. "
            "Devuelve un JSON con: originalReference (string), originalEstimatedPrice (number), "
            "analysis (string), y recommendations (array de objetos con id, name, brand, "
            "estimatedPrice, savingsPercent, matchScore, olfactoryFamily, topNotes, heartNotes, "
            "baseNotes, longevityHours, sillage, bestOccasions, whyItMatches, pros, badge, vibeDescription)."
        )

        for model_name in candidate_models:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=f"Encuentra dupes accesibles para: {query}",
                    config={
                        'system_instruction': system_instruction,
                        'response_mime_type': 'application/json'
                    }
                )
                if response and response.text:
                    print(f"[Python Server] Gemini call succeeded using {model_name}!")
                    return json.loads(response.text)
            except Exception as model_err:
                print(f"[Python Server] google-genai with {model_name} failed: {model_err}")
                continue
    except Exception as e:
        print(f"[Python Server] google-genai initialization failed ({e}), falling back to Gemini REST API...")

    # Second attempt: Direct Gemini REST API call (zero external dependencies)
    prompt_text = (
        f"Eres un sumiller y perfumista experto. Consulta del usuario: '{query}'. "
        f"Presupuesto máximo: {max_price}€, mínimo: {min_price}€. "
        "Genera una respuesta en formato JSON exacto con la estructura: "
        "{"
        "  \"originalReference\": \"nombre de fragancia de referencia\","
        "  \"originalEstimatedPrice\": 45,"
        "  \"analysis\": \"explicación del sumiller\","
        "  \"recommendations\": ["
        "    {"
        "      \"id\": \"dupe-id\","
        "      \"name\": \"Nombre del Dupe\","
        "      \"brand\": \"Marca\","
        "      \"estimatedPrice\": 24.50,"
        "      \"savingsPercent\": 45,"
        "      \"matchScore\": 92,"
        "      \"olfactoryFamily\": \"Cítrico Amaderado\","
        "      \"topNotes\": [\"Nota 1\", \"Nota 2\"],"
        "      \"heartNotes\": [\"Nota 3\"],"
        "      \"baseNotes\": [\"Nota 4\"],"
        "      \"longevityHours\": \"6 - 8 hrs\","
        "      \"sillage\": \"Moderada\","
        "      \"bestOccasions\": [\"Diario\", \"Oficina\"],"
        "      \"whyItMatches\": \"Por qué es una alternativa ideal...\","
        "      \"pros\": [\"Punto a favor 1\", \"Punto a favor 2\"],"
        "      \"badge\": \"Mejor Precio\","
        "      \"vibeDescription\": \"Atmósfera del perfume\""
        "    }"
        "  ]"
        "}"
    )
    payload = {
        "contents": [{"parts": [{"text": prompt_text}]}],
        "generationConfig": {"response_mime_type": "application/json"}
    }
    data_bytes = json.dumps(payload).encode('utf-8')

    for model_name in candidate_models:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GEMINI_API_KEY}"
            headers = {"Content-Type": "application/json"}
            req = urllib.request.Request(url, data=data_bytes, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=12) as resp:
                res_data = json.loads(resp.read().decode('utf-8'))
                text = res_data['candidates'][0]['content']['parts'][0]['text']
                print(f"[Python Server] REST Gemini call succeeded using {model_name}!")
                return json.loads(text)
        except Exception as rest_err:
            print(f"[Python Server] REST Gemini call with {model_name} failed: {rest_err}")
            continue

    print("[Python Server] All Gemini models failed or key invalid, using curated fallback")
    return get_curated_response(query, min_price, max_price)

# HTTP Request Handler (Standard Library)
class AuraHTTPHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS and PWA service worker headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        content_len = int(self.headers.get('Content-Length', 0))
        post_body = self.rfile.read(content_len).decode('utf-8') if content_len > 0 else '{}'

        # Endpoint: /api/recommend-perfumes
        if self.path == '/api/recommend-perfumes':
            try:
                req_json = json.loads(post_body)
                query = req_json.get('query', '')
                max_price = float(req_json.get('maxPrice', 50))
                min_price = float(req_json.get('minPrice', 0))

                result = call_gemini_api(query, min_price, max_price)
                res_bytes = json.dumps(result, ensure_ascii=False).encode('utf-8')

                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Content-Length', str(len(res_bytes)))
                self.end_headers()
                self.wfile.write(res_bytes)
            except Exception as e:
                err_bytes = json.dumps({"error": str(e)}).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(err_bytes)
            return

        # Endpoint: /api/push/subscribe
        if self.path == '/api/push/subscribe':
            res_bytes = json.dumps({"status": "subscribed"}).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(res_bytes)
            return

        self.send_response(404)
        self.end_headers()

    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        '.js': 'application/javascript; charset=utf-8',
        '.mjs': 'application/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.webmanifest': 'application/manifest+json; charset=utf-8',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.css': 'text/css; charset=utf-8',
        '.html': 'text/html; charset=utf-8',
    }

    def do_GET(self):
        # Normalize path
        req_path = self.path.split('?')[0]

        # Root navigation -> serve dist/index.html
        if req_path in ('', '/', '/index.html'):
            dist_index = Path(__file__).parent / "dist" / "index.html"
            if dist_index.exists():
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.end_headers()
                with open(dist_index, 'rb') as f:
                    self.wfile.write(f.read())
                return

        # PWA Service Worker
        if req_path == '/sw.js':
            sw_path = Path(__file__).parent / "public" / "sw.js"
            if not sw_path.exists():
                sw_path = Path(__file__).parent / "dist" / "sw.js"
            if sw_path.exists():
                self.send_response(200)
                self.send_header('Content-Type', 'application/javascript; charset=utf-8')
                self.send_header('Service-Worker-Allowed', '/')
                self.end_headers()
                with open(sw_path, 'rb') as f:
                    self.wfile.write(f.read())
                return

        # PWA Manifest
        if req_path in ('/manifest.json', '/manifest.webmanifest'):
            mf_path = Path(__file__).parent / "public" / "manifest.json"
            if not mf_path.exists():
                mf_path = Path(__file__).parent / "dist" / "manifest.json"
            if mf_path.exists():
                self.send_response(200)
                self.send_header('Content-Type', 'application/manifest+json; charset=utf-8')
                self.end_headers()
                with open(mf_path, 'rb') as f:
                    self.wfile.write(f.read())
                return

        # Offline fallback page
        if req_path == '/offline.html':
            off_path = Path(__file__).parent / "public" / "offline.html"
            if not off_path.exists():
                off_path = Path(__file__).parent / "dist" / "offline.html"
            if off_path.exists():
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.end_headers()
                with open(off_path, 'rb') as f:
                    self.wfile.write(f.read())
                return

        # Standalone bundle in dist
        if req_path == '/app.js':
            app_js_path = Path(__file__).parent / "dist" / "app.js"
            if app_js_path.exists():
                self.send_response(200)
                self.send_header('Content-Type', 'application/javascript; charset=utf-8')
                self.end_headers()
                with open(app_js_path, 'rb') as f:
                    self.wfile.write(f.read())
                return

        # Icons
        if req_path.startswith('/icons/'):
            icon_file = req_path.replace('/icons/', '')
            icon_path = Path(__file__).parent / "public" / "icons" / icon_file
            if icon_path.exists():
                mime = 'image/svg+xml' if icon_file.endswith('.svg') else 'image/png'
                self.send_response(200)
                self.send_header('Content-Type', mime)
                self.end_headers()
                with open(icon_path, 'rb') as f:
                    self.wfile.write(f.read())
                return

        return super().do_GET()

def run_server():
    dist_dir = Path(__file__).parent / "dist"
    public_dir = Path(__file__).parent
    os.chdir(public_dir)

    server_address = ('0.0.0.0', PORT)
    httpd = HTTPServer(server_address, AuraHTTPHandler)
    print(f"✨ Aura Python Backend listening on http://localhost:{PORT}")
    print(f"   - Gemini API Key configured: {'YES' if GEMINI_API_KEY else 'NO (using curated fallbacks)'}")
    print(f"   - PWA Manifest available: http://localhost:{PORT}/manifest.json")
    print(f"   - Service Worker available: http://localhost:{PORT}/sw.js")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping Python server...")
        httpd.server_close()

if __name__ == '__main__':
    run_server()
