const core = require("@actions/core");
const fetch = require("node-fetch");
const fs = require("fs");
const tar = require("tar-stream");
const zlib = require("zlib");

const execSync = require("child_process").execSync;

const DOWNLOAD_URL = "https://github.com/Legit-Labs/legitify/releases/download";
const VERSION = "0.1.6";

async function run() {
  try {
    // Get the command input value
    const command = core.getInput("command") || "analyze";
    // Get the GitHub token input value, if it exists, otherwise exit
    const token = core.getInput("github_token");
    if (!token) {
      core.setFailed("No GitHub token provided");
      return;
    }

    // Download the file from the URL
    const response = await fetch(
      `${DOWNLOAD_URL}/v${VERSION}/legitify_${VERSION}_linux_amd64.tar.gz`
    );

    const fileBuffer = await response.buffer();

    // Extract the tar stream from the gzip stream
    const tarStream = zlib.gunzipSync(fileBuffer);

    // Create a extractor to extract the tar stream
    const extractor = tar.extract();

    // Wait until file is fully extracted and ready to be executed
    await new Promise((resolve, reject) => {
      extractor.on("entry", (header, stream, next) => {
        // Only extract the legitify executable
        if (header.name === "legitify") {
          // Write the executable to the file system
          stream.pipe(fs.createWriteStream("./legitify"));
          stream.on("end", () => {
            // Make the executable executable
            execSync("chmod +x ./ ./legitify");
            // Resolve the promise
            resolve();
          });
        } else {
          // Skip the entry
          stream.resume();
        }
        // Move to the next entry
        stream.on("end", next);
      });
      // Pipe the tar stream to the extractor
      tarStream.pipe(extractor);
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
