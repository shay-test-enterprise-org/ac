const core = require("@actions/core");
const fs = require("fs");
const zlib = require("zlib");
const request = require("request");
const tar = require("tar-fs");

function generateAnalyzeArgs(repo, owner) {
  let args = "";
  if (core.getInput("analyze_self_only") === "true") {
    args += ` --repo ${repo}`;
    return args;
  }

  if (core.getInput("repositories") !== "") {
    args += ` --repo ${core.getInput("repositories")}`;
    return args;
  }

  args += ` --org ${owner}`;

  return args;
}

// upload legitify's error.log to github workflow artifacts
async function uploadErrorLog(file) {
  const artifactClient = artifact.create();
  const artifactName = "legitify-error-log";
  const rootDirectory = "./";
  const files = [file];
  const options = {
    continueOnError: true,
  };
}

async function run() {
  try {
    // Get the GitHub token input value, if it exists, otherwise exit
    const token = core.getInput("github_token");
    if (!token) {
      core.setFailed("No GitHub token provided");
      return;
    }

    const owner = process.env["GITHUB_REPOSITORY_OWNER"];
    const repo = process.env["GITHUB_REPOSITORY"];
    const legitifyVersion = core.getInput("legitify_version");
    const fileUrl = `https://github.com/Legit-Labs/legitify/releases/download/v${legitifyVersion}/legitify_${legitifyVersion}_linux_amd64.tar.gz`;
    const filePath = "legitify.tar.gz";

    const args = generateAnalyzeArgs(repo, owner);

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
              `GITHUB_TOKEN=${token} ./legitify analyze ${args}`,
              { stdio: "inherit" },
              (error, stdout) => {
                if (error) {
                  console.error(`Exec error: ${error}`);
                  process.exit(1);
                }
                console.log(`${stdout}`);
              }
            );
            // upload error.log if it exists
            if (fs.existsSync("error.log")) {
              uploadErrorLog("error.log");
            }
          });
      });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
