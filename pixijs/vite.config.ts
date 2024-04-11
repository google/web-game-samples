import { defineConfig, Plugin } from "vite";
import fs from "fs";
import path from "path";

// Recursively runs through provided directory to generate a list of all files.
function listFilesRecursively(directory: string): string[] {
  const files: string[] = [];

  function traverse(currentDir: string) {
    const items = fs.readdirSync(currentDir);

    items.forEach((item) => {
      const itemPath = path.join(currentDir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isFile()) {
        const relativePath = path
          .relative(directory, itemPath)
          .replace(/\\/g, "/");
        files.push("/" + relativePath);
      } else if (stat.isDirectory()) {
        traverse(itemPath);
      }
    });
  }

  traverse(directory);
  return files;
}

// Replaces "import.meta.publicFiles" with a hardcoded list of files within the "public" directory.
// This is separate from "import.meta.glob" as .glob will atempt to bundle files together with the
// main bundle while also copying over the public directory.
function replacePlugin(): Plugin {
  const projectRoot: string = process.cwd(); // Get the current working directory (project root)
  const directoryPath = path.resolve(projectRoot, "public");
  const files = listFilesRecursively(directoryPath);
  const fileListString = JSON.stringify(files);

  return {
    name: "replace-plugin",
    transform(code, id) {
      if (id.endsWith(".ts")) {
        code = code.replace(/import\.meta\.publicFiles/g, fileListString);
      }

      return { code, map: null };
    },
  };
}

export default defineConfig({
  base: "./",
  build: {
    target: "esnext",
    sourcemap: true,
    assetsInlineLimit: 0,
  },
  plugins: [replacePlugin()],
  server: {
    port: 3000,
    host: true,
  },
  preview: {
    host: true,
    port: 8080,
  },
});
