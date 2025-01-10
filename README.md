# my-favorite-readme-generator

a githut workflow action designed to generate a custom README.md

## Example Usage

### my-favorite-readme-generator.yml
```yml
name: my-favorite-readme-generator
on:
  schedule:
    - cron: '* * 1 * *'
  workflow_dispatch:
  workflow_call:
jobs:
  update:
    runs-on: macos-latest
    permissions: write-all
    env:
      GH_TOKEN: ${{ github.token }}
    steps:
      - uses: actions/checkout@v4
      - uses: slattman/my-favorite-readme-generator@latest
      - uses: slattman/commit-signed@latest
      - run: gh run delete $(gh run list --json databaseId -q "map(.databaseId)[1]")

```

or alternatively as a reusable workflow - [more](https://docs.github.com/en/actions/sharing-automations/reusing-workflows)

### generate-my-favorite-readme.yml
```yml
name: generate-my-favorite-readme
on:
  workflow_dispatch:
jobs:
  generate-readme:
    uses: slattman/my-favorite-readme-generator/.github/workflows/my-favorite-readme-generator.yaml@main
    permissions: write-all
```

<sub>inspired by [awesome readme generator](https://github.com/skyfe79/awesome-readme-generator)</sub>

