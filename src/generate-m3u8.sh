#!/usr/bin/env bash

echo "GENERATING M3U8"

videoFiles="${1}"
output="${2}"

ffmpeg -i ${videoFiles} -g 60 -hls_time 10 "${output}.m3u8"

echo "M3U8 PLAYLIST GENERATED"