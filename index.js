const core = require("@actions/core");
const fetch = require("node-fetch");
const fs = require("fs");
const tar = require("tar-stream");
const zlib = require("zlib");
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

    const tarStream = zlib.gunzipSync(fileBuffer);
    const extract = tar.extract();
    extract.on("entry", (header, stream, next) => {
      if (header.name === "legitify") {
        stream.pipe(fs.createWriteStream("./legitify"));
      }
      stream.on("end", () => {
        next();
      });
      stream.resume();
    });
    extract.on("finish", () => {
      console.log("done extracting");
    });
    tarStream.pipe(extract);

    // print current directory and its contents
    console.log(execSync("ls -la"));

    console.log("running legitify");
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
