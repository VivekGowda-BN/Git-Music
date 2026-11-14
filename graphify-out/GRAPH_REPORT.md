# Graph Report - Git Music  (2026-11-14)

## Corpus Check
- 81 files · ~225,532 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 58 file(s) not represented in the graph (top: .csv 53, .css 2, .sqlite 1)
- WARNING: 58 of 217 files seen (27%) have no supported extractor and are missing from this graph entirely. It may look complete while representing only part of the codebase.

## Summary
- 1358 nodes · 2364 edges · 81 communities (56 shown, 25 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 118 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9fb4f790`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- validate_data.py
- ShadcnInstaller
- scripts/core.py
- gray
- color
- button
- slide_search_core.py
- pathlib
- design_system.py
- frontend/package.json
- spacing
- DesignSystemGenerator
- re
- html-token-validator.py
- App.jsx
- _palette_is_dark
- argparse
- TestTailwindConfigGenerator
- backend/package.json
- fetch-background.py
- read_rows
- test_relevance_evaluator.py
- .generate
- server.js
- cip/generate.py
- fontSize
- TailwindConfigGenerator
- CatalogRefreshTest
- extract-colors.cjs
- validate-asset.cjs
- cip/core.py
- TestWebStackFreshness
- logo/core.py
- .generate_config_string
- _select_palette_for_mode
- json
- TestDomainDetection
- TestSearchDomains
- render-html.py
- validate-tokens.cjs
- test_design_system_mode.py
- inject-brand-context.cjs
- sync-brand-to-tokens.cjs
- embed-tokens.cjs
- primitive
- main
- test_style_taxonomy.py
- generate-tokens.cjs
- TestStyleTaxonomy
- BM25
- BM25
- dependencies
- cip/search.py
- radius
- logo/search.py
- csv
- shadow
- test_core.py
- TestTokenizer
- auth.js
- ref_path
- lg
- TestBm25CoreBehavior
- db.js
- authMiddleware.js
- pages/AnalysePage.jsx
- scripts
- xl
- md
- none
- scripts
- VersionTree.jsx
- split_values

## God Nodes (most connected - your core abstractions)
1. `TailwindConfigGenerator` - 58 edges
2. `TestTailwindConfigGenerator` - 35 edges
3. `DesignSystemGenerator` - 35 edges
4. `ShadcnInstaller` - 34 edges
5. `TestShadcnInstaller` - 26 edges
6. `read_rows()` - 16 edges
7. `color` - 15 edges
8. `search()` - 15 edges
9. `CatalogRefreshTest` - 15 edges
10. `TestReasoningContract` - 15 edges

## Surprising Connections (you probably didn't know these)
- `TestGeneratedConfigIsValidJs` --uses--> `TailwindConfigGenerator`  [INFERRED]
  .agents/skills/ui-styling/scripts/tests/test_tailwind_config_gen.py → .agents/skills/ui-styling/scripts/tailwind_config_gen.py
- `TestTailwindConfigGenerator` --uses--> `TailwindConfigGenerator`  [INFERRED]
  .agents/skills/ui-styling/scripts/tests/test_tailwind_config_gen.py → .agents/skills/ui-styling/scripts/tailwind_config_gen.py
- `TestReasoningContract` --uses--> `DesignSystemGenerator`  [INFERRED]
  .agents/skills/ui-ux-pro-max/scripts/tests/test_data_contracts.py → .agents/skills/ui-ux-pro-max/scripts/design_system.py
- `TestEndToEndCoherence` --uses--> `DesignSystemGenerator`  [INFERRED]
  .agents/skills/ui-ux-pro-max/scripts/tests/test_design_system_mode.py → .agents/skills/ui-ux-pro-max/scripts/design_system.py
- `TestShadcnInstaller` --uses--> `ShadcnInstaller`  [INFERRED]
  .agents/skills/ui-styling/scripts/tests/test_shadcn_add.py → .agents/skills/ui-styling/scripts/shadcn_add.py

## Import Cycles
- None detected.

## Communities (81 total, 25 thin omitted)

### Community 0 - "validate_data.py"
Cohesion: 0.06
Nodes (44): read_rows(), TestAccessibilityGuidance, TestChartsTypographyAndIcons, TestCurrentReactGuidance, TestSemanticColors, TestGeneratedCatalogContract, _catalog_date(), _check_app_interface_contract() (+36 more)

### Community 1 - "ShadcnInstaller"
Cohesion: 0.05
Nodes (3): main(), ShadcnInstaller, TestShadcnInstaller

### Community 2 - "scripts/core.py"
Cohesion: 0.06
Nodes (31): BM25, _contains_phrase(), detect_domain(), _domain_keywords(), _exact_match_diagnostic(), _exact_row_identity(), _exact_stack_identifier(), _file_signature() (+23 more)

### Community 3 - "gray"
Cohesion: 0.05
Nodes (53): $type, $value, $type, $value, $type, $value, $type, $value (+45 more)

### Community 4 - "color"
Cohesion: 0.04
Nodes (48): $type, $value, background, destructive, destructive-foreground, foreground, muted, muted-foreground (+40 more)

### Community 5 - "button"
Cohesion: 0.06
Nodes (45): $type, $value, $type, $value, bg, fg, font-size, hover-bg (+37 more)

### Community 6 - "slide_search_core.py"
Cohesion: 0.08
Nodes (17): format_context(), format_result(), main(), BM25, calculate_pattern_break(), detect_domain(), get_background_config(), get_color_for_emotion() (+9 more)

### Community 7 - "pathlib"
Cohesion: 0.12
Nodes (5): test_sync_parses_bundled_starter_template(), main(), _run(), test_flags_hardcoded_hex_sharing_line_with_token(), test_token_only_line_reports_no_violation()

### Community 8 - "design_system.py"
Cohesion: 0.10
Nodes (11): ansi_ljust(), _detect_page_type(), format_ascii_box(), format_master_md(), format_page_override_md(), _generate_intelligent_overrides(), hex_to_ansi(), persist_design_system() (+3 more)

### Community 9 - "frontend/package.json"
Cohesion: 0.09
Nodes (33): devDependencies, autoprefixer@^10.5.0, eslint@^9.39.4, @eslint/js@^9.39.4, eslint-plugin-react-hooks@^7.0.1, eslint-plugin-react-refresh@^0.5.2, globals@^17.4.0, postcss@^8.5.10 (+25 more)

### Community 10 - "spacing"
Cohesion: 0.06
Nodes (34): $type, $value, $type, $value, $type, $value, $type, $value (+26 more)

### Community 12 - "re"
Cohesion: 0.11
Nodes (13): apply_color(), apply_viewbox_size(), extract_svgs(), generate_batch(), generate_icon(), generate_sizes(), load_env(), main() (+5 more)

### Community 13 - "html-token-validator.py"
Cohesion: 0.13
Nodes (12): get_context(), is_allowed_exception(), is_allowed_rgba(), is_inside_block(), load_css_variables(), main(), print_result(), print_summary() (+4 more)

### Community 14 - "App.jsx"
Cohesion: 0.18
Nodes (17): react-router-dom@^7.14.1, App(), AppContent(), Dashboard(), ProtectedRoute(), AnalysePage(), ResultCard(), ComparePage() (+9 more)

### Community 15 - "_palette_is_dark"
Cohesion: 0.18
Nodes (4): _palette_is_dark(), _relative_luminance(), TestEndToEndCoherence, TestLuminance

### Community 16 - "argparse"
Cohesion: 0.13
Nodes (11): _e(), generate_chart_slide(), generate_cta_slide(), generate_deck(), generate_metrics_slide(), generate_problem_slide(), generate_solution_slide(), generate_testimonial_slide() (+3 more)

### Community 18 - "backend/package.json"
Cohesion: 0.14
Nodes (19): dependencies, axios@^1.6.0, cors@^2.8.5, express@^4.19.0, form-data@^4.0.5, multer@^1.4.5-lts.1, sqlite3@^5.1.7, uuid@^14.0.0 (+11 more)

### Community 19 - "fetch-background.py"
Cohesion: 0.16
Nodes (9): generate_css_for_background(), get_background_image(), get_curated_images(), get_overlay_css(), get_pexels_search_url(), load_backgrounds_config(), load_brand_colors(), main() (+1 more)

### Community 20 - "read_rows"
Cohesion: 0.21
Nodes (3): read_rows(), TestLandingAndStackContract, TestReasoningContract

### Community 21 - "test_relevance_evaluator.py"
Cohesion: 0.12
Nodes (3): TestFixtureValidation, TestMetricMath, TestThresholdGate

### Community 23 - "server.js"
Cohesion: 0.12
Nodes (14): app, axios, cors, crypto, deleteRecursive(), express, FormData, fs (+6 more)

### Community 24 - "cip/generate.py"
Cohesion: 0.19
Nodes (7): build_cip_prompt(), check_logo_required(), generate_cip_set(), generate_with_nano_banana(), load_env(), load_logo_image(), main()

### Community 25 - "fontSize"
Cohesion: 0.12
Nodes (16): $type, $value, $type, $value, $type, $value, $type, $value (+8 more)

### Community 29 - "extract-colors.cjs"
Cohesion: 0.22
Nodes (11): calculateCompliance(), colorDistance(), displayPalette(), extractHexColors(), findNearestBrandColor(), fs, generateImageMagickCommand(), hexToRgb() (+3 more)

### Community 30 - "validate-asset.cjs"
Cohesion: 0.25
Nodes (13): checkManifest(), formatBytes(), formatOutput(), fs, main(), parseFilename(), path, RULES (+5 more)

### Community 31 - "cip/core.py"
Cohesion: 0.20
Nodes (6): detect_domain(), get_cip_brief(), _load_csv(), search(), search_all(), _search_csv()

### Community 33 - "TestWebStackFreshness"
Cohesion: 0.08
Nodes (4): _rows(), TestNativeDesktopStackFreshness, _rows(), TestWebStackFreshness

### Community 34 - "logo/core.py"
Cohesion: 0.21
Nodes (5): detect_domain(), _load_csv(), search(), search_all(), _search_csv()

### Community 36 - "_select_palette_for_mode"
Cohesion: 0.22
Nodes (4): _contrast_ratio(), _derive_dark_palette(), _select_palette_for_mode(), TestPaletteSelection

### Community 37 - "json"
Cohesion: 0.20
Nodes (4): apply_decision_rules(), _object_without_duplicates(), parse_decision_rules(), _validate_action()

### Community 40 - "render-html.py"
Cohesion: 0.23
Nodes (4): generate_html(), get_deliverable_info(), get_image_base64(), main()

### Community 41 - "validate-tokens.cjs"
Cohesion: 0.24
Nodes (11): extensions, formatReport(), fs, getFiles(), main(), parseArgs(), path, patterns (+3 more)

### Community 42 - "test_design_system_mode.py"
Cohesion: 0.14
Nodes (6): _filter_anti_patterns_for_mode(), _query_wants_dark(), _resolve_color_mode(), _style_is_dark_primary(), TestAntiPatternGating, TestModeResolution

### Community 43 - "inject-brand-context.cjs"
Cohesion: 0.31
Nodes (10): extractColorsFromTable(), extractCoreAttributes(), extractHexColors(), extractImageStyle(), extractTypography(), extractVoice(), fs, generatePromptAddition() (+2 more)

### Community 44 - "sync-brand-to-tokens.cjs"
Cohesion: 0.25
Nodes (8): adjustBrightness(), { execFileSync }, extractColorsFromMarkdown(), fs, generateColorScale(), main(), path, updateDesignTokens()

### Community 45 - "embed-tokens.cjs"
Cohesion: 0.18
Nodes (8): args, fs, minimal, MINIMAL_TOKENS, path, projectRoot, tokensPath, wrapStyle

### Community 46 - "primitive"
Cohesion: 0.18
Nodes (11): fast, normal, slow, $type, $value, $type, $value, primitive (+3 more)

### Community 49 - "generate-tokens.cjs"
Cohesion: 0.36
Nodes (9): flattenTokens(), fs, generateCSS(), generateTailwind(), main(), parseArgs(), path, resolveReference() (+1 more)

### Community 54 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, axios@^1.15.0, lucide-react@^1.8.0, react@^19.2.4, react-dom@^19.2.4, wavesurfer.js@^7.8.2, axios, react-dom (+1 more)

### Community 55 - "cip/search.py"
Cohesion: 0.32
Nodes (3): format_brief(), format_results(), main()

### Community 56 - "radius"
Cohesion: 0.29
Nodes (8): $type, $value, $type, $value, radius, default, full, default

### Community 59 - "csv"
Cohesion: 0.22
Nodes (3): read_rows(), read_rows(), TestTextLayoutDataContracts

### Community 60 - "shadow"
Cohesion: 0.47
Nodes (6): sm, shadow, sm, sm, $type, $value

### Community 62 - "test_core.py"
Cohesion: 0.10
Nodes (5): format_markdown(), generate_design_system(), format_output(), TestDiagnosticsContracts, TestPersistence

### Community 64 - "auth.js"
Cohesion: 0.33
Nodes (5): bcrypt@^6.0.0, bcrypt, comparePassword(), hashPassword(), bcrypt

### Community 65 - "ref_path"
Cohesion: 0.33
Nodes (4): db, dbPath, path, sqlite3

### Community 66 - "lg"
Cohesion: 0.60
Nodes (5): lg, $type, $value, lg, lg

### Community 68 - "db.js"
Cohesion: 0.40
Nodes (4): db, dbPath, path, sqlite3

### Community 69 - "authMiddleware.js"
Cohesion: 0.40
Nodes (4): authenticateUser(), jwt, jsonwebtoken@^9.0.3, jsonwebtoken

### Community 70 - "pages/AnalysePage.jsx"
Cohesion: 0.50
Nodes (4): framer-motion@^12.38.0, AnalysePage(), ResultCard(), framer-motion

### Community 71 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

### Community 72 - "xl"
Cohesion: 0.67
Nodes (4): xl, xl, $type, $value

### Community 73 - "md"
Cohesion: 0.67
Nodes (4): $type, $value, md, md

### Community 74 - "none"
Cohesion: 0.67
Nodes (4): $type, $value, none, none

### Community 75 - "scripts"
Cohesion: 0.67
Nodes (3): scripts, dev, start

### Community 80 - "split_values"
Cohesion: 0.47
Nodes (3): split_values(), style_identities(), TestStyleIdentityContract

## Knowledge Gaps
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `TailwindConfigGenerator` connect `TailwindConfigGenerator` to `.validate_config`, `.generate_config_string`, `pathlib`, `main`, `.add_colors`, `TestTailwindConfigGenerator`, `._base_config`, `.add_plugins`, `.write_config`, `.recommend_plugins`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `TailwindConfigGenerator` (e.g. with `TestGeneratedConfigIsValidJs` and `TestTailwindConfigGenerator`) actually correct?**
  _`TailwindConfigGenerator` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `validate_data.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06025039123630673 - nodes in this community are weakly interconnected._
- **Why does `ShadcnInstaller` connect `ShadcnInstaller` to `pathlib`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `DesignSystemGenerator` (e.g. with `TestReasoningMatch` and `TestReasoningContract`) actually correct?**
  _`DesignSystemGenerator` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `ShadcnInstaller` be split into smaller, more focused modules?**
  _Cohesion score 0.053555750658472345 - nodes in this community are weakly interconnected._
- **Why does `main()` connect `main` to `.validate_config`, `.generate_config_string`, `.add_plugins`, `pathlib`, `.add_colors`, `argparse`, `TailwindConfigGenerator`, `.write_config`, `.recommend_plugins`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._