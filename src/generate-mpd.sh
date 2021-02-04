#!/usr/bin/env bash

echo "GENERATING MPD"

videoFiles="${1}"
output="${2}"

MP4Box -dash 2000 -rap -frag-rap -bs-switching no -profile "dashavc264:live" ${videoFiles} -out "${output}.mpd"

echo "MPD MANIFEST GENERATED"