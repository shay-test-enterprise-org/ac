const core = require("@actions/core");
const fs = require("fs");
const zlib = require("zlib");
const request = require("request");
const tar = require("tar-fs");
const artifact = require("@actions/artifact");
const path = require("path");

/**
 * Fetches the URL for the Legitify release with a version that starts with the
 * given base version.
 * @param {string} baseVersion The base version to search for.
 * @returns {string} The URL for the Legitify release.
 */
async function fetchLegitifyReleaseUrl(baseVersion) {
  // Fetch the releases data from the GitHub API
  const response = await fetch(
    "https://api.github.com/repos/Legit-Labs/legitify/releases"
  );
  const releases = await response.json();

  // Iterate over the releases and find the one with a version that starts with the base version
  for (const release of releases) {
    // Remove the first character from the tag name (assumed to be the "v" character)
    const version = release.tag_name.slice(1);
    if (version.startsWith(baseVersion)) {
      // Find the AMD64 Linux asset in the list of assets for the matching release
      const linuxAsset = release.assets.find(
        (asset) =>
          asset.name.endsWith(".tar.gz") && asset.name.includes("linux_amd64")
      );

      // Return the download URL for the AMD64 Linux asset
      return linuxAsset.browser_download_url;
    }
  }
}

/**
 * Generates the command-line arguments for the `legitify analyze` command.
 * @param {string} repo The name of the repository.
 * @param {string} owner The owner of the repository.
 * @returns {string} The command-line arguments.
 */
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

/**
 * Downloads and extracts the Legitify tar.gz file.
 * @param {string} fileUrl The URL of the file to download.
 * @param {string} filePath The local path to save the file to.
 * @returns {Promise} A promise that resolves when the file has been downloaded and extracted.
 */
function downloadAndExtract(fileUrl, filePath) {
  return new Promise((resolve, reject) => {
    // Create a write stream for the downloaded file
    const file = fs.createWriteStream(filePath);

    // Send a GET request to the file URL and pipe the response to the write stream
    request(fileUrl).on(
      "error",
      error.pipe(file).on("close", () => {
        // Create a read stream for the downloaded file
        const readStream = fs.createReadStream(filePath);

        // Extract the tar.gz file using the zlib and tar-fs modules
        const extractor = zlib.createGunzip();
        readStream
          .on("error", (error) => {
            reject(error);
          })
          .pipe(extractor)
          .pipe(tar.extract())
          .on("finish", () => {
            resolve();
          });
      })
    );
  });
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
    const legitifyBaseVersion = core.getInput("legitify_base_version");
    const fileUrl = await fetchLegitifyReleaseUrl(legitifyBaseVersion);
    const filePath = path.join(__dirname, "legitify.tar.gz");

    const args = generateAnalyzeArgs(repo, owner);

    // Download and extract the Legitify tar.gz file
    await downloadAndExtract(fileUrl, filePath);

    // Run the binary file
    const { exec } = require("child_process");
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
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
