# NPM Matrix

This action allows you to run `npm test` across multiple versions of Node.js.

Example workflow file:

```workflow
workflow "Run Tests" {
  on = "push"
  resolves = "Test Matrix"
}

action "Test Matrix" {
  uses = "actions/node-matrix@v1.0.0"

  # Specify the versions of node to test against as `args`.
  args = ["8", "10", "11"]

  # Provide a GITHUB_TOKEN so that each version's tests show up in a
  # separate check run. Without this, they'll all be included in the
  # text output of this action.
  secrets = ["GITHUB_TOKEN"]
}
```

## Contributing

Check out [this doc](CONTRIBUTING.md).

## License

This action is released under the [MIT license](LICENSE.md).
Container images built with this project include third party materials. See [THIRD_PARTY_NOTICE.md](THIRD_PARTY_NOTICE.md) for details.

## Current Status

This action is in active development.
