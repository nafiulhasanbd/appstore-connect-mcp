import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from "../api/client.js";
import { formatError } from "../utils/errors.js";
import { jsonText } from "../utils/formatters.js";

const FREQ = ["NONE", "INFREQUENT_OR_MILD", "FREQUENT_OR_INTENSE"] as const;
const KIDS_AGE_BAND = ["FIVE_AND_UNDER", "SIX_TO_EIGHT", "NINE_TO_ELEVEN", "TWELVE_AND_OVER"] as const;
const LOOT_BOX = ["NONE", "INFREQUENT_OR_MILD", "FREQUENT_OR_INTENSE"] as const;

export function registerAgeRatingTools(server: McpServer): void {
  server.tool(
    "get_age_rating_declaration",
    "Fetch the age rating declaration for an appInfo. Returns all content descriptors (violence, sexual content, drug references, etc.) plus the resulting Apple/IARC rating.",
    {
      app_info_id: z.string().describe("appInfo resource ID. Get via list_app_infos."),
    },
    async ({ app_info_id }) => {
      try {
        const { data } = await getApiClient().get(
          `/v1/appInfos/${app_info_id}/ageRatingDeclaration`
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "update_age_rating_declaration",
    "Update the age rating declaration. Pass only the descriptors you want to change. Apple recomputes the rating based on the highest-severity declared item.",
    {
      declaration_id: z.string().describe("ageRatingDeclaration resource ID"),
      alcohol_tobacco_or_drug_use_or_references: z.enum(FREQ).optional(),
      contests: z.enum(FREQ).optional(),
      gambling: z.boolean().optional(),
      gambling_and_contests: z
        .boolean()
        .optional()
        .describe("Deprecated combined flag — prefer 'gambling' + 'contests'"),
      gambling_simulated: z.enum(FREQ).optional(),
      horror_or_fear_themes: z.enum(FREQ).optional(),
      kids_age_band: z
        .enum(KIDS_AGE_BAND)
        .optional()
        .describe("Required for Kids Category apps"),
      loot_box: z.enum(LOOT_BOX).optional().describe("Loot box content frequency"),
      mature_or_suggestive_themes: z.enum(FREQ).optional(),
      medical_or_treatment_information: z.enum(FREQ).optional(),
      profanity_or_crude_humor: z.enum(FREQ).optional(),
      sexual_content_graphic_and_nudity: z.enum(FREQ).optional(),
      sexual_content_or_nudity: z.enum(FREQ).optional(),
      unrestricted_web_access: z.boolean().optional(),
      violence_cartoon_or_fantasy: z.enum(FREQ).optional(),
      violence_realistic: z.enum(FREQ).optional(),
      violence_realistic_prolonged_graphic_or_sadistic: z.enum(FREQ).optional(),
      seventeen_plus: z
        .boolean()
        .optional()
        .describe("Force 17+ even when other declarations would yield a lower rating"),
    },
    async (args) => {
      try {
        const a = args;
        const attributes: Record<string, unknown> = {
          alcoholTobaccoOrDrugUseOrReferences: a.alcohol_tobacco_or_drug_use_or_references,
          contests: a.contests,
          gambling: a.gambling,
          gamblingAndContests: a.gambling_and_contests,
          gamblingSimulated: a.gambling_simulated,
          horrorOrFearThemes: a.horror_or_fear_themes,
          kidsAgeBand: a.kids_age_band,
          lootBox: a.loot_box,
          matureOrSuggestiveThemes: a.mature_or_suggestive_themes,
          medicalOrTreatmentInformation: a.medical_or_treatment_information,
          profanityOrCrudeHumor: a.profanity_or_crude_humor,
          sexualContentGraphicAndNudity: a.sexual_content_graphic_and_nudity,
          sexualContentOrNudity: a.sexual_content_or_nudity,
          unrestrictedWebAccess: a.unrestricted_web_access,
          violenceCartoonOrFantasy: a.violence_cartoon_or_fantasy,
          violenceRealistic: a.violence_realistic,
          violenceRealisticProlongedGraphicOrSadistic:
            a.violence_realistic_prolonged_graphic_or_sadistic,
          seventeenPlus: a.seventeen_plus,
        };
        // Strip undefined so Apple doesn't reset unspecified fields to default.
        for (const [k, v] of Object.entries(attributes)) {
          if (v === undefined) delete attributes[k];
        }
        const body = {
          data: {
            type: "ageRatingDeclarations",
            id: a.declaration_id,
            attributes,
          },
        };
        const { data } = await getApiClient().patch(
          `/v1/ageRatingDeclarations/${a.declaration_id}`,
          body
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );
}
