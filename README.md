# legitify-github-action

### Example 1

#### Analyze "repo1" and "repo2" from org "owner1"

```
name: Legitify Analyze
on:
  schedule:
    # Runs "At 11:00 on every day-of-week from Monday through Friday"
    - cron: '0 11 * * 1-5'

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Legitify Action
        uses: Legit-Labs/legitify-github-action@main
        with:
          github_token: ${{ secrets.TEST_PAT }}
          repositories: owner1/repo1 owner1/repo2
      - name: Upload Error Log
        uses: actions/upload-artifact@v3
        with:
          name: legitify-error-log
          path: error.log
```

### Example 2

#### Analyze the org of which this workflow is ran from

```
name: Legitify Analyze
on:
  schedule:
    # Runs "At 11:00 on every day-of-week from Monday through Friday"
    - cron: '0 11 * * 1-5'

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Legitify Action
        uses: Legit-Labs/legitify-github-action@main
        with:
          github_token: ${{ secrets.TEST_PAT }}
      - name: Upload Error Log
        uses: actions/upload-artifact@v3
        with:
          name: legitify-error-log
          path: error.log
```

### Example 3

#### Analyze the repo of which this workflow is ran from

```
name: Legitify Analyze
on:
  schedule:
    # Runs "At 11:00 on every day-of-week from Monday through Friday"
    - cron: '0 11 * * 1-5'

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Legitify Action
        uses: Legit-Labs/legitify-github-action@main
        with:
          github_token: ${{ secrets.TEST_PAT }}
          analyze_self_only: "true"
      - name: Upload Error Log
        uses: actions/upload-artifact@v3
        with:
          name: legitify-error-log
          path: error.log
```

### Example 4

#### Analyze using specific version of legitify

```
name: Legitify Analyze
on:
  schedule:
    # Runs "At 11:00 on every day-of-week from Monday through Friday"
    - cron: '0 11 * * 1-5'

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Legitify Action
        uses: Legit-Labs/legitify-github-action@main
        with:
          github_token: ${{ secrets.TEST_PAT }}
          legitify_version: "0.1.6"
          analyze_self_only: "true"
      - name: Upload Error Log
        uses: actions/upload-artifact@v3
        with:
          name: legitify-error-log
          path: error.log
```
