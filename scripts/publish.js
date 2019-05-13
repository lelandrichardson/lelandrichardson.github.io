require("gh-pages").publish(
  "public",
  {
    branch: "master",
    repo: "https://github.com/lelandrichardson/lelandrichardson.github.io.git"
  },
  () => {
    console.log("Deploy Complete!");
  }
);
