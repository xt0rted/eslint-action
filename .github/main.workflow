workflow "Push actions" {
  on = "push"
  resolves = [
    "Install dependencies",
    "Run ESLint"
  ]
}

action "Install dependencies" {
  uses = "docker://node:10-alpine"
  runs = "npm ci"
}

action "Run ESLint" {
  uses = "./"
  needs = ["Install dependencies"]
  secrets = ["GITHUB_TOKEN"]
}
