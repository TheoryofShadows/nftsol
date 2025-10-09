#!/usr/bin/env node
import { access, mkdir, readFile, readdir, copyFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceDir = fileURLToPath(new URL("../anchor/solana_rewards", import.meta.url));
const targetIdlDir = join(workspaceDir, "target", "idl");
const generatedDir = join(workspaceDir, "generated");
const generatedIdlDir = join(generatedDir, "idl");
const generatedTypesDir = join(generatedDir, "types");

const run = (cmd, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit" });
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${cmd} ${args.join(" ")} exited with code ${code}`));
      }
    });
  });

const directoryExists = async (path) => {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
};

const bootstrap = async () => {
  await mkdir(generatedIdlDir, { recursive: true });
  await mkdir(generatedTypesDir, { recursive: true });

  if (!(await directoryExists(targetIdlDir))) {
    console.warn(
      `Anchor build artifacts not found at ${targetIdlDir}. Skipping client generation.`,
    );
    return;
  }

  const files = await readdir(targetIdlDir);
  const idlFiles = files.filter((file) => file.endsWith(".json"));
  if (idlFiles.length === 0) {
    console.warn(
      `No IDL files found under ${targetIdlDir}. Skipping client generation.`,
    );
    return;
  }

  for (const file of idlFiles) {
    const source = join(targetIdlDir, file);
    const dest = join(generatedIdlDir, file);
    await copyFile(source, dest);
    const out = join(generatedTypesDir, `${file.replace(/\.json$/, "")}.ts`);
    await run("anchor", ["idl", "type", dest, "--out", out]);
    const ts = await readFile(out, "utf-8");
    if (!ts.includes("export type")) {
      throw new Error(`anchor idl type produced unexpected output for ${file}`);
    }
  }

  const exportBarrel =
    idlFiles
      .map((file) => {
        const name = file.replace(/\.json$/, "");
        return `export * as ${camelCase(name)} from "./${name}.js";`;
      })
      .join("\n") + "\n";
  await writeFile(join(generatedTypesDir, "index.ts"), exportBarrel, "utf-8");
};

const camelCase = (input) =>
  input
    .split(/[-_]/)
    .map((part, index) =>
      index === 0 ? part.toLowerCase() : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join("");

bootstrap().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
