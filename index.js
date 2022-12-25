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

    console.log("response code is: ", response.status);
    const buffer = await response.buffer();
    // Extract the file from the tarball
    const extract = tar.extract();
    extract.on("entry", (header, stream, next) => {
      stream.on("end", next);
      stream.resume();
    });
    extract.on("finish", () => {
      // Make the file executable
      execSync(`chmod +x ./legitify_${VERSION}_linux_amd64/legitify`);
      // Run the command
      execSync(
        `GITHUB_TOKEN=${token} ./legitify_${VERSION}_linux_amd64/legitify ${command}`
      );
    });
    // Unzip the file
    const gunzip = zlib.createGunzip();
    gunzip.pipe(extract);
    gunzip.write(buffer);
    gunzip.end();
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
