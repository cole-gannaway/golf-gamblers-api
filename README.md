# golf-gamblers-api

## Deploy

```sh
firebase deploy --only functions
```

## Debug functions using the emulator

```sh
firebase emulators:start --inspect-functions
```

## Run emulators locally, export data on end, and import previous data again

```sh
firebase emulators:export <relative_directory_path>
firebase emulators:start --import=<relative_directory_path>
```
