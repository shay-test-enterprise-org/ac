const core = require("@actions/core");
const fs = require("fs");
const zlib = require("zlib");
const request = require("request");
const tar = require("tar-fs");
const path = require("path");
const fetch = require("node-fetch");
const exec = require("@actions/exec");
const { context } = require("@actions/github");
const artifact = require("@actions/artifact");

async function uploadArtifact(fileName) {
  try {
    if (fs.existsSync(fileName)) {
      const client = artifact.create();
      await client.uploadArtifact(
        fileName,
        fileName,
        context.repo,
        context.runId
      );
      console.log(`Uploaded ${fileName} to the workflow artifact`);
    } else {
      console.log(`File ${fileName} does not exist so skipping upload`);
    }
  } catch (error) {
    console.error(error);
  }
}

async function executeLegitify(token, args) {
  let myOutput = "";
  let myError = "";

  const options = {};
  options.listeners = {
    stdout: (data) => {
      myOutput += data.toString();
    },
    stderr: (data) => {
      myError += data.toString();
    },
  };
  options.env = { GITHUB_TOKEN: token };
  try {
    await exec.exec('"./legitify"', ["analyze", "--repo owner/repo"], options);
  } catch (error) {
    core.setFailed(error);
  }
}

async function fetchLegitifyReleaseUrl(baseVersion) {
  try {
    const response = await fetch(
      "https://api.github.com/repos/Legit-Labs/legitify/releases"
    );
    if (!response.ok) {
      core.setFailed(`Failed to fetch releases: ${response.statusText}`);
    }
    const releases = await response.json();

    for (const release of releases) {
      const version = release.tag_name.slice(1);
      if (version.startsWith(baseVersion)) {
        const linuxAsset = release.assets.find(
          (asset) =>
            asset.name.endsWith(".tar.gz") && asset.name.includes("linux_amd64")
        );

        return linuxAsset.browser_download_url;
      }
    }

    throw new Error(
      `No releases found with version starting with ${baseVersion}`
    );
  } catch (error) {
    core.setFailed(error);
  }
}

function generateAnalyzeArgs(repo, owner) {
  let args = "";
  if (core.getInput("analyze_self_only") === "true") {
    args += `--repo ${repo}`;
    return args;
  }

  if (core.getInput("repositories") !== "") {
    args += `--repo ${core.getInput("repositories")}`;
    return args;
  }

  args += `--org ${owner}`;

  return args;
}

function downloadAndExtract(fileUrl, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);

    request(fileUrl)
      .on("error", (error) => {
        reject(error);
      })
      .pipe(file)
      .on("close", () => {
        const readStream = fs.createReadStream(filePath);
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
      });
  });
}

async function run() {
  try {
    const token = core.getInput("github_token");
    if (!token) {
      core.setFailed("No GitHub token provided");
    }

    const owner = process.env["GITHUB_REPOSITORY_OWNER"];
    const repo = process.env["GITHUB_REPOSITORY"];
    const legitifyBaseVersion = core.getInput("legitify_base_version");
    const fileUrl = await fetchLegitifyReleaseUrl(legitifyBaseVersion);
    const filePath = path.join(__dirname, "legitify.tar.gz");

    const args = generateAnalyzeArgs(repo, owner);

    await downloadAndExtract(fileUrl, filePath);

    await executeLegitify(token, args);
  } catch (error) {
    core.setFailed(error.message);
  }
  uploadArtifact("error.log");
}

run();
