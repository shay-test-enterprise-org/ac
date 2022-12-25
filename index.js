const core = require("@actions/core");
const fs = require("fs");
const zlib = require("zlib");
const request = require("request");
const https = require("https");
const tar = require("tar-fs");
const github = require("@actions/github");

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

    const legitifyVersion = core.getInput("legitify_version");
    const fileUrl = `https://github.com/Legit-Labs/legitify/releases/download/v${legitifyVersion}/legitify_${legitifyVersion}_linux_amd64.tar.gz`;

    const filePath = "legitify.tar.gz";

    // Create a write stream for the downloaded file
    const file = fs.createWriteStream(filePath);

    // Send a GET request to the file URL and pipe the response to the write stream
    request(fileUrl)
      .on("error", (error) => {
        console.error(`Error downloading file: ${error.message}`);
      })
      .pipe(file)
      .on("close", () => {
        // Create a read stream for the downloaded file
        const readStream = fs.createReadStream(filePath);

        // Extract the tar.gz file using the zlib and tar-fs modules
        const extractor = zlib.createGunzip();
        readStream
          .on("error", (error) => {
            console.error(`Error reading file: ${error.message}`);
          })
          .pipe(extractor)
          .pipe(tar.extract())
          .on("finish", () => {
            // Run the binary file
            const exec = require("child_process").exec;
            exec(
              `GITHUB_TOKEN=${token} ./legitify ${command}`,
              { stdio: "inherit" },
              (error, stdout) => {
                if (error) {
                  console.error(`Exec error: ${error}`);
                  process.exit(1);
                }
                console.log(`${stdout}`);
              }
            );
          });
      });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
