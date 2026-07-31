export async function resolve(specifier, context, nextResolve) {
  if (specifier.endsWith(".js")) {
    try {
      return await nextResolve(`${specifier.slice(0, -3)}.ts`, context);
    } catch {
      // Fall through to the normal resolver for external and generated modules.
    }
  }
  return nextResolve(specifier, context);
}
