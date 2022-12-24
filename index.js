import { getInput, setFailed } from "@actions/core";
import fetch from "node-fetch";
import { x } from "tar";
import { execSync } from "child_process";

const DOWNLOAD_URL = "https://github.com/Legit-Labs/legitify/releases/download";
const VERSION = "v0.1.6";

async function run() {
  try {
    // Get the command input value
    const command = getInput("command") || "analyze";
    // Get the GitHub token input value, if it exists, otherwise exit
    const token = getInput("token");
    if (!token) {
      setFailed("No GitHub token provided");
      return;
    }

    console.log(`Running the '${command}' command`);

    // Download the file from the URL
    const response = await fetch(
      `${DOWNLOAD_URL}/${VERSION}/legitify_${VERSION}_linux_amd64.tar.gz`
    );
    const fileBuffer = await response.buffer();

    // Extract the tar file
    await x({
      file: fileBuffer,
      cwd: ".",
    });

    // Run the binary with the specified command
    execSync(`./legitify_${VERSION}_linux_amd64/legitify ${command}`);
  } catch (error) {
    setFailed(error.message);
  }
}

run();
