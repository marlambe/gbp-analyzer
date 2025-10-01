15:31:40.305 Running build in Washington, D.C., USA (East) – iad1
15:31:40.306 Build machine configuration: 2 cores, 8 GB
15:31:40.327 Cloning github.com/marlambe/gbp-analyzer (Branch: main, Commit: da490a9)
15:31:40.368 Skipping build cache, deployment was triggered without cache.
15:31:40.655 Cloning completed: 328.000ms
15:31:40.992 Running "vercel build"
15:31:41.431 Vercel CLI 48.1.6
15:31:41.742 Installing dependencies...
15:32:04.621 npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
15:32:04.713 npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
15:32:05.369 npm warn deprecated glob@7.1.7: Glob versions prior to v9 are no longer supported
15:32:05.450 npm warn deprecated @humanwhocodes/object-schema@2.0.3: Use @eslint/object-schema instead
15:32:05.620 npm warn deprecated @humanwhocodes/config-array@0.13.0: Use @eslint/config-array instead
15:32:06.875 npm warn deprecated eslint@8.57.1: This version is no longer supported. Please see https://eslint.org/version-support for other options.
15:32:10.525 
15:32:10.525 added 423 packages in 29s
15:32:10.525 
15:32:10.525 161 packages are looking for funding
15:32:10.525   run `npm fund` for details
15:32:10.583 Detected Next.js version: 14.0.0
15:32:10.588 Running "npm run build"
15:32:10.825 
15:32:10.826 > gbp-analyzer@1.0.0 build
15:32:10.826 > next build
15:32:10.826 
15:32:11.332 Attention: Next.js now collects completely anonymous telemetry regarding usage.
15:32:11.333 This information is used to shape Next.js' roadmap and prioritize features.
15:32:11.333 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
15:32:11.333 https://nextjs.org/telemetry
15:32:11.333 
15:32:11.425    Linting and checking validity of types ...
15:32:11.591    ▲ Next.js 14.0.0
15:32:11.592 
15:32:11.592    Creating an optimized production build ...
15:32:13.088 Failed to compile.
15:32:13.089 
15:32:13.090 ./pages/api/analyze-with-ai.js
15:32:13.090 Error: 
15:32:13.090   [31mx[0m Expected ';', '}' or <eof>
15:32:13.090      ,-[[36;1;4m/vercel/path0/pages/api/analyze-with-ai.js[0m:205:1]
15:32:13.094  [2m205[0m | - Show your calculation work in calculationNotes
15:32:13.094  [2m206[0m | - Be specific about ${businessName}'s exact situation`;
15:32:13.094  [2m207[0m | 
15:32:13.094  [2m208[0m | ACTUAL BUSINESS DATA (USE THESE EXACT NUMBERS):
15:32:13.094      : [31;1m^^^|^^[0m[33;1m ^^^^^^^^[0m
15:32:13.094      :    [31;1m`-- [31;1mThis is the expression part of an expression statement[0m[0m
15:32:13.094  [2m209[0m | - Current Rating: ${placeDetails.rating || 0}/5 stars
15:32:13.094  [2m210[0m | - Total Reviews: ${placeDetails.user_ratings_total || placeDetails.reviewCount || 0}
15:32:13.094  [2m211[0m | - Total Photos: ${placeDetails.photos?.length || placeDetails.photoCount || 0}
15:32:13.095      `----
15:32:13.095 
15:32:13.095 Caused by:
15:32:13.095     Syntax Error
15:32:13.095 
15:32:13.095 Import trace for requested module:
15:32:13.095 ./pages/api/analyze-with-ai.js
15:32:13.095 
15:32:13.095 
15:32:13.095 > Build failed because of webpack errors
15:32:13.115 Error: Command "npm run build" exited with 1
