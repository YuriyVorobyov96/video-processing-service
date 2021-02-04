#!/usr/bin/env bash

echo "GENERATING MPD"

videoFiles="${1}"
output="${2}"

# ffmpeg -i ${videoFiles} -g 60 -hls_time 10 "${output}.mpd"

MP4Box -dash 2000 -rap -frag-rap -bs-switching no -profile "dashavc264:live" ${videoFiles} -out "${output}.mpd"

echo "MPD MANIFEST GENERATED"