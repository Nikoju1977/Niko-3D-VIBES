# NIKO Native V5 candidate

The live app now imports niko-native.js and the angle-based NikoGesture. The old engine.js remains in Git and its regression tests, but is excluded from the static build and service worker. NOTICE.txt and LICENSE.md are unchanged: this is not a legal determination of independent authorship, and no existing MIT rights are withdrawn. The landmark conventions and other third-party dependencies remain applicable. The old source was inspected for compatibility; no certified clean-room process.

Cadence uses bilateral knee-flexion angle differences, timestamp-based smoothing, alternating threshold crossings, median inter-event interval and dispersion rejection. Counts are detected alternations, not measured footsteps. The estimator assumes alternating knee motion and can misinterpret other rhythmic movements; no physical reference or clinical validation. Low-rate, occluded or irregular signals can be rejected. Thresholds are experimental. The existing measurement gate and encrypted export remain. Robot commands retain their existing virtual UI semantics; no physical actuation or claim of a fully independent robot engine.

Synthetic comparison is limited to one knee-phase fixture; it does not establish superior real-world accuracy. Prior source code and tests remain accessible in the repository. No change of license or deployment without approval.
