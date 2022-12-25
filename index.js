const core = require("@actions/core");
const fs = require("fs");
const zlib = require("zlib");
const request = require("request");
const https = require("https");
const tar = require("tar-fs");
const github = require("@actions/github");

// isGitHubOrgOwner checks if the user is an owner of the GitHub organization
// and returns true if they are, otherwise false
async function isGitHubOrgOwner(token, org) {
  const options = {
    hostname: "api.github.com",
    path: `/orgs/${org}/memberships/${github.context.actor}`,
    method: "GET",
    headers: {
      Authorization: `token ${token}`,
      "User-Agent": "Legitify",
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        const response = JSON.parse(data);
        if (response.state === "active") {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
    req.on("error", (error) => {
      reject(error);
    });
    req.end();
  });
}

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

    const owner = core.getInput("GITHUB_REPOSITORY_OWNER");

    let isOwner = isGitHubOrgOwner(token, owner);
    if (!isOwner) {
      core.setFailed("User is not an owner of the GitHub organization");
      return;
    }

    // Get the operating system
    const os = process.platform;

    // set file URL based on operating system
    // TODO: delete this logic
    const fileUrl =
      os == "darwin"
        ? "https://github.com/Legit-Labs/legitify/releases/download/v0.1.6/legitify_0.1.6_darwin_arm64.tar.gz"
        : "https://github.com/Legit-Labs/legitify/releases/download/v0.1.6/legitify_0.1.6_linux_amd64.tar.gz";

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
                  return;
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
