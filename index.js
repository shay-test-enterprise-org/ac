const core = require("@actions/core");
const fetch = require("node-fetch");
const tar = require("tar");
const execSync = require("child_process").execSync;

const DOWNLOAD_URL = "https://github.com/Legit-Labs/legitify/releases/download";
const VERSION = "v0.1.6";

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

    console.log("downloading legitify");
    // Download the file from the URL
    const response = await fetch(
      `${DOWNLOAD_URL}/${VERSION}/legitify_${VERSION}_linux_amd64.tar.gz`
    );
    const fileBuffer = await response.buffer();
    console.log("extracting legitify");
    // extract the archive to a directory called legitify
    await tar.x({
      file: fileBuffer,
      C: "./",
      strip: 1,
    });

    // print current directory and its contents
    execSync("ls -la");
    // // make the binary executable
    // execSync(`chmod +x ./legitify_${VERSION}_linux_amd64/legitify`);
    // // Run the binary with the specified command
    // console.log(`Running the '${command}' command`);
    // execSync(`./legitify_${VERSION}_linux_amd64/legitify ${command}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
