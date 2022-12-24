const core = require("@actions/core");
const fetch = require("node-fetch");
const tar = require("tar");
const { execSync } = require("child_process");

const DOWNLOAD_URL = "https://github.com/Legit-Labs/legitify/releases/download";
const VERSION = "v0.1.6";

async function run() {
  try {
    // Get the command input value
    const command = core.getInput("command") || "analyze";
    // Get the GitHub token input value, if it exists, otherwise exit
    const token = core.getInput("token");
    if (!token) {
      core.setFailed("No GitHub token provided");
      return;
    }

    console.log(`Running the '${command}' command`);

    // Download the file from the URL
    const response = await fetch(
      `${DOWNLOAD_URL}/${VERSION}/legitify_${VERSION}_linux_amd64.tar.gz`
    );
    const fileBuffer = await response.buffer();

    // Extract the tar file
    await tar.x({
      file: fileBuffer,
      cwd: ".",
    });

    // Run the binary with the specified command
    execSync(`./legitify_${VERSION}_linux_amd64/legitify ${command}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
