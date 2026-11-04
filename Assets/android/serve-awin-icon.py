import http.server

FILE = r"C:\blueseasfishing\Assets\android\awin-profile-168.jpg"

class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        with open(FILE, "rb") as f:
            data = f.read()
        self.send_response(200)
        self.send_header("Content-Type", "image/jpeg")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, *args):
        pass

if __name__ == "__main__":
    http.server.HTTPServer(("127.0.0.1", 8899), Handler).serve_forever()
