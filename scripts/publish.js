require("gh-pages").publish(
  "public",
  {
    branch: "master",
    repo: "git@github.com:lelandrichardson/lelandrichardson.github.io.git"
  },
  err => {
    if (err) {
      console.log(err);
    } else {
      console.log("Deploy Complete!");
    }
  }
);
