"""Local asset server with CORS headers so the Play Console page (in the preview
browser) can fetch screenshot files and inject them into the hidden file input."""
import http.server
import socketserver
import functools

PORT = 8791
ROOT = r'C:\blueseasfishing\Assets\android'


class CORSHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def log_message(self, fmt, *args):
        pass  # keep quiet


if __name__ == '__main__':
    handler = functools.partial(CORSHandler, directory=ROOT)
    with socketserver.ThreadingTCPServer(('127.0.0.1', PORT), handler) as httpd:
        print(f'serving {ROOT} on http://127.0.0.1:{PORT} with CORS')
        httpd.serve_forever()
