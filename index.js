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

    // Listen for the 'entry' event to process each file in the tar archive
    extractor.on("entry", (header, stream, callback) => {
      // If the file name matches the file we want to extract, save it to the filesystem
      if (header.name === "legitify") {
        const writeStream = fs.createWriteStream("legitify");
        stream.pipe(writeStream);
      }
      stream.on("end", callback);
      stream.resume();
    });

    console.log("finishing extraction");
    // Listen for the 'finish' event to know when the tar stream has been fully processed
    extractor.on("finish", () => {
      // Make the file executable
      fs.ch;
      // Run the command and print to stdout
      console.log("running legitify");
      console.log(execSync(`./legitify ${command}`, { stdio: "inherit" }));
    });

    // Pipe the tar stream into the extractor
    tarStream.pipe(extractor);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
