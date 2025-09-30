#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

async function build() {
	console.log("🚀 Starting VR Drone Racing build process...");

	// Clean and create dist directory
	console.log("🧹 Cleaning build directory...");
	if (fs.existsSync("dist")) {
		fs.rmSync("dist", { recursive: true, force: true });
	}
	fs.mkdirSync("dist", { recursive: true });
	fs.mkdirSync("dist/js", { recursive: true });
	fs.mkdirSync("dist/css", { recursive: true });

	// Build JavaScript
	console.log("📦 Minifying JavaScript files...");
	try {
		if (fs.existsSync("js")) {
			const jsFiles = fs
				.readdirSync("js")
				.filter((file) => file.endsWith(".js"));
			if (jsFiles.length > 0) {
				const jsFilePaths = jsFiles
					.map((file) => `js/${file}`)
					.join(" ");
				execSync(
					`npx terser ${jsFilePaths} --compress --mangle --output dist/js/app.min.js --source-map`,
					{ stdio: "inherit" }
				);
				console.log("✅ JavaScript minified successfully!");
			} else {
				console.log("⚠️  No JavaScript files found to minify");
			}
		} else {
			console.log("⚠️  No js directory found");
		}
	} catch (error) {
		console.error("❌ Error minifying JavaScript:", error.message);
	}

	// Build CSS
	console.log("🎨 Minifying CSS files...");
	try {
		if (fs.existsSync("css/style.css")) {
			execSync("npx cleancss -o dist/css/style.min.css css/style.css", {
				stdio: "inherit",
			});
			console.log("✅ CSS minified successfully!");
		} else {
			console.log("⚠️  No CSS file found to minify");
		}
	} catch (error) {
		console.error("❌ Error minifying CSS:", error.message);
	}

	// Copy assets
	console.log("📁 Copying assets...");
	try {
		if (fs.existsSync("assets")) {
			execSync('npx copyfiles -u 1 "assets/**/*" dist/', {
				stdio: "inherit",
			});
			console.log("✅ Assets copied successfully!");
		} else {
			console.log("⚠️  No assets directory found");
		}
	} catch (error) {
		console.error("❌ Error copying assets:", error.message);
	}

	// Build HTML
	console.log("📄 Optimizing HTML...");
	try {
		const { minify } = require("html-minifier-terser");

		// Read the original HTML file
		const htmlContent = fs.readFileSync("index.html", "utf8");

		// Replace individual JS files with minified bundle
		const optimizedHtml = htmlContent
			.replace(
				/<!-- Carregamento dos scripts do jogo - APENAS UMA VEZ -->[\s\S]*?<script src="js\/navigation-arrow\.js\?v=1\.0\.2"><\/script>/g,
				'<!-- Minified JS Bundle -->\n    <script src="js/app.min.js"></script>'
			)
			.replace(
				/href="css\/style\.css\?v=1\.0\.2"/g,
				'href="css/style.min.css"'
			);

		// Minify HTML
		const minifyOptions = {
			collapseWhitespace: true,
			removeComments: true,
			removeOptionalTags: true,
			removeRedundantAttributes: true,
			removeScriptTypeAttributes: true,
			removeTagWhitespace: true,
			useShortDoctype: true,
			minifyCSS: true,
			minifyJS: true,
		};

		const minified = await minify(optimizedHtml, minifyOptions);
		fs.writeFileSync("dist/index.html", minified);
		console.log("✅ HTML minified and optimized successfully!");
	} catch (error) {
		console.error("❌ Error minifying HTML:", error.message);
	}

	// Build summary
	console.log("\n🎉 Build completed successfully!");
	console.log("📊 Build summary:");

	const getFileSize = (filePath) => {
		try {
			const stats = fs.statSync(filePath);
			return (stats.size / 1024).toFixed(2) + " KB";
		} catch {
			return "N/A";
		}
	};

	console.log(`   📄 HTML: ${getFileSize("dist/index.html")}`);
	console.log(`   📦 JS Bundle: ${getFileSize("dist/js/app.min.js")}`);
	console.log(`   🎨 CSS: ${getFileSize("dist/css/style.min.css")}`);
	console.log("\n🚀 Your VR drone racing game is ready for deployment!");
}

build().catch(console.error);
