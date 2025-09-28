import process from 'node:process';

import chalk from 'chalk';
import { Command } from 'commander';

import { applyAssetDiffs } from './assetUpdater.js';
import { applyTextDiffs, resolveProjectFiles } from './fileUpdater.js';
import { DiffService } from './diffService.js';
import { FigmaClient } from './figmaClient.js';
import { loadConfig } from './config.js';
import { logger } from './logger.js';
import type { AssetDiff, AssetDiffResult, DiffResponse, TextDiffWithContext } from './types.js';

function printTextDiffs(diffResponse: DiffResponse) {
  if (diffResponse.diffs.length === 0) {
    logger.info('No text changes detected between the selected versions.');
  } else {
    logger.info(
      `Changes from ${chalk.cyan(diffResponse.fromVersion.label)} to ${chalk.cyan(diffResponse.toVersion.label)}:`
    );

    diffResponse.diffs.forEach((diff, index) => {
      logger.info(chalk.bold(`#${index + 1} ${diff.nodeName || diff.nodeId}`));
      logger.info(chalk.red(`- ${diff.previousText}`));
      logger.info(chalk.green(`+ ${diff.currentText}`));
    });
  }

  printAssetDiffs(diffResponse.assetDiffs);
}

function printApplicationResults(results: TextDiffWithContext[], dryRun: boolean) {
  if (results.length === 0) {
    logger.info('No diffs to apply.');
    return;
  }

  let total = 0;

  for (const result of results) {
    if (result.matchedFiles.length === 0) {
      logger.warn(`No matches found for ${result.nodeName ?? result.nodeId}.`);
      continue;
    }

    logger.info(chalk.bold(`Updated references for ${result.nodeName ?? result.nodeId}`));
    for (const match of result.matchedFiles) {
      total += match.replacements;
      const message = `${match.filePath} (${match.replacements} replacements)`;
      logger.info(dryRun ? chalk.yellow(`[dry-run] ${message}`) : chalk.green(message));
    }
  }

  logger.info(
    dryRun
      ? chalk.yellow(`Dry run finished. ${total} potential replacements were identified.`)
      : chalk.green(`Done! ${total} replacements written to disk.`)
  );
}

function printAssetDiffs(assetDiffs: AssetDiff[]) {
  if (assetDiffs.length === 0) {
    logger.info('No binary asset changes detected between the selected versions.');
    return;
  }

  logger.info(chalk.bold('Binary asset changes:'));
  assetDiffs.forEach((asset, index) => {
    logger.info(chalk.bold(`#${index + 1} ${asset.nodeName ?? asset.nodeId}`));
    logger.info(chalk.gray(`path: ${asset.assetPath}`));
    if (asset.mimeType) {
      logger.info(chalk.gray(`mime: ${asset.mimeType}`));
    }
  });
}

function printAssetApplicationResults(results: AssetDiffResult[], dryRun: boolean) {
  if (results.length === 0) {
    return;
  }

  let written = 0;

  for (const result of results) {
    const label = result.outputPath || result.assetPath;

    if (result.status === 'written') {
      written += 1;
      logger.info(chalk.green(`${label} updated`));
    } else if (result.status === 'dry-run') {
      logger.info(chalk.yellow(`[dry-run] ${label}`));
    } else {
      logger.warn(`${label} skipped: ${result.reason ?? 'unknown reason'}`);
    }
  }

  if (dryRun) {
    logger.info(chalk.yellow('Dry run finished for binary assets.'));
  } else {
    logger.info(chalk.green(`Binary asset updates completed. ${written} file(s) written.`));
  }
}

export async function runCli(argv = process.argv): Promise<void> {
  const program = new Command();

  program
    .name('figma-updater')
    .description('Inspect Figma layout diffs and update your codebase automatically.')
    .option('-c, --config <path>', 'Path to figma-updater.config.js file', 'figma-updater.config.js');

  program
    .command('versions')
    .argument('<fileKey>', 'Figma file key')
    .description('List versions available for the provided Figma file key')
    .action(async (fileKey: string, command: Command) => {
      const configPath = command.parent?.opts<{ config?: string }>().config;
      const config = await loadConfig(configPath);
      const client = new FigmaClient({
        apiToken: config.figma.apiToken,
        baseUrl: config.figma.baseUrl
      });

      try {
        const versions = await client.listVersions(fileKey);
        if (versions.length === 0) {
          logger.warn('No versions available for the provided file.');
          return;
        }

        versions.forEach((version) => {
          logger.info(`${chalk.cyan(version.id)} ${version.label} (${version.createdAt})`);
          if (version.description) {
            logger.info(chalk.gray(`  ${version.description}`));
          }
        });
      } catch (error) {
        logger.error(`Unable to fetch Figma versions: ${(error as Error).message}`);
        process.exitCode = 1;
      }
    });

  program
    .command('diff')
    .argument('<fileKey>', 'Figma file key')
    .requiredOption('-f, --from <version>', 'Source version identifier')
    .requiredOption('-t, --to <version>', 'Target version identifier')
    .description('Display text differences between two Figma versions')
    .action(async (fileKey: string, _options: unknown, command: Command) => {
      const configPath = command.parent?.opts<{ config?: string }>().config;
      const config = await loadConfig(configPath);
      const diffService = new DiffService({
        baseUrl: config.elizaApi.baseUrl,
        apiKey: config.elizaApi.apiKey
      });

      try {
        const commandOptions = command.opts<{ from: string; to: string }>();
        const diffs = await diffService.getTextDiffs(fileKey, commandOptions.from, commandOptions.to);
        printTextDiffs(diffs);
      } catch (error) {
        logger.error(`Unable to fetch diff: ${(error as Error).message}`);
        process.exitCode = 1;
      }
    });

  program
    .command('apply')
    .argument('<fileKey>', 'Figma file key')
    .requiredOption('-f, --from <version>', 'Source version identifier')
    .requiredOption('-t, --to <version>', 'Target version identifier')
    .option('--dry-run', 'Show replacements without writing to disk', false)
    .description('Apply text differences to the local project files')
    .action(async (fileKey: string, _options: unknown, command: Command) => {
      const configPath = command.parent?.opts<{ config?: string }>().config;
      const config = await loadConfig(configPath);
      const diffService = new DiffService({
        baseUrl: config.elizaApi.baseUrl,
        apiKey: config.elizaApi.apiKey
      });

      try {
        const commandOptions = command.opts<{ from: string; to: string; dryRun?: boolean }>();
        let projectFiles: string[] = [];

        try {
          projectFiles = await resolveProjectFiles({
            rootDir: config.project.rootDir,
            includeGlobs: config.project.includeGlobs,
            excludeGlobs: config.project.excludeGlobs
          });
        } catch (validationError) {
          logger.error((validationError as Error).message);
          process.exitCode = 1;
          return;
        }

        const diffResponse = await diffService.getTextDiffs(fileKey, commandOptions.from, commandOptions.to);
        printTextDiffs(diffResponse);
        const results = await applyTextDiffs(diffResponse.diffs, {
          rootDir: config.project.rootDir,
          includeGlobs: config.project.includeGlobs,
          excludeGlobs: config.project.excludeGlobs,
          dryRun: Boolean(commandOptions.dryRun),
          files: projectFiles
        });
        printApplicationResults(results, Boolean(commandOptions.dryRun));

        const assetResults = await applyAssetDiffs(diffResponse.assetDiffs, {
          rootDir: config.project.rootDir,
          assetsDir: config.project.assetRootDir,
          dryRun: Boolean(commandOptions.dryRun)
        });
        printAssetApplicationResults(assetResults, Boolean(commandOptions.dryRun));
      } catch (error) {
        logger.error(`Unable to apply diff: ${(error as Error).message}`);
        process.exitCode = 1;
      }
    });

  await program.parseAsync(argv);
}

export default runCli;
