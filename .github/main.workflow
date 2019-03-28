workflow "Run Tests" {
  on = "push"
  resolves = ["Test", "Lint", "Formatting"]
}

action "Lint" {
  uses = "actions/npm@v2.0.0"
  runs = "npx eslint --no-eslintrc --env es6 --parser-options ecmaVersion:2018 *.js"
}

action "Formatting" {
  uses = "actions/npm@v2.0.0"
  runs = "npx prettier -c --no-semi --no-bracket-spacing --single-quote *.js"
}

action "Test" {
  uses = "./"
  args = ["10", "11"]
  # secrets = ["GITHUB_TOKEN"]
}