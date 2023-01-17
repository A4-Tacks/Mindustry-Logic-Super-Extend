#!/usr/bin/bash

OIFS="$IFS"

cd "$(dirname "$0")"

proot="$(pwd -P)"

cd "$proot/src"

DATE_FORMAT="%Y-%m-%d_%H-%M-%S"


output_path="$proot/backup"
script_path="$proot/${0##*/}"

echo "${output_path@A}"
echo "${script_path@A}"
echo "${PWD@A}"

while true
do
    [ -f "$script_path" ]||{
        echo "script file not exists, exit."
        exit 8
    }
    IFS=$'\n'
    files=($(find -name "*.bak"))
    IFS="$OIFS"
    for i in "${files[@]}"
    do
        [ -f "$i" ] || {
            echo "${i@Q} is not a file, skip"
            continue
        }
        s="${i%.*}"
        mv -v "$i" "$output_path/${s##*/}_$(date +"$DATE_FORMAT" -r "$i").bak"
    sleep 0.5
    done
done