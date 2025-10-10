# Generated Anchor Clients

Run `npm run anchor:build` (after installing the Solana SBF toolchain) to
populate this folder with TypeScript clients derived from the workspace IDLs.
The build step writes:

- `generated/idl/<program>.json` – canonical IDL for each program.
- `generated/types/<program>.ts` – strongly typed Anchor client glue for the
  Node server and React app.

These files are intentionally omitted from source control until the build
pipeline produces real output. Once the Solana toolchain is installed locally
and in CI, regenerate the clients and commit them alongside the server changes
that consume them.
