# Usage Examples

Once configured, you can ask Claude things like:

## Apps & Versions

> List all my apps.
>
> Show me the App Store version state for `com.acme.timer`. Is anything in review?

## Builds & TestFlight

> List the last 5 builds across my account, newest first. Tell me which are still PROCESSING.
>
> Show me everyone in the "Power Users" beta group.
>
> Invite alice@example.com and bob@example.com to the "Power Users" beta group as testers.
>
> Submit build `12345678` for external TestFlight review.

## Customer Reviews

> Pull the last 50 one- and two-star reviews for app `com.acme.timer` from the US that I haven't responded to yet.
>
> For each review above, draft a short, friendly response under 200 chars. Don't post anything yet.
>
> OK, post the response to review id `xyz123`.

## Sales & Finance

> Download yesterday's daily SUMMARY sales report for vendor 12345678. Decode it and tell me the top 5 SKUs by units.

## Team

> Who has Admin or Finance role on my App Store Connect team?

---

## Tips

- The LLM works best when you give it a single app context up front: "We're working on app id `12345`".
- For destructive actions (delete tester, delete review response, submit for review), ask it to confirm before calling the tool.
