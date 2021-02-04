#!/usr/bin/env bash

echo "GENERATING MPD"

videoFiles="${1}"
output="${2}"

# MP4Box is a part of FFMPEG as I understand, so we can use it from command line
MP4Box -dash 2000 -rap -frag-rap -bs-switching no -profile "dashavc264:live" ${videoFiles} -out "${output}.mpd"

echo "MPD MANIFEST GENERATED"