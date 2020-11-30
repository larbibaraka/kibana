/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import { Logger } from 'src/core/server';
import {
  ConcreteTaskInstance,
  TaskManagerSetupContract,
  TaskManagerStartContract,
} from '../../../../task_manager/server';
import { TelemetryEventsSender } from './sender';

export const TelemetryDiagTaskConstants = {
  TIMEOUT: '1m',
  TYPE: 'security:telemetry-diagnostics',
  INTERVAL: '10s', // TODO: update to 5m
  VERSION: '1.0.0',
};

export class TelemetryDiagTask {
  private readonly logger: Logger;
  private readonly sender: TelemetryEventsSender;

  constructor(
    logger: Logger,
    taskManager: TaskManagerSetupContract,
    sender: TelemetryEventsSender
  ) {
    this.logger = logger;
    this.sender = sender;

    taskManager.registerTaskDefinitions({
      [TelemetryDiagTaskConstants.TYPE]: {
        title: 'Security Solution Telemetry Diagnostics task',
        timeout: TelemetryDiagTaskConstants.TIMEOUT,
        createTaskRunner: ({ taskInstance }: { taskInstance: ConcreteTaskInstance }) => {
          return {
            run: async () => {
              await this.runTask(taskInstance.id);
            },
            cancel: async () => {},
          };
        },
      },
    });
  }

  public start = async (taskManager: TaskManagerStartContract) => {
    try {
      await taskManager.ensureScheduled({
        id: this.getTaskId(),
        taskType: TelemetryDiagTaskConstants.TYPE,
        scope: ['securitySolution'],
        schedule: {
          interval: TelemetryDiagTaskConstants.INTERVAL,
        },
        state: {},
        params: { version: TelemetryDiagTaskConstants.VERSION },
      });
    } catch (e) {
      this.logger.error(`Error scheduling task, received ${e.message}`);
    }
  };

  private getTaskId = (): string => {
    return `${TelemetryDiagTaskConstants.TYPE}:${TelemetryDiagTaskConstants.VERSION}`;
  };

  public runTask = async (taskId: string) => {
    // Check that this task is current
    if (taskId !== this.getTaskId()) {
      // old task, return
      this.logger.debug(`Outdated task running: ${taskId}`);
      return;
    }

    const isOptedIn = this.sender.isTelemetryOptedIn();
    if (!isOptedIn) {
      this.logger.debug(`Telemetry is not opted-in.`);
      return;
    }

    const response = await this.sender.fetchDiagnosticAlerts();
    const hits = response.hits?.hits || [];
    this.logger.debug(hits);

    if (!Array.isArray(hits) || !hits.length) {
      this.logger.debug('no diagnostic alerts to send');
      return; // No results
    }

    this.logger.debug('TODO: Queue telemetry events for sending');
    this.sender.queueTelemetryEvents(hits);

    this.logger.debug('TODO: Record the last execution time');
  };
}
