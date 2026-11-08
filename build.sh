#!/bin/sh
# Builds index.html (the whole app) from the files in src/
cd "$(dirname "$0")/src" || exit 1
cat p2.js p3.js p4.js p5.js p6.js p7.js p9a.js p9b.js p8.js > all.js && node --check all.js \
 && { cat p1.html; echo '<script>'; cat all.js; echo '</script>'; } > ../index.html && rm all.js && echo built
