const FtpDeploy = require("ftp-deploy");
const fs = require("fs");
const path = require("path");

// Carregar configurações do FTP
const configPath = path.join(__dirname, ".ftpconfig.json");

if (!fs.existsSync(configPath)) {
	console.error("❌ Erro: Arquivo .ftpconfig.json não encontrado!");
	console.log("📝 Crie o arquivo baseado no .ftpconfig.example.json");
	process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

const ftpDeploy = new FtpDeploy();

const ftpConfig = {
	user: config.user,
	password: config.password,
	host: config.host,
	port: config.port || 21,
	localRoot: path.join(__dirname, "dist"),
	remoteRoot: config.remoteRoot || "/htdocs",
	include: ["*", "**/*"],
	exclude: [],
	deleteRemote: false,
	forcePasv: true,
	sftp: false,
};

console.log("🚀 Iniciando deploy...");
console.log(`📁 Pasta local: ${ftpConfig.localRoot}`);
console.log(`🌐 Servidor: ${ftpConfig.host}`);
console.log(`📂 Pasta remota: ${ftpConfig.remoteRoot}`);
console.log("");

ftpDeploy
	.deploy(ftpConfig)
	.then(() => {
		console.log("");
		console.log("✅ Deploy concluído com sucesso!");
		console.log(`🌍 Acesse: http://${config.domain || config.host}`);
	})
	.catch((err) => {
		console.error("");
		console.error("❌ Erro durante o deploy:", err);
		process.exit(1);
	});

ftpDeploy.on("uploading", (data) => {
	const percent = (
		(data.transferredFileCount / data.totalFilesCount) *
		100
	).toFixed(1);
	console.log(`📤 [${percent}%] Enviando: ${data.filename}`);
});

ftpDeploy.on("uploaded", (data) => {
	console.log(`✓ Enviado: ${data.filename}`);
});

ftpDeploy.on("log", (data) => {
	console.log(`ℹ️  ${data}`);
});
