import fs from "fs";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";

// Derive __dirname when using ES6 modules
const __dirname = fileURLToPath(import.meta.url);

function createHttpServer() {
    const server = http.createServer((req, res) => {
        let filePath = path.join(
            __dirname,
            "..",
            "..",
            "build",
            req.url === "/" ? "index.html" : req.url
        );
        const extname = path.extname(filePath);
        let contentType = "text/html";

        switch (extname) {
            case ".js":
                contentType = "text/javascript";
                break;
            case ".css":
                contentType = "text/css";
                break;
            case ".json":
                contentType = "application/json";
                break;
            // Add more cases for other file types if needed
        }

        fs.readFile(filePath, (error, content) => {
            if (error) {
                if (error.code === "ENOENT") {
                    console.log(filePath)
                    res.writeHead(404);
                        res.end(`File Not Found :)`);
                } else {
                    res.writeHead(500);
                    res.end(`Server Error: ${error.code}`);
                }
            } else {
                res.writeHead(200, { "Content-Type": contentType });
                res.end(content, "utf-8");
            }
        });
    });

    return server;
}

export default createHttpServer;
