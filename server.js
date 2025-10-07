const http = require("http");
const fs = require("fs");
const path = require("path");

const server = http.createServer((req, res) => {
	let filePath = "." + req.url;
	if (filePath === "./") {
		filePath = "./index.html";
	}

	const extname = String(path.extname(filePath)).toLowerCase();
	const mimeTypes = {
		".html": "text/html",
		".js": "text/javascript",
		".css": "text/css",
		".json": "application/json",
		".png": "image/png",
		".jpg": "image/jpg",
		".gif": "image/gif",
		".svg": "image/svg+xml",
		".wav": "audio/wav",
		".mp4": "video/mp4",
		".woff": "application/font-woff",
		".ttf": "application/font-ttf",
		".eot": "application/vnd.ms-fontobject",
		".otf": "application/font-otf",
		".wasm": "application/wasm",
		".glb": "model/gltf-binary",
		".gltf": "model/gltf+json",
	};

	const contentType = mimeTypes[extname] || "application/octet-stream";

	fs.readFile(filePath, (error, content) => {
		if (error) {
			if (error.code === "ENOENT") {
				res.writeHead(404, { "Content-Type": "text/html" });
				res.end("404 - Arquivo não encontrado", "utf-8");
			} else {
				res.writeHead(500);
				res.end("Erro interno do servidor: " + error.code + " ..\n");
			}
		} else {
			res.writeHead(200, {
				"Content-Type": contentType,
				"Access-Control-Allow-Origin": "*",
			});
			res.end(content, "utf-8");
		}
	});
});

const PORT = 8000;
server.listen(PORT, () => {
	console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
	console.log("📁 Servindo arquivos do diretório atual");
	console.log("🎮 Acesse o jogo em: http://localhost:8000");
});
