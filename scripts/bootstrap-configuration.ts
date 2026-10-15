import { bootstrapConfigurationFromEnvironment } from "../lib/configuration";
import { prisma } from "../lib/prisma";

bootstrapConfigurationFromEnvironment()
  .then(() => console.log("Configuration bootstrap complete. Existing database values were preserved."))
  .finally(() => prisma.$disconnect());
