# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-04-25

### Added
- Initial release.
- ES256 JWT auth with on-disk `.p8` or env-var key contents, 20-min token cache.
- Apps: `list_apps`, `get_app`, `list_app_store_versions`, `get_app_store_version`.
- Builds: `list_builds`, `get_build`, `list_pre_release_versions`.
- TestFlight: `list_beta_groups`, `list_beta_testers`, `create_beta_tester`, `delete_beta_tester`, `submit_build_for_beta_review`.
- Customer Reviews: `list_customer_reviews`, `get_customer_review`, `respond_to_customer_review`, `delete_customer_review_response`.
- Sales/Finance: `download_sales_report`, `download_finance_report`.
- Team Users: `list_team_users`, `get_team_user`, `list_user_invitations`.
