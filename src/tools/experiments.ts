import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from "../api/client.js";
import { formatError } from "../utils/errors.js";
import { jsonText, buildQueryParams } from "../utils/formatters.js";

const EXPERIMENT_STATES = [
  "PREPARE_FOR_SUBMISSION",
  "READY_FOR_REVIEW",
  "WAITING_FOR_REVIEW",
  "IN_REVIEW",
  "ACCEPTED",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
  "STOPPED",
] as const;

export function registerExperimentTools(server: McpServer): void {
  server.tool(
    "list_app_store_version_experiments",
    "List Product Page Optimization (PPO) experiments on an App Store version.",
    {
      version_id: z.string().describe("appStoreVersion resource ID"),
      limit: z.number().int().min(1).max(200).default(50),
      include: z
        .array(z.enum(["appStoreVersionExperimentTreatments", "controlVersions"]))
        .optional(),
    },
    async ({ version_id, limit, include }) => {
      try {
        const params = buildQueryParams({ limit, include });
        const { data } = await getApiClient().get(
          `/v2/appStoreVersions/${version_id}/appStoreVersionExperiments`,
          { params }
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "get_app_store_version_experiment",
    "Get a single PPO experiment with state, traffic proportion, and treatments.",
    {
      experiment_id: z.string().describe("appStoreVersionExperiment resource ID"),
      include: z
        .array(z.enum(["appStoreVersionExperimentTreatments"]))
        .optional(),
    },
    async ({ experiment_id, include }) => {
      try {
        const params = buildQueryParams({ include });
        const { data } = await getApiClient().get(
          `/v2/appStoreVersionExperiments/${experiment_id}`,
          { params }
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "create_app_store_version_experiment",
    "Create a new PPO experiment on an App Store version. Default traffic proportion is the share of users seeing all treatments combined.",
    {
      version_id: z.string().describe("appStoreVersion resource ID"),
      name: z.string().min(1).max(64).describe("Experiment name"),
      traffic_proportion: z
        .number()
        .int()
        .min(1)
        .max(99)
        .describe("Percent of users in any treatment, 1-99"),
    },
    async ({ version_id, name, traffic_proportion }) => {
      try {
        const body = {
          data: {
            type: "appStoreVersionExperiments",
            attributes: { name, trafficProportion: traffic_proportion },
            relationships: {
              appStoreVersion: { data: { type: "appStoreVersions", id: version_id } },
            },
          },
        };
        const { data } = await getApiClient().post(
          "/v2/appStoreVersionExperiments",
          body
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "update_app_store_version_experiment",
    "Update a PPO experiment — adjust traffic proportion, start/stop, or change state.",
    {
      experiment_id: z.string().describe("appStoreVersionExperiment resource ID"),
      name: z.string().min(1).max(64).optional(),
      traffic_proportion: z.number().int().min(1).max(99).optional(),
      started: z.boolean().optional().describe("Set true to start, false to leave"),
      state: z.enum(EXPERIMENT_STATES).optional().describe("Force a state change"),
    },
    async ({ experiment_id, name, traffic_proportion, started, state }) => {
      try {
        const body = {
          data: {
            type: "appStoreVersionExperiments",
            id: experiment_id,
            attributes: {
              name,
              trafficProportion: traffic_proportion,
              started,
              state,
            },
          },
        };
        const { data } = await getApiClient().patch(
          `/v2/appStoreVersionExperiments/${experiment_id}`,
          body
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "delete_app_store_version_experiment",
    "Delete a PPO experiment that has not yet started.",
    {
      experiment_id: z.string().describe("appStoreVersionExperiment resource ID"),
    },
    async ({ experiment_id }) => {
      try {
        await getApiClient().delete(`/v2/appStoreVersionExperiments/${experiment_id}`);
        return { content: [{ type: "text", text: `Experiment ${experiment_id} deleted.` }] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "list_experiment_treatments",
    "List treatments (variants) inside a PPO experiment. Up to 3 per experiment.",
    {
      experiment_id: z.string().describe("appStoreVersionExperiment resource ID"),
      limit: z.number().int().min(1).max(200).default(50),
      include: z
        .array(
          z.enum([
            "appStoreVersionExperimentTreatmentLocalizations",
            "appIcon",
          ])
        )
        .optional(),
    },
    async ({ experiment_id, limit, include }) => {
      try {
        const params = buildQueryParams({ limit, include });
        const { data } = await getApiClient().get(
          `/v2/appStoreVersionExperiments/${experiment_id}/appStoreVersionExperimentTreatments`,
          { params }
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "create_experiment_treatment",
    "Create a treatment (variant) inside a PPO experiment.",
    {
      experiment_id: z.string().describe("appStoreVersionExperiment resource ID"),
      name: z.string().min(1).max(64).describe("Treatment name"),
      traffic_proportion: z
        .number()
        .int()
        .min(1)
        .max(99)
        .describe("Share of experiment traffic for this treatment"),
    },
    async ({ experiment_id, name, traffic_proportion }) => {
      try {
        const body = {
          data: {
            type: "appStoreVersionExperimentTreatments",
            attributes: { name, trafficProportion: traffic_proportion },
            relationships: {
              appStoreVersionExperiment: {
                data: {
                  type: "appStoreVersionExperiments",
                  id: experiment_id,
                },
              },
            },
          },
        };
        const { data } = await getApiClient().post(
          "/v1/appStoreVersionExperimentTreatments",
          body
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "update_experiment_treatment",
    "Update a PPO treatment — rename or change traffic share.",
    {
      treatment_id: z
        .string()
        .describe("appStoreVersionExperimentTreatment resource ID"),
      name: z.string().min(1).max(64).optional(),
      traffic_proportion: z.number().int().min(1).max(99).optional(),
    },
    async ({ treatment_id, name, traffic_proportion }) => {
      try {
        const body = {
          data: {
            type: "appStoreVersionExperimentTreatments",
            id: treatment_id,
            attributes: { name, trafficProportion: traffic_proportion },
          },
        };
        const { data } = await getApiClient().patch(
          `/v1/appStoreVersionExperimentTreatments/${treatment_id}`,
          body
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "delete_experiment_treatment",
    "Delete a PPO treatment.",
    {
      treatment_id: z
        .string()
        .describe("appStoreVersionExperimentTreatment resource ID"),
    },
    async ({ treatment_id }) => {
      try {
        await getApiClient().delete(
          `/v1/appStoreVersionExperimentTreatments/${treatment_id}`
        );
        return { content: [{ type: "text", text: `Treatment ${treatment_id} deleted.` }] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "create_experiment_treatment_localization",
    "Add a localized variant of a treatment (sets up screenshots/previews override per locale).",
    {
      treatment_id: z
        .string()
        .describe("appStoreVersionExperimentTreatment resource ID"),
      locale: z.string().describe("Locale code"),
    },
    async ({ treatment_id, locale }) => {
      try {
        const body = {
          data: {
            type: "appStoreVersionExperimentTreatmentLocalizations",
            attributes: { locale },
            relationships: {
              appStoreVersionExperimentTreatment: {
                data: {
                  type: "appStoreVersionExperimentTreatments",
                  id: treatment_id,
                },
              },
            },
          },
        };
        const { data } = await getApiClient().post(
          "/v1/appStoreVersionExperimentTreatmentLocalizations",
          body
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "list_experiment_treatment_localizations",
    "List localizations on a PPO treatment.",
    {
      treatment_id: z
        .string()
        .describe("appStoreVersionExperimentTreatment resource ID"),
    },
    async ({ treatment_id }) => {
      try {
        const { data } = await getApiClient().get(
          `/v1/appStoreVersionExperimentTreatments/${treatment_id}/appStoreVersionExperimentTreatmentLocalizations`
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "start_app_store_version_experiment",
    "Start a PPO experiment (sets started=true).",
    {
      experiment_id: z.string().describe("appStoreVersionExperiment resource ID"),
    },
    async ({ experiment_id }) => {
      try {
        const body = {
          data: {
            type: "appStoreVersionExperiments",
            id: experiment_id,
            attributes: { started: true },
          },
        };
        const { data } = await getApiClient().patch(
          `/v2/appStoreVersionExperiments/${experiment_id}`,
          body
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "stop_app_store_version_experiment",
    "Stop a running PPO experiment (sets state=STOPPED).",
    {
      experiment_id: z.string().describe("appStoreVersionExperiment resource ID"),
    },
    async ({ experiment_id }) => {
      try {
        const body = {
          data: {
            type: "appStoreVersionExperiments",
            id: experiment_id,
            attributes: { state: "STOPPED" },
          },
        };
        const { data } = await getApiClient().patch(
          `/v2/appStoreVersionExperiments/${experiment_id}`,
          body
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );
}
