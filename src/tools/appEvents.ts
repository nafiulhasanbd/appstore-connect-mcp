import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from "../api/client.js";
import { formatError } from "../utils/errors.js";
import { jsonText, buildQueryParams } from "../utils/formatters.js";

const EVENT_STATES = [
  "DRAFT",
  "READY_FOR_REVIEW",
  "WAITING_FOR_REVIEW",
  "IN_REVIEW",
  "REJECTED",
  "ACCEPTED",
  "APPROVED",
  "PUBLISHED",
  "PAST",
  "ARCHIVED",
] as const;

const BADGE = [
  "LIVE_EVENT",
  "PREMIERE",
  "CHALLENGE",
  "COMPETITION",
  "NEW_SEASON",
  "MAJOR_UPDATE",
  "SPECIAL_EVENT",
] as const;

const PURPOSE = ["APPROPRIATE_FOR_ALL_USERS", "ATTRACT_NEW_USERS", "KEEP_ACTIVE_USERS", "BRING_BACK_LAPSED_USERS"] as const;

const PRIORITY = ["NORMAL", "HIGH"] as const;

const PURCHASE_REQ = [
  "NO_COST_ASSOCIATED",
  "IN_APP_PURCHASE",
  "SUBSCRIPTION",
  "FREE_TO_ENTER_WITH_INTERNET_CONNECTION",
] as const;

const TERRITORY_SCHEDULE = ["FOR_ALL_USERS_DEFAULT_TIME_ZONE", "FOR_EACH_USER_TIME_ZONE"] as const;

const PRIMARY_LOCALE = ["EVENT_CARD", "EVENT_DETAIL_PAGE"] as const;

export function registerAppEventTools(server: McpServer): void {
  server.tool(
    "list_app_events",
    "List In-App Events for an app. Filter by state to see drafts, in-review, published, past.",
    {
      app_id: z.string().describe("App resource ID"),
      limit: z.number().int().min(1).max(200).default(50),
      filter_event_state: z.array(z.enum(EVENT_STATES)).optional(),
      include: z.array(z.enum(["localizations"])).optional(),
    },
    async ({ app_id, limit, filter_event_state, include }) => {
      try {
        const params = buildQueryParams({
          limit,
          "filter[eventState]": filter_event_state,
          include,
        });
        const { data } = await getApiClient().get(`/v1/apps/${app_id}/appEvents`, { params });
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "get_app_event",
    "Get a single In-App Event with all attributes (state, schedule, badge, purpose, priority).",
    {
      event_id: z.string().describe("appEvent resource ID"),
      include: z.array(z.enum(["localizations"])).optional(),
    },
    async ({ event_id, include }) => {
      try {
        const params = buildQueryParams({ include });
        const { data } = await getApiClient().get(`/v1/appEvents/${event_id}`, { params });
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "create_app_event",
    "Create a draft In-App Event. After creation, add localizations + media, then transition to READY_FOR_REVIEW.",
    {
      app_id: z.string().describe("App resource ID"),
      reference_name: z.string().min(1).max(64).describe("Internal name (max 64 chars)"),
      badge: z.enum(BADGE).optional().describe("Visual badge shown on the event card"),
      deep_link: z
        .string()
        .url()
        .optional()
        .describe("Universal link opened when user taps the event"),
      purchase_requirement: z.enum(PURCHASE_REQ).optional(),
      primary_locale: z
        .string()
        .optional()
        .describe("Primary locale for the event, e.g. 'en-US'"),
      priority: z.enum(PRIORITY).optional(),
      purpose: z.enum(PURPOSE).optional(),
      territory_schedule: z.enum(TERRITORY_SCHEDULE).optional(),
      start: z.string().optional().describe("Event start ISO 8601 datetime"),
      end: z.string().optional().describe("Event end ISO 8601 datetime"),
      publish_start: z
        .string()
        .optional()
        .describe("When card becomes visible. ISO 8601."),
      event_start: z.string().optional().describe("Event experience start. ISO 8601."),
      event_end: z.string().optional().describe("Event experience end. ISO 8601."),
      territory_ids: z
        .array(z.string().length(3))
        .optional()
        .describe("Territory ISO codes the event runs in"),
    },
    async ({
      app_id,
      reference_name,
      badge,
      deep_link,
      purchase_requirement,
      primary_locale,
      priority,
      purpose,
      territory_schedule,
      start,
      end,
      publish_start,
      event_start,
      event_end,
      territory_ids,
    }) => {
      try {
        const relationships: Record<string, unknown> = {
          app: { data: { type: "apps", id: app_id } },
        };
        if (territory_ids && territory_ids.length > 0) {
          relationships.territories = {
            data: territory_ids.map((id) => ({ type: "territories", id })),
          };
        }
        const body = {
          data: {
            type: "appEvents",
            attributes: {
              referenceName: reference_name,
              badge,
              deepLink: deep_link,
              purchaseRequirement: purchase_requirement,
              primaryLocale: primary_locale,
              priority,
              purpose,
              territorySchedule: territory_schedule,
              start,
              end,
              publishStart: publish_start,
              eventStart: event_start,
              eventEnd: event_end,
            },
            relationships,
          },
        };
        const { data } = await getApiClient().post("/v1/appEvents", body);
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "update_app_event",
    "Update an In-App Event. Use to edit schedule, badge, deep link, priority, purpose, or transition state (e.g. submit by setting eventState=READY_FOR_REVIEW).",
    {
      event_id: z.string().describe("appEvent resource ID"),
      reference_name: z.string().min(1).max(64).optional(),
      badge: z.enum(BADGE).optional(),
      deep_link: z.string().url().optional(),
      purchase_requirement: z.enum(PURCHASE_REQ).optional(),
      priority: z.enum(PRIORITY).optional(),
      purpose: z.enum(PURPOSE).optional(),
      territory_schedule: z.enum(TERRITORY_SCHEDULE).optional(),
      start: z.string().optional(),
      end: z.string().optional(),
      publish_start: z.string().optional(),
      event_start: z.string().optional(),
      event_end: z.string().optional(),
      event_state: z
        .enum(EVENT_STATES)
        .optional()
        .describe("Set to READY_FOR_REVIEW to submit, ARCHIVED to retire"),
    },
    async ({
      event_id,
      reference_name,
      badge,
      deep_link,
      purchase_requirement,
      priority,
      purpose,
      territory_schedule,
      start,
      end,
      publish_start,
      event_start,
      event_end,
      event_state,
    }) => {
      try {
        const body = {
          data: {
            type: "appEvents",
            id: event_id,
            attributes: {
              referenceName: reference_name,
              badge,
              deepLink: deep_link,
              purchaseRequirement: purchase_requirement,
              priority,
              purpose,
              territorySchedule: territory_schedule,
              start,
              end,
              publishStart: publish_start,
              eventStart: event_start,
              eventEnd: event_end,
              eventState: event_state,
            },
          },
        };
        const { data } = await getApiClient().patch(`/v1/appEvents/${event_id}`, body);
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "submit_app_event_for_review",
    "Submit an In-App Event for App Review (sets eventState=READY_FOR_REVIEW).",
    {
      event_id: z.string().describe("appEvent resource ID"),
    },
    async ({ event_id }) => {
      try {
        const body = {
          data: {
            type: "appEvents",
            id: event_id,
            attributes: { eventState: "READY_FOR_REVIEW" },
          },
        };
        const { data } = await getApiClient().patch(`/v1/appEvents/${event_id}`, body);
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "archive_app_event",
    "Archive an In-App Event (sets eventState=ARCHIVED).",
    {
      event_id: z.string().describe("appEvent resource ID"),
    },
    async ({ event_id }) => {
      try {
        const body = {
          data: {
            type: "appEvents",
            id: event_id,
            attributes: { eventState: "ARCHIVED" },
          },
        };
        const { data } = await getApiClient().patch(`/v1/appEvents/${event_id}`, body);
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "delete_app_event",
    "Delete an In-App Event. Only allowed in DRAFT state.",
    {
      event_id: z.string().describe("appEvent resource ID"),
    },
    async ({ event_id }) => {
      try {
        await getApiClient().delete(`/v1/appEvents/${event_id}`);
        return { content: [{ type: "text", text: `App event ${event_id} deleted.` }] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "list_app_event_localizations",
    "List per-locale event metadata (name, short description, long description).",
    {
      event_id: z.string().describe("appEvent resource ID"),
      filter_locale: z.array(z.string()).optional(),
    },
    async ({ event_id, filter_locale }) => {
      try {
        const params = buildQueryParams({ "filter[locale]": filter_locale });
        const { data } = await getApiClient().get(
          `/v1/appEvents/${event_id}/localizations`,
          { params }
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "create_app_event_localization",
    "Add a locale to an In-App Event with name, short description, long description.",
    {
      event_id: z.string().describe("appEvent resource ID"),
      locale: z.string().describe("Locale code, e.g. 'en-US'"),
      name: z.string().min(1).max(30).describe("Event name (max 30 chars)"),
      short_description: z
        .string()
        .min(1)
        .max(50)
        .describe("Short description (max 50 chars)"),
      long_description: z
        .string()
        .min(1)
        .max(120)
        .describe("Long description (max 120 chars)"),
    },
    async ({ event_id, locale, name, short_description, long_description }) => {
      try {
        const body = {
          data: {
            type: "appEventLocalizations",
            attributes: {
              locale,
              name,
              shortDescription: short_description,
              longDescription: long_description,
            },
            relationships: {
              appEvent: { data: { type: "appEvents", id: event_id } },
            },
          },
        };
        const { data } = await getApiClient().post("/v1/appEventLocalizations", body);
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "update_app_event_localization",
    "Update an event localization.",
    {
      localization_id: z.string().describe("appEventLocalization resource ID"),
      name: z.string().min(1).max(30).optional(),
      short_description: z.string().min(1).max(50).optional(),
      long_description: z.string().min(1).max(120).optional(),
    },
    async ({ localization_id, name, short_description, long_description }) => {
      try {
        const body = {
          data: {
            type: "appEventLocalizations",
            id: localization_id,
            attributes: {
              name,
              shortDescription: short_description,
              longDescription: long_description,
            },
          },
        };
        const { data } = await getApiClient().patch(
          `/v1/appEventLocalizations/${localization_id}`,
          body
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "delete_app_event_localization",
    "Remove a locale from an In-App Event.",
    {
      localization_id: z.string().describe("appEventLocalization resource ID"),
    },
    async ({ localization_id }) => {
      try {
        await getApiClient().delete(`/v1/appEventLocalizations/${localization_id}`);
        return {
          content: [{ type: "text", text: `Event localization ${localization_id} deleted.` }],
        };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "primary_locale_for_app_event",
    "Helper: which surfaces use the primary locale (event card vs detail page).",
    {
      surface: z.enum(PRIMARY_LOCALE).describe("Which surface to inspect"),
    },
    async ({ surface }) => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              surface,
              note:
                "primaryLocale on appEvents controls which locale is shown when no localized variant is available.",
            },
            null,
            2
          ),
        },
      ],
    })
  );
}
