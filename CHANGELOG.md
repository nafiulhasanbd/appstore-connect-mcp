# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2026-04-25

### Added — Growth & Marketing

- **Custom Product Pages**: `list_custom_product_pages`, `get_custom_product_page`, `create_custom_product_page`, `update_custom_product_page`, `delete_custom_product_page`, `list_custom_product_page_versions`, `create_custom_product_page_version`, `list_custom_product_page_localizations`, `create_custom_product_page_localization`, `update_custom_product_page_localization`, `list_custom_product_page_screenshot_sets`.
- **Product Page Optimization (PPO)**: `list_app_store_version_experiments`, `get_app_store_version_experiment`, `create_app_store_version_experiment`, `update_app_store_version_experiment`, `delete_app_store_version_experiment`, `list_experiment_treatments`, `create_experiment_treatment`, `update_experiment_treatment`, `delete_experiment_treatment`, `list_experiment_treatment_localizations`, `create_experiment_treatment_localization`, `start_app_store_version_experiment`, `stop_app_store_version_experiment`.

### Changed

- Bundle 87KB → 108KB.
- Tests 17 → 22 (added CPP + experiment coverage).

## [1.1.0] - 2026-04-25

### Added — End-to-end App Store submission

- **App metadata**: `list_app_infos`, `update_app_info`, `list_app_categories`, `list_app_info_localizations`, `create_app_info_localization`, `update_app_info_localization`.
- **Version localizations**: `list_app_store_version_localizations`, `get_app_store_version_localization`, `create_app_store_version_localization`, `update_app_store_version_localization`, `delete_app_store_version_localization`.
- **Screenshots & previews**: `list_screenshot_sets`, `create_screenshot_set`, `upload_screenshot` (reserve + chunked upload + commit), `list_screenshots`, `reorder_screenshots`, `delete_screenshot`, `list_preview_sets`, `create_preview_set`, `upload_app_preview`.
- **Pricing**: `get_app_price_schedule`, `set_app_price_schedule`, `list_app_price_points`, `get_app_availability`, `set_app_availability`, `list_territories`.
- **IAP**: `list_in_app_purchases`, `get_in_app_purchase`, `create_in_app_purchase`, `update_in_app_purchase`, `delete_in_app_purchase`, `create_in_app_purchase_localization`, `submit_in_app_purchase_for_review`.
- **Subscriptions**: `list_subscription_groups`, `create_subscription_group`, `list_subscriptions_in_group`, `create_subscription`, `create_subscription_localization`, `create_subscription_price`, `list_subscription_price_points`, `create_subscription_introductory_offer`, `submit_subscription_for_review`.
- **Submission & release**: `create_app_store_version`, `update_app_store_version`, `delete_app_store_version`, `attach_build_to_version`, `create_app_store_review_submission`, `add_version_to_review_submission`, `submit_review_submission`, `create_phased_release`, `update_phased_release`, `create_app_store_version_release_request`.

### Changed

- Bundle size 28KB → 87KB.
- Tests expanded: 12 → 17 (added submission + localization coverage).

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
